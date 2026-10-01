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
        db.add(DBUser(id="test_user", name="Test User", email="test@test.com", hashed_password="hash"))
        db.add(DBFinancialProfile(user_id="test_user", home_currency="INR", current_balance=50000.0, minimum_balance_to_keep=20000.0))
        db.commit()
    db.close()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_profile():
    setup_db()
    response = client.get("/api/v1/profile")
    assert response.status_code == 200
    assert response.json()["home_currency"] == "INR"

def test_get_events():
    setup_db()
    response = client.get("/api/v1/events")
    assert response.status_code == 200

def test_get_forecast():
    setup_db()
    response = client.get("/api/v1/forecast")
    assert response.status_code == 200

def test_analyze():
    setup_db()
    db = TestingSessionLocal()
    from app.models.database import DBPurchaseRequest
    # Create valid purchase request owned by test_user
    db.add(DBPurchaseRequest(id="req_1", user_id="test_user", amount=10000.0, currency="INR", merchant="Test", purchase_date="2026-09-15"))
    db.commit()
    db.close()
    
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

def test_analyze_user_isolation():
    setup_db()
    db = TestingSessionLocal()
    from app.models.database import DBUser, DBPurchaseRequest
    if not db.query(DBUser).filter(DBUser.id == "other_user").first():
        db.add(DBUser(id="other_user", name="Other User", email="other@test.com", hashed_password="hash"))
    # Create purchase request owned by other_user
    db.add(DBPurchaseRequest(id="req_other", user_id="other_user", amount=10000.0, currency="INR", merchant="Test", purchase_date="2026-09-15"))
    db.commit()
    db.close()
    
    # Attempt to analyze the other user's request_id while logged in as test_user (default client auth)
    payload = {
        "request_id": "req_other",
        "user_id": "test_user",
        "request_date": "2026-09-15",
        "requested_amount": 10000.0,
        "desired_completion_date": "2026-09-15",
        "allows_partial_payment": True,
        "request_type": "purchase"
    }
    response = client.post("/api/v1/analyze", json=payload)
    # Should be rejected because request_id is not owned by current_user
    assert response.status_code == 404
    assert response.json()["detail"] == "Purchase request not found"
