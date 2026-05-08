"""Pydantic schemas for request/response validation."""
import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

# FACEIT names: 2-32 ASCII alphanumeric, hyphens or underscores.
# Restricting to ASCII (rather than Unicode-aware isalnum) avoids visually
# similar look-alike attacks and matches the regex enforced client-side.
_FACEIT_NAME_RE = re.compile(r"^[A-Za-z0-9_-]{2,32}$")


class BanlistItemBase(BaseModel):
    """Base schema for banlist items."""

    faceit_name: str = Field(..., min_length=2, max_length=32, description="FACEIT player name")
    reason: str = Field(..., min_length=1, max_length=250, description="Ban reason")
    author: str = Field(..., min_length=2, max_length=32, description="Author name")

    @field_validator("faceit_name")
    @classmethod
    def validate_faceit_name(cls, v: str) -> str:
        if not _FACEIT_NAME_RE.match(v):
            raise ValueError(
                "FACEIT name must be 2-32 ASCII letters, digits, hyphens or underscores"
            )
        return v

    @field_validator("reason", "author")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class BanlistItemCreate(BanlistItemBase):
    """Schema for creating banlist items."""

    pass


class BanlistItemResponse(BanlistItemBase):
    """Schema for banlist item response."""

    id: str = Field(..., description="Item ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class BanlistResponse(BaseModel):
    """Schema for full banlist response."""

    items: list[BanlistItemResponse] = Field(default_factory=list)
    count: int = Field(default=0)


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(default="ok")
    database: str = Field(default="ok")
    cache: str = Field(default="ok")
