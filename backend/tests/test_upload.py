import pytest
from fastapi.testclient import TestClient
from main import app
from app.models.database import SessionLocal, DBUser
from app.api.auth import get_password_hash

client = TestClient(app)

@pytest.fixture
def auth_token():
    db = SessionLocal()
    user = db.query(DBUser).filter(DBUser.email == "testupload@example.com").first()
    if not user:
        user = DBUser(
            id="upload-user-id",
            name="Upload Test User",
            email="testupload@example.com",
            hashed_password=get_password_hash("password123")
        )
        db.add(user)
        db.commit()
    db.close()
    
    response = client.post("/api/v1/auth/login", data={"username": "testupload@example.com", "password": "password123"})
    return response.json()["access_token"]

def test_upload_empty_file(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("empty.png", b"", "image/png")}
    response = client.post("/api/v1/documents/extract", headers=headers, files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_upload_unsupported_extension(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("malicious.exe", b"fake content", "image/png")}
    response = client.post("/api/v1/documents/extract", headers=headers, files=files)
    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()

def test_upload_unsupported_mime(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("valid.png", b"fake content", "application/json")}
    response = client.post("/api/v1/documents/extract", headers=headers, files=files)
    assert response.status_code == 400
    assert "format" in response.json()["detail"].lower()

def test_upload_oversized(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # 6MB file
    large_content = b"0" * (6 * 1024 * 1024)
    files = {"file": ("large.png", large_content, "image/png")}
    response = client.post("/api/v1/documents/extract", headers=headers, files=files)
    assert response.status_code == 400
    assert "large" in response.json()["detail"].lower()

def test_upload_missing_jwt():
    files = {"file": ("valid.png", b"fake content", "image/png")}
    response = client.post("/api/v1/documents/extract", files=files)
    assert response.status_code == 401