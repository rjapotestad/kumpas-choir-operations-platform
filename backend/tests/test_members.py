def test_create_member(client):
    response = client.post(
        "/members",
        json={"name": "Juan Dela Cruz", "email": "juan@example.com", "status": "Active", "section": "Soprano", "subsection": 1, "remarks": "Section leader"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Juan Dela Cruz"
    assert data["status"] == "Active"
    assert data["section"] == "Soprano"
    assert data["subsection"] == 1
    assert "id" in data


def test_create_member_defaults_to_active_status(client):
    response = client.post("/members", json={"name": "No Status Given", "section": "Alto"})
    assert response.status_code == 200
    assert response.json()["status"] == "Active"


def test_create_member_invalid_section_rejected(client):
    response = client.post("/members", json={"name": "Bad Section", "section": "Sopprano"})
    assert response.status_code == 422


def test_create_member_invalid_subsection_rejected(client):
    response = client.post("/members", json={"name": "Bad Subsection", "section": "Tenor", "subsection": 3})
    assert response.status_code == 422


def test_list_members(client):
    response = client.get("/members")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_filter_members_by_section(client):
    client.post("/members", json={"name": "Alto Member", "section": "Alto"})
    response = client.get("/members?section=Alto")
    assert response.status_code == 200
    assert all(m["section"] == "Alto" for m in response.json())


def test_filter_members_by_status(client):
    client.post("/members", json={"name": "Inactive Member", "section": "Bass", "status": "Inactive"})
    response = client.get("/members?status=Inactive")
    assert response.status_code == 200
    assert all(m["status"] == "Inactive" for m in response.json())


def test_get_member_success(client):
    create = client.post("/members", json={"name": "Findable Member", "section": "Tenor"})
    member_id = create.json()["id"]

    response = client.get(f"/members/{member_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Findable Member"


def test_get_member_not_found(client):
    response = client.get("/members/9999")
    assert response.status_code == 404


def test_update_member(client):
    create = client.post("/members", json={"name": "Original Name", "section": "Soprano"})
    member_id = create.json()["id"]

    response = client.put(f"/members/{member_id}", json={"remarks": "Promoted to section leader"})
    assert response.status_code == 200
    data = response.json()
    assert data["remarks"] == "Promoted to section leader"
    assert data["name"] == "Original Name"  # untouched fields stay untouched


def test_update_member_not_found(client):
    response = client.put("/members/9999", json={"remarks": "Doesn't matter"})
    assert response.status_code == 404


def test_delete_member(client):
    create = client.post("/members", json={"name": "To Delete", "section": "Bass"})
    member_id = create.json()["id"]

    response = client.delete(f"/members/{member_id}")
    assert response.status_code == 200

    get_response = client.get(f"/members/{member_id}")
    assert get_response.status_code == 404


def test_delete_member_not_found(client):
    response = client.delete("/members/9999")
    assert response.status_code == 404
