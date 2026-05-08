"""Tests for the bulk import service."""
from uuid import uuid4

import pytest

from api.models import SELF_HOSTED_NAMESPACE_ID
from api.schemas import (
    BanlistImportItem,
    BanlistImportRequest,
    BanlistItemCreate,
)
from api.services import BanlistService


def _service(db, namespace_id=None):
    return BanlistService(db, namespace_id or SELF_HOSTED_NAMESPACE_ID)


@pytest.mark.asyncio
async def test_import_strings_use_defaults(test_db_session):
    service = _service(test_db_session)
    payload = BanlistImportRequest(
        items=["Player1", "Player2", "Player3"],
        default_author="Drazy",
        default_reason="Imported",
    )

    result = await service.bulk_import(payload)

    assert result.imported == 3
    assert result.skipped == []
    assert result.failed == []

    items = await service.get_all_items()
    assert {i.faceit_name for i in items} == {"Player1", "Player2", "Player3"}
    assert all(i.reason == "Imported" for i in items)
    assert all(i.author == "Drazy" for i in items)


@pytest.mark.asyncio
async def test_import_objects_keep_explicit_fields(test_db_session):
    service = _service(test_db_session)
    payload = BanlistImportRequest(
        items=[
            BanlistImportItem(faceit_name="Player1"),
            BanlistImportItem(faceit_name="Player2", reason="Toxic"),
            BanlistImportItem(faceit_name="Player3", author="OtherBot"),
        ],
        default_author="Drazy",
        default_reason="Imported",
    )

    result = await service.bulk_import(payload)

    assert result.imported == 3
    by_name = {i.faceit_name: i for i in await service.get_all_items()}
    assert by_name["Player1"].reason == "Imported"
    assert by_name["Player1"].author == "Drazy"
    assert by_name["Player2"].reason == "Toxic"
    assert by_name["Player2"].author == "Drazy"
    assert by_name["Player3"].reason == "Imported"
    assert by_name["Player3"].author == "OtherBot"


@pytest.mark.asyncio
async def test_import_skips_existing_and_internal_duplicates(test_db_session):
    service = _service(test_db_session)
    await service.create_item(
        BanlistItemCreate(faceit_name="Existing", reason="r", author="ad")
    )

    payload = BanlistImportRequest(
        items=["Existing", "NewOne", "NewOne"],  # one DB hit, one internal dup
        default_author="Drazy",
    )
    result = await service.bulk_import(payload)

    assert result.imported == 1
    assert sorted(result.skipped) == ["Existing", "NewOne"]
    assert result.failed == []


@pytest.mark.asyncio
async def test_import_reports_invalid_names(test_db_session):
    service = _service(test_db_session)
    payload = BanlistImportRequest(
        items=[
            "ValidName",
            "x",  # too short
            "way-too-long-" + "x" * 30,
            "with spaces",
            BanlistImportItem(faceit_name=""),  # missing
        ],
        default_author="Drazy",
    )

    result = await service.bulk_import(payload)

    assert result.imported == 1
    assert sorted([f.input for f in result.failed]) == [
        "",
        "way-too-long-" + "x" * 30,
        "with spaces",
        "x",
    ]
    # Each failure should carry a useful reason string.
    assert all(f.reason for f in result.failed)


@pytest.mark.asyncio
async def test_import_isolates_namespaces(test_db_session):
    ns_a = uuid4()
    ns_b = uuid4()
    service_a = _service(test_db_session, ns_a)
    service_b = _service(test_db_session, ns_b)

    await service_a.bulk_import(
        BanlistImportRequest(items=["Watashi-"], default_author="Drazy")
    )
    # Same name in another namespace must succeed, not be reported as a dup.
    result_b = await service_b.bulk_import(
        BanlistImportRequest(items=["Watashi-"], default_author="Drazy")
    )

    assert result_b.imported == 1
    assert result_b.skipped == []
