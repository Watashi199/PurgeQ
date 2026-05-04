"""Custom exceptions for the application."""


class PurgeQException(Exception):
    """Base exception for PurgeQ."""

    pass


class APIKeyInvalidException(PurgeQException):
    """Raised when API key is invalid or missing."""

    pass


class RateLimitException(PurgeQException):
    """Raised when rate limit is exceeded."""

    pass


class BanlistItemNotFound(PurgeQException):
    """Raised when banlist item is not found."""

    pass


class DuplicateItemException(PurgeQException):
    """Raised when trying to add duplicate banlist item."""

    pass


class ValidationException(PurgeQException):
    """Raised when validation fails."""

    pass


class DatabaseException(PurgeQException):
    """Raised when database operation fails."""

    pass
