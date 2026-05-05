"""Application configuration."""
import os
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API
    API_V1_STR: str = "/api/v1"
    API_TITLE: str = "PurgeQ FACEIT Banlist API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/purgeq"
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # 1 hour
    RATE_LIMIT_CALLS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # API Key
    API_KEY_HEADER: str = "X-API-Key"
    VALID_API_KEYS: list[str] = []  # Will be set from env

    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

    # Validation
    FACEIT_NAME_MIN_LENGTH: int = 2
    FACEIT_NAME_MAX_LENGTH: int = 32
    REASON_MIN_LENGTH: int = 1
    REASON_MAX_LENGTH: int = 250
    AUTHOR_MIN_LENGTH: int = 2
    AUTHOR_MAX_LENGTH: int = 32

    # Extension
    REACT_APP_API_URL: str = "http://localhost:8000"

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = True

    def __init__(self, **data):
        """Initialize settings and parse API keys."""
        super().__init__(**data)
        # Handle VALID_API_KEYS parsing for backward compatibility
        if isinstance(self.VALID_API_KEYS, str):
            # Try to parse as JSON first, then fall back to comma-separated
            import json
            try:
                self.VALID_API_KEYS = json.loads(self.VALID_API_KEYS)
            except (json.JSONDecodeError, TypeError):
                self.VALID_API_KEYS = [
                    key.strip() for key in self.VALID_API_KEYS.split(",") if key.strip()
                ]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
