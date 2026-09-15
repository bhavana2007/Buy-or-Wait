from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import SessionLocal, DBUser, DBFinancialProfile
from app.models.financial import PurchaseRequest, AffordabilityResult
from app.services.financial_engine import FinancialEngine

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/analyze", response_model=AffordabilityResult)
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
            event_id=e.event_id,
            amount=e.amount,
            currency=e.currency,
            date=e.date,
            status=e.status,
            is_income=e.is_income,
            is_recurring=e.is_recurring,
            is_essential=e.is_essential,
            is_flexible=e.is_flexible
        ))
    
    # Map profile
    from app.models.financial import FinancialProfile
    profile = FinancialProfile(
        user_id=db_profile.user_id,
        home_currency=db_profile.home_currency,
        current_balance=db_profile.current_balance,
        minimum_balance_to_keep=db_profile.minimum_balance_to_keep,
        payment_methods_user_will_consider=["full_payment", "partial_payment", "installments", "wait"]
    )
    
    engine = FinancialEngine(profile=profile, events=events)
    result = engine.analyze_request(request)
    return result
