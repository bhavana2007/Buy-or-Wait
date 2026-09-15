import pytest
from fastapi.testclient import TestClient
from main import app
from app.models.database import Base, engine, SessionLocal, DBUser, DBFinancialProfile, DBFinancialEvent

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not db.query(DBUser).filter(DBUser.id == "test_user").first():
        db.add(DBUser(id="test_user", name="Test User"))
        db.add(DBFinancialProfile(user_id="test_user", home_currency="INR", current_balance=45000, minimum_balance_to_keep=20000))
        db.commit()
    yield
    db.close()

def test_extract_and_approve_message():
    # 1. Extract message
    res = client.post("/api/v1/messages/extract", json={"text": "Salary of 50000"})
    assert res.status_code == 200
    msg_id = res.json()["extraction_id"]
    
    # 2. Approve message
    res_app = client.post(f"/api/v1/messages/{msg_id}/approve", json={
        "event_type": "salary",
        "amount": 50000,
        "currency": "INR",
        "effective_date": "2026-10-01"
    })
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "approved"
    
    # 3. Check idempotency
    res_dup = client.post(f"/api/v1/messages/{msg_id}/approve", json={
        "event_type": "salary",
        "amount": 50000,
        "currency": "INR",
        "effective_date": "2026-10-01"
    })
    assert res_dup.json()["status"] == "already_approved"

def test_invalid_message_approval():
    res = client.post("/api/v1/messages/extract", json={"text": "Lost 500"})
    msg_id = res.json()["extraction_id"]
    
    # Try negative amount
    res_app = client.post(f"/api/v1/messages/{msg_id}/approve", json={
        "event_type": "expense",
        "amount": -500,
        "currency": "INR",
        "effective_date": "2026-10-01"
    })
    assert res_app.status_code == 400

def test_purchase_creation():
    res = client.post("/api/v1/purchases", json={
        "document_id": "dummy_doc",
        "amount": 15000,
        "currency": "INR",
        "merchant": "Phone",
        "purchase_date": "2026-09-15"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "created"
    req_id = res.json()["request_id"]
    
    # Analyze it
    res_an = client.post("/api/v1/analyze", json={
        "request_id": req_id,
        "user_id": "test_user",
        "request_date": "2026-09-15",
        "requested_amount": 15000,
        "desired_completion_date": "2026-09-15",
        "allows_partial_payment": True,
        "request_type": "purchase",
        "payment_options": []
    })
    assert res_an.status_code == 200
    assert res_an.json()["affordability_status"] in ["affordable_now", "affordable_with_plan", "affordable_later"]
    assert "chart_data" in res_an.json()
    assert len(res_an.json()["chart_data"]) == 91

def test_duplicate_document_approval(tmp_path):
    # Fake image bytes
    test_file = tmp_path / "test.jpg"
    test_file.write_bytes(b"fake image data")
    
    with open(test_file, "rb") as f:
        res = client.post("/api/v1/documents/extract", files={"file": ("test.jpg", f, "image/jpeg")})
    assert res.status_code == 200
    doc_id = res.json()["extraction_id"]
    
    # Approve
    app1 = client.post(f"/api/v1/documents/{doc_id}/approve", json={
        "merchant": "Apple",
        "amount": 85000,
        "currency": "INR",
        "date": "2026-09-15"
    })
    assert app1.status_code == 200
    
    # Duplicate
    app2 = client.post(f"/api/v1/documents/{doc_id}/approve", json={
        "merchant": "Apple",
        "amount": 85000,
        "currency": "INR",
        "date": "2026-09-15"
    })
    assert app2.status_code == 200
    assert app2.json()["status"] == "already_approved"
