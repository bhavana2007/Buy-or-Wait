import os
import csv
from typing import Dict, Optional

_exchange_rates: Optional[Dict[str, float]] = None

def get_exchange_rates() -> Dict[str, float]:
    global _exchange_rates
    if _exchange_rates is not None:
        return _exchange_rates
        
    _exchange_rates = {}
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "dataset", "exchange_rates.csv")
    
    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # key format: "2023-10-15:EUR:ZAR"
                    key = f"{row['rate_date']}:{row['from_currency']}:{row['to_currency']}"
                    _exchange_rates[key] = float(row['rate'])
        except Exception as e:
            print(f"Error loading exchange rates: {e}")
            
    return _exchange_rates
