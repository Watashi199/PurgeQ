"""Rate limiting using Redis."""
from typing import Optional

import aioredis
from aioredis import Redis

from .config import get_settings
from .exceptions import RateLimitException

settings = get_settings()


async def check_rate_limit(identifier: str, redis: Optional[Redis] = None) -> bool:
    """Check if request is within rate limit.

    Args:
        identifier: Request identifier (e.g., IP address)
        redis: Redis client (uses default if not provided)

    Returns:
        bool: True if within limit

    Raises:
        RateLimitException: If rate limit exceeded
    """
    if redis is None:
        redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    key = f"ratelimit:{identifier}"

    # Get current count
    current = await redis.incr(key)

    # Set expiry on first call
    if current == 1:
        await redis.expire(key, settings.RATE_LIMIT_PERIOD)

    if current > settings.RATE_LIMIT_CALLS:
        raise RateLimitException(
            f"Rate limit exceeded. Max {settings.RATE_LIMIT_CALLS} requests per "
            f"{settings.RATE_LIMIT_PERIOD} seconds"
        )

    return True
