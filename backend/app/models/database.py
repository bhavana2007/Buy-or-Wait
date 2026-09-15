from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./buy_or_wait.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)

class DBFinancialProfile(Base):
    __tablename__ = "financial_profiles"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    home_currency = Column(String)
    current_balance = Column(Float)
    minimum_balance_to_keep = Column(Float)

class DBFinancialEvent(Base):
    __tablename__ = "financial_events"
    event_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float)
    currency = Column(String)
    date = Column(Date)
    status = Column(String)
    is_income = Column(Boolean)
    is_recurring = Column(Boolean)
    is_essential = Column(Boolean)
    is_flexible = Column(Boolean)

class DBDocumentExtraction(Base):
    __tablename__ = "document_extractions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    merchant = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    date = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    requires_review = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBMessageExtraction(Base):
    __tablename__ = "message_extractions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    original_text = Column(String)
    event_type = Column(String)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    effective_date = Column(String, nullable=True)
    description = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    requires_review = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBPurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    document_id = Column(String, ForeignKey("document_extractions.id"), nullable=True)
    amount = Column(Float)
    currency = Column(String)
    merchant = Column(String)
    purchase_date = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class DBAnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    purchase_request_id = Column(String, ForeignKey("purchase_requests.id"))
    amount_safe_to_pay = Column(Float)
    affordability_status = Column(String)
    recommended_payment_method = Column(String)
    payment_plan = Column(String)
    earliest_date_for_full_payment = Column(String, nullable=True)
    spending_changes_needed = Column(String)
    decision_explanation = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
