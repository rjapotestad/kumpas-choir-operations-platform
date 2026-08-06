def _make_gig_and_member(client):
    gig = client.post("/gigs", json={"event_name": "Attendance Test Gig", "date": "2027-03-01"}).json()
    member = client.post("/members", json={"name": "Gig Roster Member", "section": "Bass"}).json()
    return gig, member


def test_gig_roster_returns_unmarked_status(client):
    gig, member = _make_gig_and_member(client)
    response = client.get(f"/gigs/{gig['id']}/roster")
    assert response.status_code == 200
    entry = next(e for e in response.json() if e["member_id"] == member["id"])
    assert entry["status"] is None


def test_gig_roster_not_found_for_missing_gig(client):
    response = client.get("/gigs/9999/roster")
    assert response.status_code == 404


def test_mark_gig_attendance_creates_record(client):
    gig, member = _make_gig_and_member(client)
    response = client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Present"})
    assert response.status_code == 200
    assert response.json()["status"] == "Present"


def test_mark_gig_attendance_updates_existing_record(client):
    gig, member = _make_gig_and_member(client)
    client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Present"})
    response = client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Late"})
    assert response.status_code == 200
    assert response.json()["status"] == "Late"


def test_mark_gig_attendance_missing_gig_returns_404(client):
    _, member = _make_gig_and_member(client)
    response = client.put(f"/gigs/9999/attendance/{member['id']}", json={"status": "Present"})
    assert response.status_code == 404


def test_mark_gig_attendance_missing_member_returns_404(client):
    gig, _ = _make_gig_and_member(client)
    response = client.put(f"/gigs/{gig['id']}/attendance/9999", json={"status": "Present"})
    assert response.status_code == 404


def test_gig_and_rehearsal_attendance_are_independent(client):
    # Same member, same day-of-week worth of confusion potential — confirm
    # marking gig attendance never touches rehearsal attendance and vice versa
    gig, member = _make_gig_and_member(client)
    plan = client.post("/rehearsal-plans", json={"date": "2027-03-02"}).json()

    client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Present"})
    client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": "Absent"})

    gig_roster = client.get(f"/gigs/{gig['id']}/roster").json()
    rehearsal_roster = client.get(f"/rehearsal-plans/{plan['id']}/roster").json()

    gig_entry = next(e for e in gig_roster if e["member_id"] == member["id"])
    rehearsal_entry = next(e for e in rehearsal_roster if e["member_id"] == member["id"])

    assert gig_entry["status"] == "Present"
    assert rehearsal_entry["status"] == "Absent"


def test_deleting_gig_cascades_attendance(client):
    gig, member = _make_gig_and_member(client)
    client.put(f"/gigs/{gig['id']}/attendance/{member['id']}", json={"status": "Present"})

    delete_response = client.delete(f"/gigs/{gig['id']}")
    assert delete_response.status_code == 200

    new_gig = client.post("/gigs", json={"event_name": "Post-Delete Gig", "date": "2027-03-05"}).json()
    response = client.put(f"/gigs/{new_gig['id']}/attendance/{member['id']}", json={"status": "Present"})
    assert response.status_code == 200
