"""Database models."""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from api.core.database import Base


class BanlistItem(Base):
    """Banlist item model."""

    __tablename__ = "banlist_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    faceit_name: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    reason: Mapped[str] = mapped_column(String(250), nullable=False)
    author: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    __table_args__ = (
        Index("idx_faceit_name_lower", "faceit_name"),  # Case-insensitive index
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<BanlistItem(id={self.id}, faceit_name={self.faceit_name})>"
