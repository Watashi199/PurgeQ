"""Security utilities including API key validation."""
import hmac
from typing import Optional

from fastapi.security import APIKeyHeader

from .config import get_settings
from .exceptions import APIKeyInvalidException

settings = get_settings()

api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


async def verify_api_key(api_key: Optional[str] = None) -> bool:
    """Verify API key validity using a constant-time comparison.

    Args:
        api_key: API key to verify

    Returns:
        bool: True if key is valid

    Raises:
        APIKeyInvalidException: If key is invalid or missing
    """
    if not api_key:
        raise APIKeyInvalidException("API key is missing")

    valid = False
    for candidate in settings.VALID_API_KEYS:
        if hmac.compare_digest(api_key, candidate):
            valid = True
            # Don't break early — keep loop work proportional to the
            # configured key count, not the matching index.
    if not valid:
        raise APIKeyInvalidException("Invalid API key")

    return True
