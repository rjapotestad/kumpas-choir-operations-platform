def test_create_song(client):
    response = client.post(
        "/songs",
        json={"title": "Ave Maria", "composer_arranger": "Franz Biebl", "notes": "double choir"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Ave Maria"
    assert "id" in data


def test_list_songs(client):
    response = client.get("/songs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_song_not_found(client):
    response = client.get("/songs/9999")
    assert response.status_code == 404


def test_update_song(client):
    create = client.post("/songs", json={"title": "Original Title"})
    song_id = create.json()["id"]

    response = client.put(f"/songs/{song_id}", json={"title": "Updated Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_delete_song(client):
    create = client.post("/songs", json={"title": "To Delete"})
    song_id = create.json()["id"]

    response = client.delete(f"/songs/{song_id}")
    assert response.status_code == 200

    get_response = client.get(f"/songs/{song_id}")
    assert get_response.status_code == 404


def test_create_song_missing_title(client):
    # title is required — omitting it should trigger Pydantic validation, not a 500 or silent failure
    response = client.post("/songs", json={"composer_arranger": "No Title Here"})
    assert response.status_code == 422


def test_get_song_success(client):
    create = client.post("/songs", json={"title": "Findable Song"})
    song_id = create.json()["id"]

    response = client.get(f"/songs/{song_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Findable Song"


def test_update_song_not_found(client):
    response = client.put("/songs/9999", json={"title": "Doesn't matter"})
    assert response.status_code == 404


def test_delete_song_not_found(client):
    response = client.delete("/songs/9999")
    assert response.status_code == 404


def test_song_order_index_affects_listing_order(client):
    # Create three songs, then explicitly reorder them via order_index —
    # confirms GET /songs actually respects it, not just accepts it
    a = client.post("/songs", json={"title": "Order Test A"}).json()
    b = client.post("/songs", json={"title": "Order Test B"}).json()
    c = client.post("/songs", json={"title": "Order Test C"}).json()

    # Put them in reverse order: C, B, A
    client.put(f"/songs/{a['id']}", json={"order_index": 2})
    client.put(f"/songs/{b['id']}", json={"order_index": 1})
    client.put(f"/songs/{c['id']}", json={"order_index": 0})

    songs = client.get("/songs").json()
    ordered_ids = [s["id"] for s in songs if s["id"] in (a["id"], b["id"], c["id"])]
    assert ordered_ids == [c["id"], b["id"], a["id"]]
