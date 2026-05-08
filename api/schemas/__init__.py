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


# --- Import ---

# Cap to keep imports cheap and avoid being trivially DoSed.
IMPORT_MAX_ITEMS = 1000


class BanlistImportItem(BaseModel):
    """A single row in an import payload.

    Permissive on purpose: the per-row validation happens in the service
    so individual bad rows surface in `failed[]` instead of 422-ing the
    entire batch.
    """

    faceit_name: str
    reason: str | None = None
    author: str | None = None


class BanlistImportRequest(BaseModel):
    """Bulk-import request body.

    Items can be supplied as objects (with optional reason/author) or as
    bare strings (just the FACEIT name). Anything missing is filled in
    from `default_reason` / `default_author`.
    """

    items: list[BanlistImportItem | str] = Field(default_factory=list)
    default_reason: str = Field(default="Imported", min_length=1, max_length=250)
    default_author: str = Field(..., min_length=2, max_length=32)


class BanlistImportFailure(BaseModel):
    """A row we couldn't import, with the original input and a short reason."""

    input: str
    reason: str


class BanlistImportResult(BaseModel):
    """Per-import summary returned to the caller."""

    imported: int = 0
    skipped: list[str] = Field(default_factory=list)  # duplicates, by faceit_name
    failed: list[BanlistImportFailure] = Field(default_factory=list)
