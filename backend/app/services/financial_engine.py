from datetime import date, timedelta
from typing import List, Dict, Optional, Tuple
from app.models.financial import FinancialProfile, FinancialEvent, PurchaseRequest, AffordabilityResult

class FinancialEngine:
    def __init__(self, profile: FinancialProfile, events: List[FinancialEvent]):
        self.profile = profile
        self.events = events

    def _project_event(self, event: FinancialEvent, start_date: date, end_date: date) -> List[Tuple[date, float]]:
        # Handles currency conversion (mocked as 1:1 for now if missing, but typically we'd use a rate table)
        # We will assume all event amounts are already converted to home_currency for simplicity in this engine version.
        
        if event.status in ['failed', 'cancelled', 'unrealized']:
            return []
        if event.status == 'pending' and event.is_income:
            # Pending credits are ignored
            return []
            
        projections = []
        amount = event.amount if event.is_income else -event.amount
        
        if not event.is_recurring:
            if start_date <= event.date <= end_date:
                projections.append((event.date, amount))
        else:
            # Project recurring monthly
            curr_date = event.date
            # rewind to the first occurrence within or before window (simplified to just project forward)
            # A real system would use cron or frequency. We assume monthly here.
            while curr_date <= end_date:
                if curr_date >= start_date:
                    projections.append((curr_date, amount))
                # Add approx 1 month
                curr_date += timedelta(days=30)
                
        return projections

    def _get_daily_cashflow(self, start_date: date, end_date: date, skip_flexible_expenses: bool = False) -> Dict[date, float]:
        cashflow = {start_date + timedelta(days=i): 0.0 for i in range((end_date - start_date).days + 1)}
        for event in self.events:
            if skip_flexible_expenses and event.is_flexible and not event.is_essential:
                continue
            projections = self._project_event(event, start_date, end_date)
            for d, amt in projections:
                if d in cashflow:
                    cashflow[d] += amt
        return cashflow

    def simulate_90_days(self, request_date: date, skip_flexible_expenses: bool = False) -> Dict[date, float]:
        end_date = request_date + timedelta(days=90)
        daily_cashflow = self._get_daily_cashflow(request_date, end_date, skip_flexible_expenses)
        
        balances = {}
        current_balance = self.profile.current_balance
        
        for d in sorted(daily_cashflow.keys()):
            current_balance += daily_cashflow[d]
            balances[d] = current_balance
            
        return balances

    def analyze_request(self, request: PurchaseRequest) -> AffordabilityResult:
        if request.requested_amount <= 0:
            return AffordabilityResult(
                request_id=request.request_id, amount_safe_to_pay=0, affordability_status='affordable_now',
                recommended_payment_method='full_payment', payment_plan='none',
                earliest_date_for_full_payment=request.request_date, spending_changes_needed='none',
                decision_explanation='Invalid or zero amount requested.'
            )

        # Baseline simulation
        balances = self.simulate_90_days(request.request_date)
        req_amount = request.requested_amount
        min_reserve = self.profile.minimum_balance_to_keep
        
        def get_safe_amount_today(bals):
            safe = req_amount
            for d, bal in bals.items():
                buffer = bal - min_reserve
                if buffer < safe:
                    safe = max(0.0, buffer)
            return min(safe, req_amount)

        safe_amount_today = get_safe_amount_today(balances)

        # 1. Affordable Now
        if safe_amount_today >= req_amount and 'full_payment' in self.profile.payment_methods_user_will_consider:
            return AffordabilityResult(
                request_id=request.request_id, amount_safe_to_pay=req_amount, affordability_status='affordable_now',
                recommended_payment_method='full_payment', payment_plan='none',
                earliest_date_for_full_payment=request.request_date, spending_changes_needed='none',
                decision_explanation='You can safely pay the full amount today while maintaining your minimum reserve.'
            )

        # 2. Wait Analysis
        earliest_safe_date = None
        for test_date in sorted(balances.keys()):
            can_afford = True
            for d in sorted(balances.keys()):
                if d >= test_date and balances[d] - req_amount < min_reserve:
                    can_afford = False
                    break
            if can_afford:
                earliest_safe_date = test_date
                break

        # 2. Partial Payment (preferred over Wait because it starts earlier)
        if request.allows_partial_payment and safe_amount_today > 0 and earliest_safe_date and earliest_safe_date <= request.desired_completion_date and 'partial_payment' in self.profile.payment_methods_user_will_consider:
            return AffordabilityResult(
                request_id=request.request_id, amount_safe_to_pay=safe_amount_today, affordability_status='affordable_with_plan',
                recommended_payment_method='partial_payment', payment_plan=f'{request.request_date}:{safe_amount_today}|{earliest_safe_date}:{req_amount - safe_amount_today}',
                earliest_date_for_full_payment=earliest_safe_date, spending_changes_needed='none',
                decision_explanation=f'Pay {safe_amount_today} today and the rest on {earliest_safe_date}.'
            )

        # 3. Wait Analysis
        if earliest_safe_date and earliest_safe_date <= request.desired_completion_date and 'wait' in self.profile.payment_methods_user_will_consider:
            return AffordabilityResult(
                request_id=request.request_id, amount_safe_to_pay=safe_amount_today, affordability_status='affordable_later',
                recommended_payment_method='wait', payment_plan='none', earliest_date_for_full_payment=earliest_safe_date,
                spending_changes_needed='none', decision_explanation=f'Becomes safe to pay in full on {earliest_safe_date}.'
            )
            
        # 4. Installments
        # If there are payment options, evaluate them
        for option in request.payment_options:
            if 'installments' in self.profile.payment_methods_user_will_consider:
                # Mock validation of installment safety
                installment_amount = option.total_amount / option.installments
                safe = True
                curr_date = request.request_date
                for i in range(option.installments):
                    if curr_date in balances and balances[curr_date] - installment_amount < min_reserve:
                        safe = False
                    curr_date += timedelta(days=option.days_between_payments)
                
                if safe:
                    plan_str = "|".join([f"{request.request_date + timedelta(days=i*option.days_between_payments)}:{installment_amount}" for i in range(option.installments)])
                    return AffordabilityResult(
                        request_id=request.request_id, amount_safe_to_pay=installment_amount, affordability_status='affordable_with_plan',
                        recommended_payment_method='installments', payment_plan=plan_str,
                        earliest_date_for_full_payment=earliest_safe_date, spending_changes_needed='none',
                        decision_explanation='Installments fit within your projected 90-day cash flow.'
                    )

        # 5. Spending Changes
        # Re-run simulation without flexible expenses
        balances_flex = self.simulate_90_days(request.request_date, skip_flexible_expenses=True)
        safe_amount_flex = get_safe_amount_today(balances_flex)
        if safe_amount_flex >= req_amount:
            # Find the flexible events we skipped
            flex_events = [e.event_id for e in self.events if e.is_flexible and not e.is_essential]
            changes = "|".join([f"stop:{e}" for e in flex_events[:3]]) # up to 3
            return AffordabilityResult(
                request_id=request.request_id, amount_safe_to_pay=req_amount, affordability_status='affordable_with_plan',
                recommended_payment_method='full_payment', payment_plan='none', earliest_date_for_full_payment=request.request_date,
                spending_changes_needed=changes if changes else 'none',
                decision_explanation='Affordable if you cut back on flexible expenses.'
            )

        # 6. Not affordable
        return AffordabilityResult(
            request_id=request.request_id, amount_safe_to_pay=safe_amount_today, affordability_status='not_affordable',
            recommended_payment_method='not_recommended', payment_plan='none', earliest_date_for_full_payment=earliest_safe_date,
            spending_changes_needed='none', decision_explanation='This purchase cannot be safely completed within your 90-day forecast.'
        )
