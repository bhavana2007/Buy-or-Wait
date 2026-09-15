code = """
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
"""
with open("backend/app/models/database.py", "a") as f:
    f.write(code)
