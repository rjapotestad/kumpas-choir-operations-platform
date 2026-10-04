def _make_member(client, name="History Test Member", section="Alto"):
    return client.post("/members", json={"name": name, "section": section}).json()


def test_attendance_history_not_found_for_missing_member(client):
    response = client.get("/members/9999/attendance-history")
    assert response.status_code == 404


def test_attendance_history_empty_for_member_with_no_records(client):
    member = _make_member(client)
    response = client.get(f"/members/{member['id']}/attendance-history")
    assert response.status_code == 200
    data = response.json()
    assert data["rehearsal_log"] == []
    assert data["gig_log"] == []
    assert data["total_records"] == 0
    assert data["attendance_rate"] == 0.0


def test_attendance_history_includes_rehearsal_log_with_remarks(client):
    member = _make_member(client)
    plan = client.post("/rehearsal-plans", json={"date": "2026-09-15", "title": "Weekly Rehearsal"}).json()
    client.put(
        f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}",
        json={"status": "Late", "remarks": "Traffic"},
    )

    response = client.get(f"/members/{member['id']}/attendance-history")
    assert response.status_code == 200
    data = response.json()
    assert len(data["rehearsal_log"]) == 1
    entry = data["rehearsal_log"][0]
    assert entry["rehearsal_plan_id"] == plan["id"]
    assert entry["title"] == "Weekly Rehearsal"
    assert entry["status"] == "Late"
    assert entry["remarks"] == "Traffic"
    assert data["gig_log"] == []
    assert data["total_records"] == 1


def test_attendance_history_includes_gig_log(client):
    member = _make_member(client)
    gig = client.post("/gigs", json={"event_name": "Christmas Concert", "date": "2026-12-20"}).json()
    client.put(
        f"/gigs/{gig['id']}/attendance/{member['id']}",
        json={"status": "Excused", "remarks": "Family emergency"},
    )

    response = client.get(f"/members/{member['id']}/attendance-history")
    assert response.status_code == 200
    data = response.json()
    assert data["rehearsal_log"] == []
    assert len(data["gig_log"]) == 1
    entry = data["gig_log"][0]
    assert entry["gig_id"] == gig["id"]
    assert entry["event_name"] == "Christmas Concert"
    assert entry["status"] == "Excused"
    assert entry["remarks"] == "Family emergency"


def test_attendance_history_combines_rate_across_rehearsals_and_gigs(client):
    member = _make_member(client)
    plan = client.post("/rehearsal-plans", json={"date": "2026-09-15"}).json()
    gig = client.post("/gigs", json={"event_name": "Concert", "date": "2026-09-20"}).json()
    client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": "Present"})
    client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Absent"})

    response = client.get(f"/members/{member['id']}/attendance-history")
    data = response.json()
    assert data["total_records"] == 2
    assert data["attendance_rate"] == 50.0  # 1 of 2 counted as "attended"


def test_attendance_history_filters_by_date_range(client):
    member = _make_member(client)
    old_plan = client.post("/rehearsal-plans", json={"date": "2026-01-10"}).json()
    recent_plan = client.post("/rehearsal-plans", json={"date": "2026-09-15"}).json()
    client.put(f"/rehearsal-plans/{old_plan['id']}/attendance/{member['id']}", json={"status": "Present"})
    client.put(f"/rehearsal-plans/{recent_plan['id']}/attendance/{member['id']}", json={"status": "Absent"})

    response = client.get(
        f"/members/{member['id']}/attendance-history",
        params={"date_from": "2026-06-01"},
    )
    data = response.json()
    assert len(data["rehearsal_log"]) == 1
    assert data["rehearsal_log"][0]["rehearsal_plan_id"] == recent_plan["id"]


def test_attendance_history_ordered_newest_first(client):
    member = _make_member(client)
    plan_a = client.post("/rehearsal-plans", json={"date": "2026-01-10"}).json()
    plan_b = client.post("/rehearsal-plans", json={"date": "2026-05-10"}).json()
    client.put(f"/rehearsal-plans/{plan_a['id']}/attendance/{member['id']}", json={"status": "Present"})
    client.put(f"/rehearsal-plans/{plan_b['id']}/attendance/{member['id']}", json={"status": "Present"})

    response = client.get(f"/members/{member['id']}/attendance-history")
    dates = [e["date"] for e in response.json()["rehearsal_log"]]
    assert dates == sorted(dates, reverse=True)
