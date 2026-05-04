"""Security utilities including API key validation."""
import hashlib
from typing import Optional

from fastapi import HTTPException, status
from fastapi.security import APIKeyHeader

from .config import get_settings
from .exceptions import APIKeyInvalidException

settings = get_settings()

api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


async def verify_api_key(api_key: Optional[str] = None) -> bool:
    """Verify API key validity.

    Args:
        api_key: API key to verify

    Returns:
        bool: True if key is valid

    Raises:
        APIKeyInvalidException: If key is invalid or missing
    """
    if not api_key:
        raise APIKeyInvalidException("API key is missing")

    if api_key not in settings.VALID_API_KEYS:
        raise APIKeyInvalidException("Invalid API key")

    return True


def hash_password(password: str) -> str:
    """Hash a password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == hashed
