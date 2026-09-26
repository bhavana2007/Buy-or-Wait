import pytest
from main import app
from app.api.auth import get_current_user
from app.models.database import DBUser, Base, engine, DBFinancialProfile, SessionLocal

def mock_get_current_user():
    return DBUser(id="test_user", name="Test User", email="test@test.com", hashed_password="hash")

@pytest.fixture(autouse=True)
def setup_global_test_db(request):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not db.query(DBUser).first():
        db.add(DBUser(id="test_user", name="Test User", email="test@test.com", hashed_password="hash"))
        db.add(DBFinancialProfile(user_id="test_user", home_currency="INR", current_balance=50000.0, minimum_balance_to_keep=20000.0))
        db.commit()
    db.close()
    
    if request.module.__file__ and ("test_auth.py" in request.module.__file__ or "test_upload.py" in request.module.__file__):
        # don't apply to auth and upload security tests
        app.dependency_overrides.pop(get_current_user, None)
    else:
        app.dependency_overrides[get_current_user] = mock_get_current_user
        
    yield
    app.dependency_overrides.pop(get_current_user, None)
    # Don't drop tables, let them persist across tests in the session since some tests might assume state
