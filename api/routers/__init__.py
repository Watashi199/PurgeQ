"""API routes for banlist operations."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    get_db_session,
    verify_api_key,
    api_key_header,
    check_rate_limit,
    get_redis_client,
    BanlistItemNotFound,
    DuplicateItemException,
    ValidationException,
    DatabaseException,
    RateLimitException,
    APIKeyInvalidException,
)
from api.schemas import (
    BanlistItemCreate,
    BanlistItemResponse,
    BanlistItemUpdate,
    BanlistResponse,
    HealthResponse,
)
from api.services import BanlistService

router = APIRouter(prefix="/api/v1", tags=["banlist"])


@router.get("/banlist", response_model=BanlistResponse, summary="Get complete banlist")
async def get_banlist(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> BanlistResponse:
    """Get complete FACEIT banlist.

    Returns:
        BanlistResponse: List of all banned players
    """
    try:
        service = BanlistService(db)
        items = await service.get_all_items()
        return BanlistResponse(items=items, count=len(items))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve banlist: {str(e)}",
        )


@router.post("/ban", response_model=BanlistItemResponse, status_code=status.HTTP_201_CREATED, summary="Add player to banlist")
async def add_ban(
    ban_data: BanlistItemCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> BanlistItemResponse:
    """Add a player to the banlist.

    Args:
        ban_data: Ban details
        db: Database session
        request: HTTP request
        api_key: API key from header

    Returns:
        BanlistItemResponse: Created banlist item
    """
    try:
        # Verify API key
        await verify_api_key(api_key)

        # Check rate limit
        client_ip = request.client.host if request.client else "unknown"
        redis = await get_redis_client()
        await check_rate_limit(client_ip, redis)

        # Create item
        service = BanlistService(db)
        return await service.create_item(ban_data)

    except APIKeyInvalidException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except RateLimitException as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    except DuplicateItemException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.delete("/ban/{faceit_name}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove player from banlist")
async def remove_ban(
    faceit_name: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
    api_key: Annotated[Optional[str], Depends(api_key_header)] = None,
) -> None:
    """Remove a player from the banlist.

    Args:
        faceit_name: FACEIT player name
        db: Database session
        request: HTTP request
        api_key: API key from header
    """
    try:
        # Verify API key
        await verify_api_key(api_key)

        # Check rate limit
        client_ip = request.client.host if request.client else "unknown"
        redis = await get_redis_client()
        await check_rate_limit(client_ip, redis)

        # Delete item
        service = BanlistService(db)
        await service.delete_item(faceit_name)

    except APIKeyInvalidException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except RateLimitException as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    except BanlistItemNotFound as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/health", response_model=HealthResponse, summary="Health check endpoint")
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> HealthResponse:
    """Check application health status.

    Returns:
        HealthResponse: Health status
    """
    try:
        service = BanlistService(db)
        db_healthy = await service.health_check()

        # Check Redis
        try:
            redis = await get_redis_client()
            await redis.ping()
            cache_healthy = True
        except Exception:
            cache_healthy = False

        return HealthResponse(
            status="ok",
            database="ok" if db_healthy else "degraded",
            cache="ok" if cache_healthy else "degraded",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
