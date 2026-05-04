"""Tests for banlist service."""
import pytest
from datetime import datetime

from api.models import BanlistItem
from api.schemas import BanlistItemCreate, BanlistItemResponse
from api.services import BanlistService
from api.core import DuplicateItemException, BanlistItemNotFound


@pytest.mark.asyncio
async def test_create_banlist_item(test_db_session):
    """Test creating a banlist item."""
    service = BanlistService(test_db_session)

    create_data = BanlistItemCreate(
        faceit_name="TestPlayer",
        reason="Cheating",
        author="AdminBot",
    )

    result = await service.create_item(create_data)

    assert isinstance(result, BanlistItemResponse)
    assert result.faceit_name == "TestPlayer"
    assert result.reason == "Cheating"
    assert result.author == "AdminBot"


@pytest.mark.asyncio
async def test_duplicate_item_raises_exception(test_db_session):
    """Test that duplicate items raise exception."""
    service = BanlistService(test_db_session)

    create_data = BanlistItemCreate(
        faceit_name="TestPlayer",
        reason="Cheating",
        author="AdminBot",
    )

    # Create first item
    await service.create_item(create_data)

    # Try to create duplicate
    with pytest.raises(DuplicateItemException):
        await service.create_item(create_data)


@pytest.mark.asyncio
async def test_get_all_items(test_db_session):
    """Test getting all items."""
    service = BanlistService(test_db_session)

    # Create test items
    for i in range(3):
        create_data = BanlistItemCreate(
            faceit_name=f"Player{i}",
            reason=f"Reason{i}",
            author="AdminBot",
        )
        await service.create_item(create_data)

    items = await service.get_all_items()

    assert len(items) == 3
    assert all(isinstance(item, BanlistItemResponse) for item in items)


@pytest.mark.asyncio
async def test_delete_item(test_db_session):
    """Test deleting an item."""
    service = BanlistService(test_db_session)

    create_data = BanlistItemCreate(
        faceit_name="TestPlayer",
        reason="Cheating",
        author="AdminBot",
    )

    await service.create_item(create_data)

    # Verify item exists
    item = await service.get_item_by_faceit_name("TestPlayer")
    assert item.faceit_name == "TestPlayer"

    # Delete item
    deleted = await service.delete_item("TestPlayer")
    assert deleted is True

    # Verify item is gone
    with pytest.raises(BanlistItemNotFound):
        await service.get_item_by_faceit_name("TestPlayer")


@pytest.mark.asyncio
async def test_get_nonexistent_item_raises_exception(test_db_session):
    """Test that getting nonexistent item raises exception."""
    service = BanlistService(test_db_session)

    with pytest.raises(BanlistItemNotFound):
        await service.get_item_by_faceit_name("NonExistent")


@pytest.mark.asyncio
async def test_case_insensitive_lookup(test_db_session):
    """Test case-insensitive FACEIT name lookup."""
    service = BanlistService(test_db_session)

    create_data = BanlistItemCreate(
        faceit_name="TestPlayer",
        reason="Cheating",
        author="AdminBot",
    )

    await service.create_item(create_data)

    # Should find with different case
    item = await service.get_item_by_faceit_name("testplayer")
    assert item.faceit_name == "TestPlayer"

    item = await service.get_item_by_faceit_name("TESTPLAYER")
    assert item.faceit_name == "TestPlayer"


@pytest.mark.asyncio
async def test_health_check(test_db_session):
    """Test health check."""
    service = BanlistService(test_db_session)

    is_healthy = await service.health_check()
    assert is_healthy is True
