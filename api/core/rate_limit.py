"""Rate limiting using Redis."""
import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

from .cache import get_redis_client
from .config import get_settings
from .exceptions import RateLimitException

logger = logging.getLogger(__name__)
settings = get_settings()


async def check_rate_limit(identifier: str, redis: Redis | None = None) -> bool:
    """Check if a request is within the configured rate limit window.

    Fails open (allows the request) if Redis is unreachable so a Redis
    outage does not take the API down. Exceeding the limit raises
    `RateLimitException`.

    Args:
        identifier: Request identifier (e.g., IP address)
        redis: Redis client. Falls back to the shared application client.
    """
    try:
        if redis is None:
            redis = await get_redis_client()

        key = f"ratelimit:{identifier}"
        current = await redis.incr(key)
        if current == 1:
            await redis.expire(key, settings.RATE_LIMIT_PERIOD)
    except RedisError:
        logger.warning("Rate limit check skipped: Redis unavailable", exc_info=True)
        return True

    if current > settings.RATE_LIMIT_CALLS:
        raise RateLimitException(
            f"Rate limit exceeded. Max {settings.RATE_LIMIT_CALLS} requests per "
            f"{settings.RATE_LIMIT_PERIOD} seconds"
        )

    return True
