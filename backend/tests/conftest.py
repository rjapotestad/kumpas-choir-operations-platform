import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app, verify_access_code
from app.database import Base, get_db

# A separate, throwaway SQLite file just for tests — never touches kumpas_db
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Tests shouldn't depend on whatever ACCESS_CODE happens to be set in the
# developer's local .env — bypass the access-code check entirely for tests
app.dependency_overrides[verify_access_code] = lambda: None


@pytest.fixture
def client():
    return TestClient(app)
