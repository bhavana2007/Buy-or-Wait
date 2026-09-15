from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import SessionLocal, DBUser, DBFinancialProfile, DBFinancialEvent
from app.models.financial import PurchaseRequest, AffordabilityResult
from app.services.financial_engine import FinancialEngine

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/analyze")
def analyze_purchase(request: PurchaseRequest, db: Session = Depends(get_db)):
    # Fetch profile and events from DB
    db_profile = db.query(DBFinancialProfile).filter(DBFinancialProfile.user_id == request.user_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    # Fetch events and map to pydantic models
    db_events = db.query(DBFinancialEvent).filter(DBFinancialEvent.user_id == request.user_id).all()
    from app.models.financial import FinancialEvent
    events = []
    for e in db_events:
        events.append(FinancialEvent(
            event_id=e.event_id, amount=e.amount, currency=e.currency, date=e.date,
            status=e.status, is_income=e.is_income, is_recurring=e.is_recurring,
            is_essential=e.is_essential, is_flexible=e.is_flexible
        ))
    
    # Map profile
    from app.models.financial import FinancialProfile
    profile = FinancialProfile(
        user_id=db_profile.user_id, home_currency=db_profile.home_currency,
        current_balance=db_profile.current_balance, minimum_balance_to_keep=db_profile.minimum_balance_to_keep,
        payment_methods_user_will_consider=["full_payment", "partial_payment", "installments", "wait"]
    )
    
    engine = FinancialEngine(profile=profile, events=events)
    res = engine.analyze_request(request)
    
    # Save analysis result to DB
    db_res = DBAnalysisResult(
        purchase_request_id=request.request_id,
        amount_safe_to_pay=res.amount_safe_to_pay,
        affordability_status=res.affordability_status,
        recommended_payment_method=res.recommended_payment_method,
        payment_plan=res.payment_plan,
        earliest_date_for_full_payment=res.earliest_date_for_full_payment.isoformat() if res.earliest_date_for_full_payment else None,
        spending_changes_needed=res.spending_changes_needed,
        decision_explanation=res.decision_explanation
    )
    db.add(db_res)
    db.commit()
    
    from app.api.endpoints_helpers import build_forecast_data
    response_data = res.model_dump()
    response_data["chart_data"] = build_forecast_data(engine, request, res)
    return response_data

@router.get("/profile/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(DBFinancialProfile).filter(DBFinancialProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/events/{user_id}")
def get_events(user_id: str, db: Session = Depends(get_db)):
    events = db.query(DBFinancialEvent).filter(DBFinancialEvent.user_id == user_id).all()
    return events

@router.get("/forecast/{user_id}")
def get_forecast(user_id: str, db: Session = Depends(get_db)):
    db_profile = db.query(DBFinancialProfile).filter(DBFinancialProfile.user_id == user_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    db_events = db.query(DBFinancialEvent).filter(DBFinancialEvent.user_id == user_id).all()
    from app.models.financial import FinancialEvent, FinancialProfile
    events = [FinancialEvent(
        event_id=e.event_id, amount=e.amount, currency=e.currency, date=e.date,
        status=e.status, is_income=e.is_income, is_recurring=e.is_recurring,
        is_essential=e.is_essential, is_flexible=e.is_flexible
    ) for e in db_events]
    
    profile = FinancialProfile(
        user_id=db_profile.user_id, home_currency=db_profile.home_currency,
        current_balance=db_profile.current_balance, minimum_balance_to_keep=db_profile.minimum_balance_to_keep,
        payment_methods_user_will_consider=["full_payment", "partial_payment", "installments", "wait"]
    )
    
    engine = FinancialEngine(profile=profile, events=events)
    # Get standard 90-day baseline forecast
    from datetime import date
    base_dict = engine.simulate_90_days(date.today())
    base_dates = sorted(base_dict.keys())
    
    return {
        "status": "ok",
        "forecast": [
            {"date": d.isoformat(), "balance": base_dict[d]} 
            for d in base_dates
        ]
    }

from app.models.database import SessionLocal, DBUser, DBFinancialProfile, DBFinancialEvent, DBDocumentExtraction, DBMessageExtraction, DBPurchaseRequest, DBAnalysisResult

# ... existing code for /analyze and /events ...

from fastapi import UploadFile, File
from app.services.ai_extractor import get_document_extractor, get_message_extractor

@router.post("/documents/extract")
async def extract_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    extractor = get_document_extractor()
    bytes_data = await file.read()
    res = extractor.extract_from_image(bytes_data, file.content_type)
    
    doc = DBDocumentExtraction(
        user_id="test_user", # hardcoded for demo auth
        merchant=res.merchant,
        amount=res.amount,
        currency=res.currency,
        date=res.date,
        invoice_number=res.invoice_number,
        confidence=res.confidence,
        requires_review=res.requires_review
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {
        "status": "success" if not res.requires_review else "needs_review",
        "extraction_id": doc.id,
        "extraction": res.model_dump(),
        "confidence": res.confidence,
        "warnings": res.warnings,
        "requires_review": res.requires_review,
        "provider": "real" if extractor.__class__.__name__ == "RealLLMDocumentExtractor" else "mock"
    }

from pydantic import BaseModel
class DocumentApproval(BaseModel):
    merchant: str
    amount: float
    currency: str
    date: str

@router.post("/documents/{doc_id}/approve")
def approve_document(doc_id: str, payload: DocumentApproval, db: Session = Depends(get_db)):
    doc = db.query(DBDocumentExtraction).filter(DBDocumentExtraction.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.is_approved:
        return {"status": "already_approved", "document_id": doc.id}
    
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
        
    doc.merchant = payload.merchant
    doc.amount = payload.amount
    doc.currency = payload.currency
    doc.date = payload.date
    doc.is_approved = True
    doc.requires_review = False
    db.commit()
    
    return {"status": "approved", "document_id": doc.id}

class MessageInput(BaseModel):
    text: str

@router.post("/messages/extract")
def extract_message(msg: MessageInput, db: Session = Depends(get_db)):
    extractor = get_message_extractor()
    res = extractor.extract_from_text(msg.text)
    
    m_ext = DBMessageExtraction(
        user_id="test_user",
        original_text=msg.text,
        event_type=res.event_type,
        amount=res.amount,
        currency=res.currency,
        effective_date=res.effective_date,
        description=res.description,
        confidence=res.confidence,
        requires_review=res.requires_review
    )
    db.add(m_ext)
    db.commit()
    db.refresh(m_ext)
    
    return {
        "status": "success" if not res.requires_review else "needs_review",
        "extraction_id": m_ext.id,
        "extraction": res.model_dump(),
        "confidence": res.confidence,
        "warnings": res.warnings,
        "requires_review": res.requires_review,
        "provider": "real" if extractor.__class__.__name__ == "RealLLMMessageExtractor" else "mock"
    }

class MessageApproval(BaseModel):
    event_type: str
    amount: float
    currency: str
    effective_date: str

@router.post("/messages/{msg_id}/approve")
def approve_message(msg_id: str, payload: MessageApproval, db: Session = Depends(get_db)):
    msg = db.query(DBMessageExtraction).filter(DBMessageExtraction.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.is_approved:
        return {"status": "already_approved", "message_id": msg.id}
        
    if payload.amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative")
        
    # Update extraction record
    msg.event_type = payload.event_type
    msg.amount = payload.amount
    msg.currency = payload.currency
    msg.effective_date = payload.effective_date
    msg.is_approved = True
    msg.requires_review = False
    
    # Create deterministic FinancialEvent
    from datetime import datetime
    try:
        dt = datetime.strptime(payload.effective_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
        
    is_inc = payload.event_type in ['salary', 'salary_change', 'income', 'refund']
    is_rec = payload.event_type in ['salary', 'salary_change', 'recurring_expense', 'subscription', 'rent_change']
    
    import uuid
    new_event = DBFinancialEvent(
        event_id=str(uuid.uuid4()),
        user_id=msg.user_id,
        amount=payload.amount,
        currency=payload.currency,
        date=dt,
        status="scheduled",
        is_income=is_inc,
        is_recurring=is_rec,
        is_essential=True,
        is_flexible=False
    )
    db.add(new_event)
    db.commit()
    
    return {"status": "approved", "message_id": msg.id, "event_id": new_event.event_id}

class PurchaseCreate(BaseModel):
    document_id: str
    amount: float
    currency: str
    merchant: str
    purchase_date: str

@router.post("/purchases")
def create_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Purchase amount must be positive")
    
    import uuid
    req_id = str(uuid.uuid4())
    db_req = DBPurchaseRequest(
        id=req_id,
        user_id="test_user",
        document_id=payload.document_id,
        amount=payload.amount,
        currency=payload.currency,
        merchant=payload.merchant,
        purchase_date=payload.purchase_date,
        status="pending"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    
    return {
        "status": "created",
        "request_id": db_req.id,
        "amount": db_req.amount,
        "currency": db_req.currency,
        "merchant": db_req.merchant
    }
