"""Security utilities including API key validation."""
import hashlib
import hmac
import secrets
from typing import Optional
from uuid import UUID

from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .exceptions import APIKeyInvalidException

settings = get_settings()

api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


def hash_api_key(api_key: str) -> str:
    """Deterministically hash an API key for indexed lookups.

    Uses HMAC-SHA256 with a server-side pepper. The output is hex-encoded
    so it fits in a String(64) column.
    """
    pepper = settings.API_KEY_PEPPER.encode() if settings.API_KEY_PEPPER else b""
    return hmac.new(pepper, api_key.encode(), hashlib.sha256).hexdigest()


def generate_api_key() -> str:
    """Generate a new high-entropy API key (~256 bits, URL-safe)."""
    return secrets.token_urlsafe(32)


async def resolve_namespace(
    api_key: Optional[str],
    db: Optional[AsyncSession] = None,
) -> UUID:
    """Validate `api_key` and return the namespace it owns.

    Behaviour depends on `MULTI_TENANT`:
    - False: keys come from `VALID_API_KEYS`; all keys map to the sentinel
      self-hosted namespace.
    - True: keys live in the `api_keys` table; the matching row's UUID is
      the namespace, and `last_seen_at` is bumped on success.

    Raises:
        APIKeyInvalidException: if the key is missing or unknown.
    """
    # Imported lazily to avoid a circular import at module load time.
    from api.models import SELF_HOSTED_NAMESPACE_ID, ApiKey

    if not api_key:
        raise APIKeyInvalidException("API key is missing")

    if not settings.MULTI_TENANT:
        for candidate in settings.VALID_API_KEYS:
            if hmac.compare_digest(api_key, candidate):
                return SELF_HOSTED_NAMESPACE_ID
        raise APIKeyInvalidException("Invalid API key")

    if db is None:
        # In multi-tenant mode the lookup needs a DB session.
        raise APIKeyInvalidException("Invalid API key")

    key_hash = hash_api_key(api_key)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
    record = result.scalar_one_or_none()
    if record is None:
        raise APIKeyInvalidException("Invalid API key")

    # Touch last_seen_at for activity tracking. Using SQL update rather than
    # mutating the ORM object keeps the call non-blocking on the read path.
    from datetime import datetime, timezone

    record.last_seen_at = datetime.now(timezone.utc)
    await db.flush()

    return UUID(record.id)
