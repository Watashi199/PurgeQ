"""API routes for banlist operations."""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
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
