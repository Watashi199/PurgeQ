"""Tests for API routes."""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    """Test health check endpoint."""
    response = test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_endpoint(test_client):
    """Test root endpoint."""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "PurgeQ FACEIT Banlist API"
    assert data["status"] == "operational"


def test_get_banlist_empty(test_client):
    """Test getting empty banlist."""
    response = test_client.get("/api/v1/banlist")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["items"] == []


def test_add_ban_missing_api_key(test_client):
    """Test adding ban without API key."""
    ban_data = {
        "faceit_name": "TestPlayer",
        "reason": "Cheating",
        "author": "AdminBot",
    }
    response = test_client.post("/api/v1/ban", json=ban_data)
    assert response.status_code == 401


def test_delete_ban_missing_api_key(test_client):
    """Test deleting ban without API key."""
    response = test_client.delete("/api/v1/ban/TestPlayer")
    assert response.status_code == 401


def test_invalid_faceit_name(test_client):
    """Test adding ban with invalid FACEIT name."""
    ban_data = {
        "faceit_name": "a",  # Too short
        "reason": "Cheating",
        "author": "AdminBot",
    }
    response = test_client.post(
        "/api/v1/ban",
        json=ban_data,
        headers={"X-API-Key": "valid_key"},
    )
    assert response.status_code in [422, 401]


def test_invalid_reason(test_client):
    """Test adding ban with invalid reason."""
    ban_data = {
        "faceit_name": "TestPlayer",
        "reason": "",  # Too short
        "author": "AdminBot",
    }
    response = test_client.post(
        "/api/v1/ban",
        json=ban_data,
        headers={"X-API-Key": "valid_key"},
    )
    assert response.status_code in [422, 401]


def test_invalid_author(test_client):
    """Test adding ban with invalid author."""
    ban_data = {
        "faceit_name": "TestPlayer",
        "reason": "Cheating",
        "author": "a",  # Too short
    }
    response = test_client.post(
        "/api/v1/ban",
        json=ban_data,
        headers={"X-API-Key": "valid_key"},
    )
    assert response.status_code in [422, 401]
