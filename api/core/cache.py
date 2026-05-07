"""Redis cache management."""
import json
from typing import Any, Optional

from redis.asyncio import Redis

from .config import get_settings

settings = get_settings()

_redis_client: Optional[Redis] = None


async def get_redis_client() -> Redis:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def close_redis_client() -> None:
    """Close Redis client."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache.

    Args:
        key: Cache key

    Returns:
        Cached value or None if not found
    """
    redis = await get_redis_client()
    value = await redis.get(key)
    if value:
        return json.loads(value)
    return None


async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Set value in cache.

    Args:
        key: Cache key
        value: Value to cache
        ttl: Time to live in seconds
    """
    redis = await get_redis_client()
    ttl = ttl or settings.CACHE_TTL
    await redis.setex(key, ttl, json.dumps(value))


async def delete_cache(key: str) -> None:
    """Delete value from cache.

    Args:
        key: Cache key
    """
    redis = await get_redis_client()
    await redis.delete(key)


async def invalidate_banlist_cache() -> None:
    """Invalidate banlist cache."""
    await delete_cache("banlist:all")
    await delete_cache("banlist:map")
