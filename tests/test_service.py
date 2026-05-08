"""Tests for banlist service."""
from uuid import uuid4

import pytest

from api.core import BanlistItemNotFound, DuplicateItemException
from api.models import SELF_HOSTED_NAMESPACE_ID
from api.schemas import BanlistItemCreate, BanlistItemResponse
from api.services import BanlistService


def _make_service(db_session, namespace_id=SELF_HOSTED_NAMESPACE_ID):
    return BanlistService(db_session, namespace_id)


@pytest.mark.asyncio
async def test_create_banlist_item(test_db_session):
    service = _make_service(test_db_session)
    create_data = BanlistItemCreate(
        faceit_name="TestPlayer", reason="Cheating", author="AdminBot"
    )

    result = await service.create_item(create_data)

    assert isinstance(result, BanlistItemResponse)
    assert result.faceit_name == "TestPlayer"


@pytest.mark.asyncio
async def test_duplicate_item_raises_exception(test_db_session):
    service = _make_service(test_db_session)
    create_data = BanlistItemCreate(
        faceit_name="TestPlayer", reason="Cheating", author="AdminBot"
    )

    await service.create_item(create_data)

    with pytest.raises(DuplicateItemException):
        await service.create_item(create_data)


@pytest.mark.asyncio
async def test_get_all_items(test_db_session):
    service = _make_service(test_db_session)
    for i in range(3):
        await service.create_item(
            BanlistItemCreate(
                faceit_name=f"Player{i}", reason=f"Reason{i}", author="AdminBot"
            )
        )

    items = await service.get_all_items()

    assert len(items) == 3
    assert all(isinstance(item, BanlistItemResponse) for item in items)


@pytest.mark.asyncio
async def test_delete_item(test_db_session):
    service = _make_service(test_db_session)
    await service.create_item(
        BanlistItemCreate(faceit_name="TestPlayer", reason="Cheating", author="AdminBot")
    )

    assert (await service.get_item_by_faceit_name("TestPlayer")).faceit_name == "TestPlayer"
    assert await service.delete_item("TestPlayer") is True

    with pytest.raises(BanlistItemNotFound):
        await service.get_item_by_faceit_name("TestPlayer")


@pytest.mark.asyncio
async def test_get_nonexistent_item_raises_exception(test_db_session):
    service = _make_service(test_db_session)
    with pytest.raises(BanlistItemNotFound):
        await service.get_item_by_faceit_name("NonExistent")


@pytest.mark.asyncio
async def test_case_insensitive_lookup(test_db_session):
    service = _make_service(test_db_session)
    await service.create_item(
        BanlistItemCreate(faceit_name="TestPlayer", reason="Cheating", author="AdminBot")
    )

    assert (
        await service.get_item_by_faceit_name("testplayer")
    ).faceit_name == "TestPlayer"
    assert (
        await service.get_item_by_faceit_name("TESTPLAYER")
    ).faceit_name == "TestPlayer"


@pytest.mark.asyncio
async def test_namespaces_are_isolated(test_db_session):
    """Two namespaces can ban the same nickname independently."""
    ns_a = uuid4()
    ns_b = uuid4()
    service_a = _make_service(test_db_session, ns_a)
    service_b = _make_service(test_db_session, ns_b)

    await service_a.create_item(
        BanlistItemCreate(faceit_name="Watashi-", reason="alpha", author="alice")
    )
    # Same name in another namespace must succeed.
    await service_b.create_item(
        BanlistItemCreate(faceit_name="Watashi-", reason="beta", author="bob")
    )

    a_items = await service_a.get_all_items()
    b_items = await service_b.get_all_items()
    assert len(a_items) == 1
    assert len(b_items) == 1
    assert a_items[0].reason == "alpha"
    assert b_items[0].reason == "beta"


@pytest.mark.asyncio
async def test_health_check(test_db_session):
    service = _make_service(test_db_session)
    assert await service.health_check() is True
