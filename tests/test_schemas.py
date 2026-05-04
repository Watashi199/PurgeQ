"""Tests for schemas and validation."""
import pytest
from pydantic import ValidationError

from api.schemas import BanlistItemCreate, BanlistItemResponse


def test_valid_banlist_item_create():
    """Test creating valid banlist item."""
    item = BanlistItemCreate(
        faceit_name="TestPlayer123",
        reason="Cheating detection",
        author="AdminBot",
    )
    assert item.faceit_name == "TestPlayer123"
    assert item.reason == "Cheating detection"
    assert item.author == "AdminBot"


def test_invalid_faceit_name_too_short():
    """Test FACEIT name too short."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="a",
            reason="Cheating",
            author="AdminBot",
        )


def test_invalid_faceit_name_too_long():
    """Test FACEIT name too long."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="a" * 33,
            reason="Cheating",
            author="AdminBot",
        )


def test_invalid_faceit_name_characters():
    """Test FACEIT name with invalid characters."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="Test@Player!",
            reason="Cheating",
            author="AdminBot",
        )


def test_invalid_reason_too_short():
    """Test reason too short."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="TestPlayer",
            reason="",
            author="AdminBot",
        )


def test_invalid_reason_too_long():
    """Test reason too long."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="TestPlayer",
            reason="a" * 251,
            author="AdminBot",
        )


def test_invalid_author_too_short():
    """Test author too short."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="TestPlayer",
            reason="Cheating",
            author="a",
        )


def test_invalid_author_too_long():
    """Test author too long."""
    with pytest.raises(ValidationError):
        BanlistItemCreate(
            faceit_name="TestPlayer",
            reason="Cheating",
            author="a" * 33,
        )


def test_valid_special_characters_in_faceit_name():
    """Test valid special characters in FACEIT name."""
    item = BanlistItemCreate(
        faceit_name="Test-Player_123",
        reason="Cheating",
        author="AdminBot",
    )
    assert item.faceit_name == "Test-Player_123"
