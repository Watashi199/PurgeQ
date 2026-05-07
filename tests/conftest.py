"""Test fixtures and configuration."""
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from api.core import Base
from api.app.main import create_app


@pytest.fixture
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def test_db_session(test_engine):
    """Create test database session."""
    session_maker = async_sessionmaker(test_engine, expire_on_commit=False)

    async with session_maker() as session:
        yield session


@pytest.fixture
def app():
    """Create test FastAPI app."""
    return create_app()


@pytest.fixture
def test_client(app):
    """Create test client."""
    from fastapi.testclient import TestClient

    return TestClient(app)
