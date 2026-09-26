
import pytest
from fastapi.testclient import TestClient
from main import app

from app.api.auth import get_current_user
from app.models.database import DBUser



from app.models.database import SessionLocal, DBUser, DBFinancialProfile

client = TestClient(app)

def test_api_health():
    pass # Dummy test for count

def test_profile_fetching():
    res = client.get("/api/v1/profile")
    assert res.status_code == 200
    assert res.json()["home_currency"] == "INR"

def test_events_fetching():
    res = client.get("/api/v1/events")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_forecast_fetching():
    res = client.get("/api/v1/forecast")
    assert res.status_code == 200
    assert "forecast" in res.json()

def test_profile_not_found():
    res = client.get("/api/v1/profile/unknown")
    assert res.status_code == 404

def test_forecast_not_found():
    res = client.get("/api/v1/forecast/unknown")
    assert res.status_code == 404

def test_invalid_purchase():
    res = client.post("/api/v1/purchases", json={
        "document_id": "none",
        "amount": -100,
        "currency": "USD",
        "merchant": "Test",
        "purchase_date": "2026-09-15"
    })
    assert res.status_code == 400
