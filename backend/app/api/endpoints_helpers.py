from datetime import datetime

def build_forecast_data(engine, request, res):
    base_dict = engine.simulate_90_days(request.request_date)
    base_dates = sorted(base_dict.keys())
    base_balances = [base_dict[d] for d in base_dates]

    # Add plan events temporarily
    original_events = list(engine.events)
    if res.payment_plan and res.payment_plan != 'none':
        from app.models.financial import FinancialEvent
        import uuid
        plan_parts = res.payment_plan.split('|')
        for part in plan_parts:
            d_str, amt_str = part.split(':')
            d = datetime.strptime(d_str, "%Y-%m-%d").date()
            engine.events.append(FinancialEvent(
                event_id=str(uuid.uuid4()), amount=float(amt_str), currency="INR", date=d,
                status="scheduled", is_income=False, is_recurring=False, is_essential=True
            ))
            
    with_purchase_dict = engine.simulate_90_days(request.request_date)
    with_purchase_balances = [with_purchase_dict.get(d, 0) for d in base_dates]
    
    # Restore original
    engine.events = original_events
    
    return [
        {"date": d.isoformat(), "baseline": b, "with_purchase": p}
        for d, b, p in zip(base_dates, base_balances, with_purchase_balances)
    ]
