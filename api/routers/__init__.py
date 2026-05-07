"""API routes for banlist operations."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    api_key_header,
    check_rate_limit,
    get_db_session,
    get_redis_client,
    verify_api_key,
)
from api.schemas import (
    BanlistItemCreate,
    BanlistItemResponse,
    BanlistResponse,
    HealthResponse,
)
from api.services import BanlistService

router = APIRouter(prefix="/api/v1", tags=["banlist"])


@router.get("/banlist", response_model=BanlistResponse, summary="Get complete banlist")
async def get_banlist(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> BanlistResponse:
    """Get the complete FACEIT banlist."""
    service = BanlistService(db)
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
    await verify_api_key(api_key)

    client_ip = request.client.host if request.client else "unknown"
    redis = await get_redis_client()
    await check_rate_limit(client_ip, redis)

    service = BanlistService(db)
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
    await verify_api_key(api_key)

    client_ip = request.client.host if request.client else "unknown"
    redis = await get_redis_client()
    await check_rate_limit(client_ip, redis)

    service = BanlistService(db)
    await service.delete_item(faceit_name)


@router.get("/health", response_model=HealthResponse, summary="Health check endpoint")
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> HealthResponse:
    """Check application health status."""
    service = BanlistService(db)
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
