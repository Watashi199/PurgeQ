"""FastAPI application factory."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.core import (
    APIKeyInvalidException,
    BanlistItemNotFound,
    DatabaseException,
    DuplicateItemException,
    PurgeQException,
    RateLimitException,
    ValidationException,
    close_redis_client,
    dispose_db,
    get_settings,
    init_db,
)
from api.routers import router

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    logger.info("Initializing database...")
    await init_db()
    logger.info("Application started")
    yield
    logger.info("Closing connections...")
    await close_redis_client()
    await dispose_db()
    logger.info("Application stopped")


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description="Production-ready FACEIT banlist API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS middleware. Per the CORS spec, "*" is incompatible with
    # allow_credentials=True — browsers reject the response. We disable
    # credentials when the wildcard is in use, and re-enable them only
    # for explicit origin lists. The X-API-Key header is also allow-listed
    # explicitly so we don't end up with the wildcard there either.
    wildcard_origins = "*" in settings.ALLOWED_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=not wildcard_origins,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", settings.API_KEY_HEADER],
    )

    # Include routers
    app.include_router(router)

    # Exception handlers
    @app.exception_handler(APIKeyInvalidException)
    async def api_key_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": str(exc)},
        )

    @app.exception_handler(RateLimitException)
    async def rate_limit_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": str(exc)},
        )

    @app.exception_handler(BanlistItemNotFound)
    async def not_found_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(DuplicateItemException)
    async def duplicate_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ValidationException)
    async def validation_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": str(exc)},
        )

    @app.exception_handler(DatabaseException)
    async def database_exception_handler(request, exc):
        logger.exception("Database error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal database error"},
        )

    @app.exception_handler(PurgeQException)
    async def purgeq_exception_handler(request, exc):
        logger.exception("Unhandled PurgeQ error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # Root endpoint
    @app.get("/", tags=["info"])
    async def root():
        return {
            "name": settings.API_TITLE,
            "version": settings.API_VERSION,
            "docs": "/docs",
            "status": "operational",
        }

    return app


app = create_app()
