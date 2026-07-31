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

# Wipe and rebuild the schema fresh on every `pytest` invocation. Without
# this, test.db is a persistent file that accumulates data across every run
# (each `pytest` call adds more songs/members/attendance on top of whatever
# was left from last time) — harmless for tests that only check specific
# entities they just created, but it silently breaks any test asserting an
# exact GLOBAL total (e.g. analytics aggregates), since "total records" and
# "overall rate" would drift upward every time the suite runs.
Base.metadata.drop_all(bind=engine)
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


@pytest.fixture
def db_session():
    # A raw session for tests that need to bypass the API entirely — e.g.
    # confirming a database-level constraint actually exists, rather than
    # just testing that the endpoint's own logic happens to enforce it
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
