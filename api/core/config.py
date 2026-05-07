"""Application configuration."""
import json
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

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
    VALID_API_KEYS: list[str] = []

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

    @field_validator("VALID_API_KEYS", "ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_list(cls, value):
        """Accept either JSON list or comma-separated string."""
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
