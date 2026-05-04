"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class BanlistItemBase(BaseModel):
    """Base schema for banlist items."""

    faceit_name: str = Field(..., min_length=2, max_length=32, description="FACEIT player name")
    reason: str = Field(..., min_length=1, max_length=250, description="Ban reason")
    author: str = Field(..., min_length=2, max_length=32, description="Author name")

    @field_validator("faceit_name")
    @classmethod
    def validate_faceit_name(cls, v: str) -> str:
        """Validate FACEIT name format."""
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("FACEIT name can only contain letters, numbers, hyphens, and underscores")
        return v


class BanlistItemCreate(BanlistItemBase):
    """Schema for creating banlist items."""

    pass


class BanlistItemUpdate(BaseModel):
    """Schema for updating banlist items."""

    reason: Optional[str] = Field(None, min_length=1, max_length=250)
    author: Optional[str] = Field(None, min_length=2, max_length=32)


class BanlistItemResponse(BanlistItemBase):
    """Schema for banlist item response."""

    id: str = Field(..., description="Item ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        """Pydantic config."""

        from_attributes = True


class BanlistResponse(BaseModel):
    """Schema for full banlist response."""

    items: list[BanlistItemResponse] = Field(default_factory=list)
    count: int = Field(default=0)


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(default="ok")
    database: str = Field(default="ok")
    cache: str = Field(default="ok")
