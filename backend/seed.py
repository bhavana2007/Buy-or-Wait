from app.models.database import SessionLocal, DBUser, DBFinancialProfile, DBFinancialEvent
from datetime import date, timedelta

def seed():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(DBUser).first():
        print("Data already exists. Skipping seed.")
        return

    print("Seeding database...")
    user = DBUser(id="user_1", name="Demo User")
    db.add(user)
    
    profile = DBFinancialProfile(
        user_id="user_1",
        home_currency="INR",
        current_balance=45000.0,
        minimum_balance_to_keep=20000.0
    )
    db.add(profile)
    
    # Add a future salary
    salary = DBFinancialEvent(
        event_id="evt_1",
        user_id="user_1",
        amount=60000.0,
        currency="INR",
        date=date.today() + timedelta(days=15),
        status="scheduled",
        is_income=True,
        is_recurring=True,
        is_essential=True,
        is_flexible=False
    )
    db.add(salary)
    
    # Add an upcoming rent payment
    rent = DBFinancialEvent(
        event_id="evt_2",
        user_id="user_1",
        amount=15000.0,
        currency="INR",
        date=date.today() + timedelta(days=5),
        status="scheduled",
        is_income=False,
        is_recurring=True,
        is_essential=True,
        is_flexible=False
    )
    db.add(rent)
    
    db.commit()
    db.close()
    print("Database seeded.")

if __name__ == "__main__":
    seed()
