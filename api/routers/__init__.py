"""API routes for banlist operations."""
import csv
import io
import json
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    api_key_header,
    check_rate_limit,
    get_db_session,
    get_redis_client,
    get_settings,
    resolve_namespace,
)
from api.models import SELF_HOSTED_NAMESPACE_ID
from api.schemas import (
    IMPORT_MAX_ITEMS,
    BanlistImportRequest,
    BanlistImportResult,
    BanlistItemCreate,
    BanlistItemResponse,
    BanlistResponse,
    HealthResponse,
)
from api.services import BanlistService

settings = get_settings()
router = APIRouter(prefix="/api/v1", tags=["banlist"])


async def _rate_limit(request: Request, identifier: str) -> None:
    redis = await get_redis_client()
    await check_rate_limit(identifier, redis)


async def _resolve_read_namespace(
    db: AsyncSession,
    api_key: Optional[str],
) -> UUID:
    """In multi-tenant mode reads must be authenticated; in self-hosted mode
    GET /banlist stays public and uses the sentinel namespace."""
    if settings.MULTI_TENANT:
        return await resolve_namespace(api_key, db)
    return SELF_HOSTED_NAMESPACE_ID


@router.get("/banlist", response_model=BanlistResponse, summary="Get complete banlist")
async def get_banlist(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> BanlistResponse:
    """Get the banlist for the namespace owning the supplied API key.

    In self-hosted mode the endpoint stays public and returns the global list.
    """
    client_ip = request.client.host if request.client else "unknown"
    await _rate_limit(request, client_ip)

    namespace_id = await _resolve_read_namespace(db, api_key)
    service = BanlistService(db, namespace_id)
    items = await service.get_all_items()
    return BanlistResponse(items=items, count=len(items))


@router.post(
    "/ban",
    response_model=BanlistItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add player to banlist",
)
async def add_ban(
    ban_data: BanlistItemCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> BanlistItemResponse:
    """Add a player to the banlist."""
    namespace_id = await resolve_namespace(api_key, db)

    client_ip = request.client.host if request.client else "unknown"
    await _rate_limit(request, client_ip)

    service = BanlistService(db, namespace_id)
    return await service.create_item(ban_data)


@router.post(
    "/banlist/import",
    response_model=BanlistImportResult,
    summary="Import a banlist (JSON or CSV)",
)
async def import_banlist(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> BanlistImportResult:
    """Bulk-import banlist entries.

    Accepts either:
    - `Content-Type: application/json` with the `BanlistImportRequest`
      schema, or
    - `Content-Type: text/csv` with a CSV body. The first row is treated
      as a header; columns named `faceit_name` (or `name`/`nickname`),
      `reason`, `author` are recognised. The CSV body must be paired
      with `?author=…` (and optionally `?reason=…`) query params, since
      the CSV format itself doesn't carry defaults.
    """
    namespace_id = await resolve_namespace(api_key, db)

    client_ip = request.client.host if request.client else "unknown"
    await _rate_limit(request, client_ip)

    payload = await _parse_import_payload(request)
    if len(payload.items) > IMPORT_MAX_ITEMS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Import is capped at {IMPORT_MAX_ITEMS} items per request",
        )
    if not payload.items:
        return BanlistImportResult()

    service = BanlistService(db, namespace_id)
    return await service.bulk_import(payload)


async def _parse_import_payload(request: Request) -> BanlistImportRequest:
    """Build a `BanlistImportRequest` from either a JSON or CSV body."""
    content_type = (request.headers.get("content-type") or "").split(";")[0].strip()

    if content_type == "text/csv":
        text = (await request.body()).decode("utf-8", errors="replace")
        items = _parse_csv(text)
        author = request.query_params.get("author") or ""
        reason = request.query_params.get("reason") or "Imported"
        if not author:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV import requires ?author=… in the query string",
            )
        try:
            return BanlistImportRequest(
                items=items, default_author=author, default_reason=reason
            )
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=e.errors(),
            )

    # Default to JSON parsing.
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Body must be JSON or text/csv",
        )
    try:
        return BanlistImportRequest.model_validate(body)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors(),
        )


def _parse_csv(text: str) -> list[dict | str]:
    """Parse a CSV body into a list of rows compatible with BanlistImportItem.

    Recognised header aliases: `faceit_name` ↔ `name` ↔ `nickname` ↔ `player`.
    If no header is present, the first column is treated as the FACEIT name.
    """
    text = text.lstrip("﻿")  # strip optional UTF-8 BOM
    reader = csv.reader(io.StringIO(text))
    rows = [r for r in reader if any(cell.strip() for cell in r)]
    if not rows:
        return []

    name_aliases = {"faceit_name", "name", "nickname", "player"}
    header_lower = [c.strip().lower() for c in rows[0]]
    has_header = any(c in name_aliases for c in header_lower)

    items: list[dict | str] = []
    if has_header:
        idx = {col: i for i, col in enumerate(header_lower)}
        name_col = next(idx[a] for a in name_aliases if a in idx)
        reason_col = idx.get("reason")
        author_col = idx.get("author")
        for row in rows[1:]:
            if name_col >= len(row):
                continue
            entry: dict = {"faceit_name": row[name_col].strip()}
            if reason_col is not None and reason_col < len(row):
                entry["reason"] = row[reason_col].strip() or None
            if author_col is not None and author_col < len(row):
                entry["author"] = row[author_col].strip() or None
            items.append(entry)
    else:
        # No header: treat the first column as the name across all rows.
        for row in rows:
            if row:
                items.append(row[0].strip())
    return items


@router.delete(
    "/ban/{faceit_name}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove player from banlist",
)
async def remove_ban(
    faceit_name: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> None:
    """Remove a player from the banlist."""
    namespace_id = await resolve_namespace(api_key, db)

    client_ip = request.client.host if request.client else "unknown"
    await _rate_limit(request, client_ip)

    service = BanlistService(db, namespace_id)
    await service.delete_item(faceit_name)


@router.get("/health", response_model=HealthResponse, summary="Health check endpoint")
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> HealthResponse:
    """Check application health status."""
    service = BanlistService(db, SELF_HOSTED_NAMESPACE_ID)
    db_healthy = await service.health_check()

    try:
        redis = await get_redis_client()
        await redis.ping()
        cache_healthy = True
    except Exception:
        cache_healthy = False

    return HealthResponse(
        status="ok" if db_healthy and cache_healthy else "degraded",
        database="ok" if db_healthy else "degraded",
        cache="ok" if cache_healthy else "degraded",
    )
