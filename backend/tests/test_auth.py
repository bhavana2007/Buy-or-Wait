import pytest
from fastapi.testclient import TestClient
from main import app
from app.models.database import SessionLocal, Base, engine, DBUser

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides = {}
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_user():
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_register_duplicate_email():
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    response = client.post("/api/v1/auth/register", json={
        "name": "Another User",
        "email": "test@example.com",
        "password": "password456"
    })
    assert response.status_code == 400

def test_login_success():
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password():
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_protected_endpoint():
    # Attempt to fetch profile without auth
    response = client.get("/api/v1/profile")
    assert response.status_code == 401

    # Register and login
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    token_resp = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "securepassword123"
    })
    token = token_resp.json()["access_token"]

    # Fetch profile with auth
    response = client.get("/api/v1/profile", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
