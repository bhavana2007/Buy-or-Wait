from datetime import date, timedelta
from app.models.financial import FinancialProfile, FinancialEvent, PurchaseRequest
from app.services.financial_engine import FinancialEngine

def test_affordable_now():
    profile = FinancialProfile(
        user_id="u1", home_currency="INR", current_balance=50000.0,
        minimum_balance_to_keep=20000.0, payment_methods_user_will_consider=["full_payment"]
    )
    request = PurchaseRequest(
        request_id="r1", user_id="u1", request_date=date.today(),
        requested_amount=10000.0, desired_completion_date=date.today(),
        allows_partial_payment=False, request_type="purchase"
    )
    engine = FinancialEngine(profile, events=[])
    result = engine.analyze_request(request)
    
    assert result.affordability_status == "affordable_now"
    assert result.amount_safe_to_pay == 10000.0

def test_future_expense_makes_purchase_unsafe():
    profile = FinancialProfile(
        user_id="u1", home_currency="INR", current_balance=35000.0,
        minimum_balance_to_keep=20000.0, payment_methods_user_will_consider=["full_payment"]
    )
    # We have a 10k expense tomorrow
    events = [FinancialEvent(
        event_id="e1", amount=10000.0, currency="INR", date=date.today() + timedelta(days=1),
        status="scheduled", is_income=False, is_recurring=True, is_essential=True
    )]
    # Requesting 10k today. 35k - 10k(req) - 10k(exp) = 15k < 20k (min balance). Unsafe!
    request = PurchaseRequest(
        request_id="r1", user_id="u1", request_date=date.today(),
        requested_amount=10000.0, desired_completion_date=date.today(),
        allows_partial_payment=False, request_type="purchase"
    )
    
    engine = FinancialEngine(profile, events)
    result = engine.analyze_request(request)
    
    assert result.affordability_status == "not_affordable"
    assert result.amount_safe_to_pay == 5000.0 # 35k - 10k(exp) = 25k min future bal. 25k - 20k = 5k safe

def test_affordable_later_wait():
    profile = FinancialProfile(
        user_id="u1", home_currency="INR", current_balance=25000.0,
        minimum_balance_to_keep=20000.0, payment_methods_user_will_consider=["wait", "full_payment"]
    )
    # Salary of 20k coming in 5 days
    events = [FinancialEvent(
        event_id="e1", amount=20000.0, currency="INR", date=date.today() + timedelta(days=5),
        status="scheduled", is_income=True, is_recurring=True, is_essential=True
    )]
    request = PurchaseRequest(
        request_id="r1", user_id="u1", request_date=date.today(),
        requested_amount=15000.0, desired_completion_date=date.today() + timedelta(days=30),
        allows_partial_payment=False, request_type="purchase"
    )
    
    engine = FinancialEngine(profile, events)
    result = engine.analyze_request(request)
    
    assert result.affordability_status == "affordable_later"
    assert result.recommended_payment_method == "wait"
    assert result.earliest_date_for_full_payment == date.today() + timedelta(days=5)

def test_pending_credit_ignored():
    profile = FinancialProfile(
        user_id="u1", home_currency="INR", current_balance=25000.0,
        minimum_balance_to_keep=20000.0, payment_methods_user_will_consider=["full_payment"]
    )
    # Pending credit of 50k, should be ignored
    events = [FinancialEvent(
        event_id="e1", amount=50000.0, currency="INR", date=date.today(),
        status="pending", is_income=True, is_recurring=False, is_essential=False
    )]
    request = PurchaseRequest(
        request_id="r1", user_id="u1", request_date=date.today(),
        requested_amount=10000.0, desired_completion_date=date.today(),
        allows_partial_payment=False, request_type="purchase"
    )
    
    engine = FinancialEngine(profile, events)
    result = engine.analyze_request(request)
    
    assert result.affordability_status == "not_affordable"
