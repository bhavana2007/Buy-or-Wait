from fastapi.testclient import TestClient
from app.api.endpoints import get_db
from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, DBUser, DBFinancialProfile, DBFinancialEvent

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_db():
    db = TestingSessionLocal()
    if not db.query(DBUser).first():
        db.add(DBUser(id="test_user", name="Test User"))
        db.add(DBFinancialProfile(user_id="test_user", home_currency="INR", current_balance=50000.0, minimum_balance_to_keep=20000.0))
        db.commit()
    db.close()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_profile():
    setup_db()
    response = client.get("/api/v1/profile/test_user")
    assert response.status_code == 200
    assert response.json()["home_currency"] == "INR"

def test_get_events():
    setup_db()
    response = client.get("/api/v1/events/test_user")
    assert response.status_code == 200

def test_get_forecast():
    setup_db()
    response = client.get("/api/v1/forecast/test_user")
    assert response.status_code == 200

def test_analyze():
    setup_db()
    payload = {
        "request_id": "req_1",
        "user_id": "test_user",
        "request_date": "2026-09-15",
        "requested_amount": 10000.0,
        "desired_completion_date": "2026-09-15",
        "allows_partial_payment": True,
        "request_type": "purchase"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    assert response.json()["affordability_status"] == "affordable_now"
