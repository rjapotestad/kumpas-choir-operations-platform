def test_create_rehearsal_plan(client):
    response = client.post(
        "/rehearsal-plans",
        json={"date": "2026-08-01", "title": "August Kickoff", "notes": "first rehearsal of the season"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "August Kickoff"
    assert "id" in data


def test_get_rehearsal_plan_not_found(client):
    response = client.get("/rehearsal-plans/9999")
    assert response.status_code == 404


def test_add_item_to_plan(client):
    plan = client.post("/rehearsal-plans", json={"date": "2026-08-08"}).json()
    song = client.post("/songs", json={"title": "Iduyan Mo"}).json()

    response = client.post(
        f"/rehearsal-plans/{plan['id']}/items",
        json={"song_id": song["id"], "start_time": "18:00", "duration_minutes": 15, "order_index": 0},
    )
    assert response.status_code == 200
    item = response.json()
    assert item["song_id"] == song["id"]
    assert item["order_index"] == 0

    # confirm the item actually shows up nested under the plan
    plan_response = client.get(f"/rehearsal-plans/{plan['id']}")
    assert len(plan_response.json()["items"]) == 1


def test_add_item_with_missing_song_returns_404(client):
    plan = client.post("/rehearsal-plans", json={"date": "2026-08-08"}).json()

    response = client.post(
        f"/rehearsal-plans/{plan['id']}/items",
        json={"song_id": 9999, "order_index": 0},
    )
    assert response.status_code == 404


def test_reorder_item(client):
    plan = client.post("/rehearsal-plans", json={"date": "2026-08-15"}).json()
    song = client.post("/songs", json={"title": "Reorder Test Song"}).json()
    item = client.post(
        f"/rehearsal-plans/{plan['id']}/items",
        json={"song_id": song["id"], "order_index": 0},
    ).json()

    response = client.put(
        f"/rehearsal-plans/{plan['id']}/items/{item['id']}",
        json={"order_index": 3},
    )
    assert response.status_code == 200
    assert response.json()["order_index"] == 3


def test_remove_item_from_plan(client):
    plan = client.post("/rehearsal-plans", json={"date": "2026-08-22"}).json()
    song = client.post("/songs", json={"title": "Remove Test Song"}).json()
    item = client.post(
        f"/rehearsal-plans/{plan['id']}/items",
        json={"song_id": song["id"], "order_index": 0},
    ).json()

    response = client.delete(f"/rehearsal-plans/{plan['id']}/items/{item['id']}")
    assert response.status_code == 200

    plan_response = client.get(f"/rehearsal-plans/{plan['id']}")
    assert len(plan_response.json()["items"]) == 0


def test_deleting_plan_does_not_orphan_items(client):
    # This is the cascade-delete test — the one Slice 2's spec specifically calls for
    plan = client.post("/rehearsal-plans", json={"date": "2026-08-29"}).json()
    song = client.post("/songs", json={"title": "Cascade Test Song"}).json()
    item = client.post(
        f"/rehearsal-plans/{plan['id']}/items",
        json={"song_id": song["id"], "order_index": 0},
    ).json()

    delete_response = client.delete(f"/rehearsal-plans/{plan['id']}")
    assert delete_response.status_code == 200

    # the plan itself is gone
    assert client.get(f"/rehearsal-plans/{plan['id']}").status_code == 404

    # and its item can no longer be reached either — proves it wasn't left orphaned
    orphan_check = client.put(
        f"/rehearsal-plans/{plan['id']}/items/{item['id']}",
        json={"order_index": 1},
    )
    assert orphan_check.status_code == 404
