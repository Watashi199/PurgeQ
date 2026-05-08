"""Redis cache management.

All operations fail soft: if Redis is unreachable we log and continue
without the cache rather than taking the API down.
"""
import json
import logging
from typing import Any, Optional
from uuid import UUID

from redis.asyncio import Redis
from redis.exceptions import RedisError

from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis_client: Optional[Redis] = None


async def get_redis_client() -> Redis:
    """Get or create the shared Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def close_redis_client() -> None:
    """Close the shared Redis client."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


def banlist_cache_key(namespace_id: UUID) -> str:
    """Compute the namespace-scoped cache key for the full banlist."""
    return f"banlist:{namespace_id}"


async def get_cache(key: str) -> Optional[Any]:
    try:
        redis = await get_redis_client()
        value = await redis.get(key)
    except RedisError:
        logger.warning("Cache GET failed for %s", key, exc_info=True)
        return None
    if value:
        return json.loads(value)
    return None


async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> None:
    try:
        redis = await get_redis_client()
        await redis.setex(key, ttl or settings.CACHE_TTL, json.dumps(value))
    except RedisError:
        logger.warning("Cache SET failed for %s", key, exc_info=True)


async def delete_cache(key: str) -> None:
    try:
        redis = await get_redis_client()
        await redis.delete(key)
    except RedisError:
        logger.warning("Cache DELETE failed for %s", key, exc_info=True)


async def invalidate_banlist_cache(namespace_id: UUID) -> None:
    """Drop the cached banlist for one namespace."""
    await delete_cache(banlist_cache_key(namespace_id))
