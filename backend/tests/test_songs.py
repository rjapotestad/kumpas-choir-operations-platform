import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
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


# This is the key line: wherever main.py asks for get_db, hand it this instead
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_create_song():
    response = client.post(
        "/songs",
        json={"title": "Ave Maria", "composer_arranger": "Franz Biebl", "notes": "double choir"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Ave Maria"
    assert "id" in data


def test_list_songs():
    response = client.get("/songs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_song_not_found():
    response = client.get("/songs/9999")
    assert response.status_code == 404


def test_update_song():
    create = client.post("/songs", json={"title": "Original Title"})
    song_id = create.json()["id"]

    response = client.put(f"/songs/{song_id}", json={"title": "Updated Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_delete_song():
    create = client.post("/songs", json={"title": "To Delete"})
    song_id = create.json()["id"]

    response = client.delete(f"/songs/{song_id}")
    assert response.status_code == 200

    get_response = client.get(f"/songs/{song_id}")
    assert get_response.status_code == 404


def test_create_song_missing_title():
    # title is required — omitting it should trigger Pydantic validation, not a 500 or silent failure
    response = client.post("/songs", json={"composer_arranger": "No Title Here"})
    assert response.status_code == 422
