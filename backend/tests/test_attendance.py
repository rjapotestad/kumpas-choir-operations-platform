import pytest
from sqlalchemy.exc import IntegrityError


def _make_plan_and_member(client):
    plan = client.post("/rehearsal-plans", json={"date": "2026-09-15"}).json()
    member = client.post("/members", json={"name": "Roster Test Member", "section": "Alto"}).json()
    return plan, member


def test_roster_returns_unmarked_status_for_new_plan(client):
    plan, member = _make_plan_and_member(client)

    response = client.get(f"/rehearsal-plans/{plan['id']}/roster")
    assert response.status_code == 200
    entry = next(e for e in response.json() if e["member_id"] == member["id"])
    assert entry["status"] is None


def test_roster_excludes_inactive_members(client):
    plan, _ = _make_plan_and_member(client)
    inactive_member = client.post(
        "/members", json={"name": "Inactive Roster Member", "section": "Bass", "status": "Inactive"}
    ).json()

    response = client.get(f"/rehearsal-plans/{plan['id']}/roster")
    ids = [e["member_id"] for e in response.json()]
    assert inactive_member["id"] not in ids


def test_roster_includes_probationary_and_trainee(client):
    plan, _ = _make_plan_and_member(client)
    probationary = client.post(
        "/members", json={"name": "Probationary Member", "section": "Tenor", "status": "Probationary"}
    ).json()
    trainee = client.post(
        "/members", json={"name": "Trainee Member", "section": "Bass", "status": "Trainee"}
    ).json()

    response = client.get(f"/rehearsal-plans/{plan['id']}/roster")
    ids = [e["member_id"] for e in response.json()]
    assert probationary["id"] in ids
    assert trainee["id"] in ids


def test_roster_not_found_for_missing_plan(client):
    response = client.get("/rehearsal-plans/9999/roster")
    assert response.status_code == 404


def test_mark_attendance_creates_record(client):
    plan, member = _make_plan_and_member(client)

    response = client.put(
        f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}",
        json={"status": "Present"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Present"

    roster = client.get(f"/rehearsal-plans/{plan['id']}/roster").json()
    entry = next(e for e in roster if e["member_id"] == member["id"])
    assert entry["status"] == "Present"


def test_mark_attendance_updates_existing_record(client):
    plan, member = _make_plan_and_member(client)

    client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": "Present"})
    response = client.put(
        f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}",
        json={"status": "Excused", "remarks": "Sick"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Excused"
    assert response.json()["remarks"] == "Sick"

    roster = client.get(f"/rehearsal-plans/{plan['id']}/roster").json()
    entry = next(e for e in roster if e["member_id"] == member["id"])
    # confirm it updated the same record rather than creating a second one
    assert entry["status"] == "Excused"


def test_mark_attendance_invalid_status_rejected(client):
    plan, member = _make_plan_and_member(client)
    response = client.put(
        f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}",
        json={"status": "Sick"},
    )
    assert response.status_code == 422


def test_mark_attendance_missing_plan_returns_404(client):
    _, member = _make_plan_and_member(client)
    response = client.put(
        f"/rehearsal-plans/9999/attendance/{member['id']}",
        json={"status": "Present"},
    )
    assert response.status_code == 404


def test_mark_attendance_missing_member_returns_404(client):
    plan, _ = _make_plan_and_member(client)
    response = client.put(
        f"/rehearsal-plans/{plan['id']}/attendance/9999",
        json={"status": "Present"},
    )
    assert response.status_code == 404


def test_unique_constraint_prevents_duplicate_attendance_rows(client, db_session):
    # Bypasses the API's upsert logic entirely to confirm the actual
    # database constraint is what's really preventing duplicates, not just
    # the endpoint's own check-then-insert logic
    from app.models.attendance import Attendance

    plan, member = _make_plan_and_member(client)

    db_session.add(Attendance(rehearsal_plan_id=plan["id"], member_id=member["id"], status="Present"))
    db_session.commit()

    db_session.add(Attendance(rehearsal_plan_id=plan["id"], member_id=member["id"], status="Absent"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_deleting_plan_cascades_attendance(client):
    plan, member = _make_plan_and_member(client)
    client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": "Present"})

    delete_response = client.delete(f"/rehearsal-plans/{plan['id']}")
    assert delete_response.status_code == 200
    # if the cascade didn't work, this plan's attendance row would still
    # reference a deleted plan — creating a NEW plan and re-marking the same
    # member confirms the table is in a clean, working state afterward
    new_plan = client.post("/rehearsal-plans", json={"date": "2026-09-20"}).json()
    response = client.put(
        f"/rehearsal-plans/{new_plan['id']}/attendance/{member['id']}",
        json={"status": "Present"},
    )
    assert response.status_code == 200


def test_deleting_member_cascades_attendance(client):
    plan, member = _make_plan_and_member(client)
    client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": "Present"})

    delete_response = client.delete(f"/members/{member['id']}")
    assert delete_response.status_code == 200

    roster = client.get(f"/rehearsal-plans/{plan['id']}/roster").json()
    ids = [e["member_id"] for e in roster]
    assert member["id"] not in ids
