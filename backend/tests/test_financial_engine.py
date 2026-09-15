from datetime import date, timedelta
from app.models.financial import FinancialProfile, FinancialEvent, PurchaseRequest, PaymentOption
from app.services.financial_engine import FinancialEngine

def get_base_profile():
    return FinancialProfile(
        user_id="u1", home_currency="INR", current_balance=50000.0,
        minimum_balance_to_keep=20000.0, payment_methods_user_will_consider=["full_payment", "partial_payment", "wait", "installments"]
    )

def test_1_affordable_now():
    profile = get_base_profile()
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, []).analyze_request(req)
    assert res.affordability_status == "affordable_now"
    assert res.amount_safe_to_pay == 10000.0

def test_2_future_rent_makes_it_unsafe():
    profile = get_base_profile()
    events = [FinancialEvent(event_id="e1", amount=25000.0, currency="INR", date=date.today() + timedelta(days=5), status="scheduled", is_income=False, is_recurring=False, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "not_affordable"
    assert res.amount_safe_to_pay == 5000.0

def test_3_minimum_reserve_violation():
    profile = get_base_profile()
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=35000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, []).analyze_request(req)
    assert res.affordability_status == "not_affordable"

def test_4_future_salary_affordable_later():
    profile = get_base_profile()
    profile.current_balance = 25000.0
    events = [FinancialEvent(event_id="e1", amount=20000.0, currency="INR", date=date.today() + timedelta(days=10), status="scheduled", is_income=True, is_recurring=True, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=15000.0, desired_completion_date=date.today()+timedelta(days=30), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "affordable_later"
    assert res.recommended_payment_method == "wait"

def test_5_pending_credit_ignored():
    profile = get_base_profile()
    profile.current_balance = 25000.0
    events = [FinancialEvent(event_id="e1", amount=50000.0, currency="INR", date=date.today(), status="pending", is_income=True, is_recurring=False, is_essential=False)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "not_affordable"

def test_6_failed_cancelled_ignored():
    profile = get_base_profile()
    # A failed expense of 40k shouldn't affect us
    events = [FinancialEvent(event_id="e1", amount=40000.0, currency="INR", date=date.today()+timedelta(days=1), status="failed", is_income=False, is_recurring=False, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "affordable_now"

def test_7_recurring_expense_projection():
    profile = get_base_profile() # bal 50k, min 20k
    # 5k expense every 30 days starting today. In 90 days, that's 3-4 times.
    events = [FinancialEvent(event_id="e1", amount=15000.0, currency="INR", date=date.today(), status="settled", is_income=False, is_recurring=True, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    # 50k - 15k(today) = 35k. -10k(req) = 25k. Next month -15k = 10k < 20k reserve!
    assert res.affordability_status == "not_affordable"

def test_8_partial_payment():
    profile = get_base_profile()
    profile.current_balance = 30000.0
    events = [FinancialEvent(event_id="e1", amount=20000.0, currency="INR", date=date.today()+timedelta(days=15), status="scheduled", is_income=True, is_recurring=True, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=15000.0, desired_completion_date=date.today()+timedelta(days=30), allows_partial_payment=True, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "affordable_with_plan"
    assert res.recommended_payment_method == "partial_payment"
    assert res.amount_safe_to_pay == 10000.0 # 30k - 20k(reserve) = 10k

def test_9_installments_affordable():
    profile = get_base_profile()
    profile.current_balance = 25000.0
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=15000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase",
                          payment_options=[PaymentOption(payment_option_id="opt1", total_amount=15000.0, installments=3, days_between_payments=30, first_payment_date=date.today())])
    res = FinancialEngine(profile, []).analyze_request(req)
    assert res.recommended_payment_method == "installments"
    assert res.amount_safe_to_pay == 5000.0

def test_10_completely_unaffordable():
    profile = get_base_profile()
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=100000.0, desired_completion_date=date.today(), allows_partial_payment=True, request_type="purchase")
    res = FinancialEngine(profile, []).analyze_request(req)
    assert res.affordability_status == "not_affordable"

def test_11_spending_reduction_flexible():
    profile = get_base_profile()
    profile.current_balance = 35000.0
    events = [FinancialEvent(event_id="e_flex", amount=10000.0, currency="INR", date=date.today()+timedelta(days=2), status="scheduled", is_income=False, is_recurring=False, is_essential=False, is_flexible=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "affordable_with_plan"
    assert "stop:e_flex" in res.spending_changes_needed

def test_12_protected_essential_cannot_be_reduced():
    profile = get_base_profile()
    profile.current_balance = 35000.0
    events = [FinancialEvent(event_id="e_ess", amount=10000.0, currency="INR", date=date.today()+timedelta(days=2), status="scheduled", is_income=False, is_recurring=False, is_essential=True, is_flexible=False)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "not_affordable"

def test_13_invalid_input_zero_amount():
    profile = get_base_profile()
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=0.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, []).analyze_request(req)
    assert res.amount_safe_to_pay == 0.0
    assert res.decision_explanation == 'Invalid or zero amount requested.'

def test_14_unaffordable_wait_outside_desired_date():
    profile = get_base_profile()
    profile.current_balance = 25000.0
    events = [FinancialEvent(event_id="e1", amount=20000.0, currency="INR", date=date.today() + timedelta(days=40), status="scheduled", is_income=True, is_recurring=True, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=15000.0, desired_completion_date=date.today()+timedelta(days=10), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    # It's safe at day 40, but desired is day 10.
    assert res.affordability_status == "not_affordable"

def test_15_currency_conversion_fallback():
    # Since we assume 1:1 fallback in the engine currently
    profile = get_base_profile()
    events = [FinancialEvent(event_id="e1", amount=10000.0, currency="USD", date=date.today()+timedelta(days=1), status="scheduled", is_income=False, is_recurring=False, is_essential=True)]
    req = PurchaseRequest(request_id="r1", user_id="u1", request_date=date.today(), requested_amount=10000.0, desired_completion_date=date.today(), allows_partial_payment=False, request_type="purchase")
    res = FinancialEngine(profile, events).analyze_request(req)
    assert res.affordability_status == "affordable_now"
    assert res.amount_safe_to_pay == 10000.0
