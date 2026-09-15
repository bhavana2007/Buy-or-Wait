from datetime import date, timedelta
from typing import List, Dict, Optional
from app.models.financial import FinancialProfile, FinancialEvent, PurchaseRequest, AffordabilityResult

class FinancialEngine:
    def __init__(self, profile: FinancialProfile, events: List[FinancialEvent]):
        self.profile = profile
        self.events = events

    def _get_daily_cashflow(self, start_date: date, end_date: date) -> Dict[date, float]:
        cashflow = {start_date + timedelta(days=i): 0.0 for i in range((end_date - start_date).days + 1)}
        for event in self.events:
            if event.status in ['failed', 'cancelled', 'unrealized']:
                continue
            if event.status == 'pending' and event.is_income:
                continue
            
            if start_date <= event.date <= end_date:
                amount = event.amount if event.is_income else -event.amount
                cashflow[event.date] += amount
        return cashflow

    def simulate_90_days(self, request_date: date) -> Dict[date, float]:
        end_date = request_date + timedelta(days=90)
        daily_cashflow = self._get_daily_cashflow(request_date, end_date)
        
        balances = {}
        current_balance = self.profile.current_balance
        
        for d in sorted(daily_cashflow.keys()):
            current_balance += daily_cashflow[d]
            balances[d] = current_balance
            
        return balances

    def analyze_request(self, request: PurchaseRequest) -> AffordabilityResult:
        balances = self.simulate_90_days(request.request_date)
        req_amount = request.requested_amount
        min_reserve = self.profile.minimum_balance_to_keep
        
        # 1. Analyze safe amount today
        safe_amount_today = req_amount
        for d, bal in balances.items():
            buffer = bal - min_reserve
            if buffer < safe_amount_today:
                safe_amount_today = max(0.0, buffer)
                
        safe_amount_today = min(safe_amount_today, req_amount)

        # 2. Can we afford it now?
        if safe_amount_today >= req_amount:
            return AffordabilityResult(
                request_id=request.request_id,
                amount_safe_to_pay=req_amount,
                affordability_status='affordable_now',
                recommended_payment_method='full_payment',
                payment_plan='none',
                earliest_date_for_full_payment=request.request_date,
                spending_changes_needed='none',
                decision_explanation='You can safely pay the full amount today while maintaining your minimum reserve over the next 90 days.'
            )

        # 3. If not today, when is the earliest date we can afford it?
        earliest_safe_date = None
        for test_date in sorted(balances.keys()):
            # If we pay on test_date, does the balance ever drop below min_reserve from test_date onwards?
            can_afford = True
            for d in sorted(balances.keys()):
                if d >= test_date:
                    if balances[d] - req_amount < min_reserve:
                        can_afford = False
                        break
            if can_afford:
                earliest_safe_date = test_date
                break

        if earliest_safe_date and earliest_safe_date <= request.desired_completion_date:
            return AffordabilityResult(
                request_id=request.request_id,
                amount_safe_to_pay=safe_amount_today,
                affordability_status='affordable_later',
                recommended_payment_method='wait',
                payment_plan='none',
                earliest_date_for_full_payment=earliest_safe_date,
                spending_changes_needed='none',
                decision_explanation=f'Paying today would dip below your reserve. It becomes safe to pay in full on {earliest_safe_date}.'
            )

        # 4. Can we do partial payment? (Assuming allowed and user considers it)
        if request.allows_partial_payment and safe_amount_today > 0 and earliest_safe_date:
            return AffordabilityResult(
                request_id=request.request_id,
                amount_safe_to_pay=safe_amount_today,
                affordability_status='affordable_with_plan',
                recommended_payment_method='partial_payment',
                payment_plan=f'{request.request_date}:{safe_amount_today}|{earliest_safe_date}:{req_amount - safe_amount_today}',
                earliest_date_for_full_payment=earliest_safe_date,
                spending_changes_needed='none',
                decision_explanation=f'You can pay {safe_amount_today} today and the rest on {earliest_safe_date}.'
            )

        # 5. Not affordable
        return AffordabilityResult(
            request_id=request.request_id,
            amount_safe_to_pay=safe_amount_today,
            affordability_status='not_affordable',
            recommended_payment_method='not_recommended',
            payment_plan='none',
            earliest_date_for_full_payment=None,
            spending_changes_needed='none',
            decision_explanation='This purchase cannot be safely completed within your 90-day forecast without breaking your reserve.'
        )
