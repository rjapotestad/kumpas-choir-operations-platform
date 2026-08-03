def test_create_gig(client):
    response = client.post(
        "/gigs",
        json={
            "event_name": "Christmas Concert",
            "date": "2026-12-15",
            "venue": "City Hall",
            "performance_time": "19:00",
            "costume": "Formal black",
            "notes": "Call time 17:00, soundcheck 18:00",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["event_name"] == "Christmas Concert"
    assert "id" in data


def test_create_gig_minimal(client):
    response = client.post("/gigs", json={"event_name": "Quick Gig", "date": "2026-12-20"})
    assert response.status_code == 200
    assert response.json()["venue"] is None


def test_list_gigs(client):
    client.post("/gigs", json={"event_name": "List Test Gig", "date": "2026-12-25"})
    response = client.get("/gigs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_gig_success(client):
    create = client.post("/gigs", json={"event_name": "Findable Gig", "date": "2027-01-01"})
    gig_id = create.json()["id"]
    response = client.get(f"/gigs/{gig_id}")
    assert response.status_code == 200
    assert response.json()["event_name"] == "Findable Gig"


def test_get_gig_not_found(client):
    response = client.get("/gigs/9999")
    assert response.status_code == 404


def test_update_gig(client):
    create = client.post("/gigs", json={"event_name": "Original Gig", "date": "2027-01-05"})
    gig_id = create.json()["id"]
    response = client.put(f"/gigs/{gig_id}", json={"venue": "New Venue"})
    assert response.status_code == 200
    data = response.json()
    assert data["venue"] == "New Venue"
    assert data["event_name"] == "Original Gig"  # untouched field stays untouched


def test_update_gig_not_found(client):
    response = client.put("/gigs/9999", json={"venue": "Doesn't matter"})
    assert response.status_code == 404


def test_delete_gig(client):
    create = client.post("/gigs", json={"event_name": "To Delete", "date": "2027-01-10"})
    gig_id = create.json()["id"]
    response = client.delete(f"/gigs/{gig_id}")
    assert response.status_code == 200
    assert client.get(f"/gigs/{gig_id}").status_code == 404


def test_delete_gig_not_found(client):
    response = client.delete("/gigs/9999")
    assert response.status_code == 404
