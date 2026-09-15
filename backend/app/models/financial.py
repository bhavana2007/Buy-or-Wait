from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date

class PaymentOption(BaseModel):
    payment_option_id: str
    total_amount: float
    installments: int
    days_between_payments: int
    first_payment_date: date

class FinancialEvent(BaseModel):
    event_id: str
    amount: float
    currency: str
    date: date
    status: Literal['settled', 'pending', 'scheduled', 'failed', 'cancelled']
    is_income: bool
    is_recurring: bool
    is_essential: bool
    is_flexible: bool = False

class FinancialProfile(BaseModel):
    user_id: str
    home_currency: str
    current_balance: float
    minimum_balance_to_keep: float
    payment_methods_user_will_consider: List[str]

class PurchaseRequest(BaseModel):
    request_id: str
    user_id: str
    request_date: date
    requested_amount: float
    desired_completion_date: date
    allows_partial_payment: bool
    request_type: str
    payment_options: List[PaymentOption] = []

class AffordabilityResult(BaseModel):
    request_id: str
    amount_safe_to_pay: float
    affordability_status: Literal['affordable_now', 'affordable_with_plan', 'affordable_later', 'not_affordable']
    recommended_payment_method: Literal['full_payment', 'partial_payment', 'installments', 'wait', 'not_recommended']
    payment_plan: str
    earliest_date_for_full_payment: Optional[date]
    spending_changes_needed: str
    decision_explanation: str
