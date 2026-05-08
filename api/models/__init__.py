"""Database models."""
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from api.core.database import Base

# Sentinel namespace used for self-hosted (single-tenant) installs so that
# `banlist_items.namespace_id` can stay NOT NULL with a stable default.
SELF_HOSTED_NAMESPACE_ID = UUID("00000000-0000-0000-0000-000000000001")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApiKey(Base):
    """An API key owns a banlist namespace.

    In multi-tenant mode every key has a row here. In self-hosted mode the
    table is empty and authentication falls back to `VALID_API_KEYS`.
    """

    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    # HMAC-SHA256(key, pepper). Deterministic so we can index it for O(log n)
    # lookups while still avoiding storing the raw key.
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    # Discord user ID this key belongs to. Used to recover the key by
    # re-authenticating with Discord.
    discord_user_id: Mapped[str | None] = mapped_column(
        String(32), nullable=True, unique=True, index=True
    )
    # Optional human label set by the owner.
    label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, discord_user_id={self.discord_user_id})>"


class BanlistItem(Base):
    """Banlist item model."""

    __tablename__ = "banlist_items"
    __table_args__ = (
        UniqueConstraint("namespace_id", "faceit_name", name="uq_banlist_namespace_name"),
    )

    id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    # Namespace ownership. In multi-tenant mode this references api_keys.id;
    # in self-hosted mode it always holds SELF_HOSTED_NAMESPACE_ID. We don't
    # declare a hard FK so the column behaves the same in both modes (the
    # api_keys table may not even contain the sentinel row).
    namespace_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False),
        nullable=False,
        default=lambda: str(SELF_HOSTED_NAMESPACE_ID),
        index=True,
    )
    faceit_name: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(250), nullable=False)
    author: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )

    def __repr__(self) -> str:
        return (
            f"<BanlistItem(id={self.id}, faceit_name={self.faceit_name}, "
            f"namespace={self.namespace_id})>"
        )


# Silence unused-import linters: ForeignKey may be reused later for sub-keys.
_ = ForeignKey
