"""Discord OAuth flow for the public-hosted multi-tenant mode."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode
from uuid import uuid4

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import generate_api_key, get_redis_client, get_settings, hash_api_key
from api.models import ApiKey

logger = logging.getLogger(__name__)
settings = get_settings()

DISCORD_AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/users/@me"

# Random state lives ~10 minutes — long enough for the user to click through
# Discord's consent screen but short enough to limit replay attacks.
STATE_TTL_SECONDS = 600


def is_configured() -> bool:
    """Return True when every Discord OAuth setting is present."""
    return bool(
        settings.MULTI_TENANT
        and settings.DISCORD_CLIENT_ID
        and settings.DISCORD_CLIENT_SECRET
        and settings.DISCORD_REDIRECT_URI
    )


async def issue_state() -> str:
    """Generate and store a one-shot OAuth state token."""
    state = secrets.token_urlsafe(24)
    redis = await get_redis_client()
    await redis.setex(f"discord:state:{state}", STATE_TTL_SECONDS, "1")
    return state


async def consume_state(state: str) -> bool:
    """Atomically validate and consume an OAuth state token."""
    if not state:
        return False
    redis = await get_redis_client()
    key = f"discord:state:{state}"
    # `getdel` removes the key in the same round-trip — no replay possible.
    value = await redis.getdel(key)
    return value is not None


def build_authorize_url(state: str) -> str:
    """Build the Discord authorize URL for the consent redirect."""
    query = urlencode(
        {
            "client_id": settings.DISCORD_CLIENT_ID,
            "redirect_uri": settings.DISCORD_REDIRECT_URI,
            "response_type": "code",
            "scope": "identify",
            "state": state,
            "prompt": "none",
        }
    )
    return f"{DISCORD_AUTHORIZE_URL}?{query}"


async def _exchange_code(code: str) -> Optional[str]:
    """Exchange an authorization code for a Discord access token."""
    data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(DISCORD_TOKEN_URL, data=data, headers=headers)
        if response.status_code != 200:
            logger.warning("Discord token exchange failed: %s", response.text)
            return None
        return response.json().get("access_token")
    except httpx.HTTPError:
        logger.exception("Discord token exchange HTTP error")
        return None


async def _fetch_user_id(access_token: str) -> Optional[str]:
    """Resolve the Discord user ID from an access token (scope=identify)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                DISCORD_USER_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if response.status_code != 200:
            return None
        return response.json().get("id")
    except httpx.HTTPError:
        logger.exception("Discord user fetch HTTP error")
        return None


async def claim_or_create_key(db: AsyncSession, code: str) -> Optional[str]:
    """Run the full OAuth handshake and return a fresh API key.

    The `ApiKey.id` is the namespace identifier and stays constant across
    re-logins — only `key_hash` is rotated. That's how recovery preserves
    the user's banlist: existing `banlist_items.namespace_id` rows still
    point at the same UUID, the new key just unlocks the same drawer.

    For a brand new Discord user we create the row from scratch.
    """
    access_token = await _exchange_code(code)
    if not access_token:
        return None

    discord_id = await _fetch_user_id(access_token)
    if not discord_id:
        return None

    new_key = generate_api_key()
    key_hash = hash_api_key(new_key)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(ApiKey).where(ApiKey.discord_user_id == discord_id)
    )
    record = result.scalar_one_or_none()

    if record is None:
        record = ApiKey(
            id=str(uuid4()),
            key_hash=key_hash,
            discord_user_id=discord_id,
            created_at=now,
            last_seen_at=now,
        )
        db.add(record)
    else:
        record.key_hash = key_hash
        record.last_seen_at = now

    await db.commit()
    return new_key
