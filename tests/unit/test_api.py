"""Tests for FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from src.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    # Use lifespan context so app.state is populated
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    resp = client.get("/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ok", "healthy")
    assert "model_loaded" in data
    assert "modules_count" in data


def test_modules_list_endpoint(client):
    resp = client.get("/v1/modules/list")
    assert resp.status_code == 200
    data = resp.json()
    assert "modules" in data
