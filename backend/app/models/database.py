from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker

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
