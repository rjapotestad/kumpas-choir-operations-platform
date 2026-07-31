def _seed_basic_dataset(client):
    """
    2 members, 2 rehearsals, hand-computable attendance:
      Plan 1: Member A = Present, Member B = Absent
      Plan 2: Member A = Present, Member B = Present

    Expected:
      Member A: 2/2 = 100%
      Member B: 1/2 = 50%
      Overall:  3/4 = 75%
      Soprano (A only): 100%
      Alto (B only):    50%
    """
    member_a = client.post("/members", json={"name": "Analytics A", "section": "Soprano"}).json()
    member_b = client.post("/members", json={"name": "Analytics B", "section": "Alto"}).json()
    plan1 = client.post("/rehearsal-plans", json={"date": "2026-10-01"}).json()
    plan2 = client.post("/rehearsal-plans", json={"date": "2026-10-08"}).json()

    client.put(f"/rehearsal-plans/{plan1['id']}/attendance/{member_a['id']}", json={"status": "Present"})
    client.put(f"/rehearsal-plans/{plan1['id']}/attendance/{member_b['id']}", json={"status": "Absent"})
    client.put(f"/rehearsal-plans/{plan2['id']}/attendance/{member_a['id']}", json={"status": "Present"})
    client.put(f"/rehearsal-plans/{plan2['id']}/attendance/{member_b['id']}", json={"status": "Present"})

    return member_a, member_b, plan1, plan2


def test_overall_rate(client):
    _seed_basic_dataset(client)
    response = client.get("/analytics/overall-rate")
    assert response.status_code == 200
    data = response.json()
    assert data["attendance_rate"] == 75.0
    assert data["total_records"] == 4


def test_attendance_by_section(client):
    _seed_basic_dataset(client)
    response = client.get("/analytics/attendance-by-section")
    assert response.status_code == 200
    by_section = {row["section"]: row["attendance_rate"] for row in response.json()}
    assert by_section["Soprano"] == 100.0
    assert by_section["Alto"] == 50.0


def test_top_attendees_ranks_higher_rate_first(client):
    member_a, member_b, _, _ = _seed_basic_dataset(client)
    # A large limit here, not the default 5 — other tests in this same
    # session create their own members too, so a small limit risks cutting
    # off the ones this test actually cares about
    response = client.get("/analytics/top-attendees?limit=1000")
    assert response.status_code == 200
    ids_in_order = [m["member_id"] for m in response.json()]
    assert ids_in_order.index(member_a["id"]) < ids_in_order.index(member_b["id"])


def test_most_absences_ranks_more_absences_first(client):
    member_a, member_b, _, _ = _seed_basic_dataset(client)
    response = client.get("/analytics/most-absences?limit=1000")
    assert response.status_code == 200
    ids_in_order = [m["member_id"] for m in response.json()]
    assert ids_in_order.index(member_b["id"]) < ids_in_order.index(member_a["id"])
    b_entry = next(m for m in response.json() if m["member_id"] == member_b["id"])
    assert b_entry["absent_count"] == 1


def test_trend_one_point_per_rehearsal_with_attendance(client):
    _, _, plan1, plan2 = _seed_basic_dataset(client)
    response = client.get("/analytics/trend")
    assert response.status_code == 200
    by_plan = {row["rehearsal_plan_id"]: row["attendance_rate"] for row in response.json()}
    assert by_plan[plan1["id"]] == 50.0   # 1 of 2 attended
    assert by_plan[plan2["id"]] == 100.0  # 2 of 2 attended


def test_trend_skips_rehearsals_with_no_attendance_taken(client):
    empty_plan = client.post("/rehearsal-plans", json={"date": "2026-10-15"}).json()
    response = client.get("/analytics/trend")
    ids = [row["rehearsal_plan_id"] for row in response.json()]
    assert empty_plan["id"] not in ids


def test_at_risk_empty_with_insufficient_history(client):
    _seed_basic_dataset(client)  # only 2 records per member, below the minimum needed
    response = client.get("/analytics/at-risk")
    assert response.status_code == 200
    # neither Analytics A nor B should appear — not enough history for a meaningful comparison
    names = [m["name"] for m in response.json()]
    assert "Analytics A" not in names
    assert "Analytics B" not in names


def test_at_risk_flags_a_real_decline(client):
    member = client.post("/members", json={"name": "Declining Member", "section": "Tenor"}).json()
    dates = ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"]
    # first 2 rehearsals present, last 3 absent — clear recent decline
    statuses = ["Present", "Present", "Absent", "Absent", "Absent"]

    for date, status in zip(dates, statuses):
        plan = client.post("/rehearsal-plans", json={"date": date}).json()
        client.put(f"/rehearsal-plans/{plan['id']}/attendance/{member['id']}", json={"status": status})

    response = client.get("/analytics/at-risk")
    assert response.status_code == 200
    flagged = next((m for m in response.json() if m["member_id"] == member["id"]), None)
    assert flagged is not None
    assert flagged["recent_rate"] == 0.0
    assert flagged["historical_rate"] == 40.0  # 2 of 5 overall
