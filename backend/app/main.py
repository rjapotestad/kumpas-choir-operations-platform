from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import Base, engine, get_db
from app.models.song import Song as SongModel
from app.models.rehearsal_plan import RehearsalPlan as RehearsalPlanModel, RehearsalPlanItem as RehearsalPlanItemModel
from app.models.member import Member as MemberModel
from app.models.attendance import Attendance as AttendanceModel
from app.models.gig import Gig as GigModel, GigItem as GigItemModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as date_type
from enum import Enum
from typing import Literal
import os

app = FastAPI()

# ACCESS_CODE is a shared secret (like a wifi password) that gates the real
# data routes so random visitors who find the live URL can't view or edit
# your songs/plans. This is NOT per-user auth — everyone who knows the code
# shares the same data, same as today. If unset, the app is left open (so
# local dev doesn't require setting anything).
ACCESS_CODE = os.getenv("ACCESS_CODE")

async def verify_access_code(x_access_code: str | None = Header(None)):
    if ACCESS_CODE and x_access_code != ACCESS_CODE:
        raise HTTPException(status_code=401, detail="Invalid or missing access code")

# CORS_ORIGINS is a comma-separated list of allowed frontend URLs, set via
# environment variable so production origins (Vercel/Netlify) don't need to
# be hardcoded here. Falls back to the local Vite dev server if unset.
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
#Get App Info
@app.get("/appinfo")
async def get_appinfo():
    return {"app":"Kumpas","version":"0.1.0","status":"healthy"}

class SongCreate(BaseModel):
    title:str
    composer_arranger:str|None = None
    notes:str|None = None

class SongUpdate(BaseModel):
    title:str|None = None
    composer_arranger:str|None = None
    notes:str|None = None
    order_index:int|None = None
class RehearsalPlanCreate(BaseModel):
    date: date_type
    title: str | None = None
    notes: str | None = None
    start_time: str = "17:30"
    end_time: str = "20:00"

class RehearsalPlanItemCreate(BaseModel):
    song_id: int
    start_time: str | None = None
    duration_minutes: int | None = None
    order_index: int

class RehearsalPlanItemUpdate(BaseModel):
    start_time: str | None = None
    duration_minutes: int | None = None
    order_index: int | None = None

class RehearsalPlanUpdate(BaseModel):
    date: date_type | None = None
    title: str | None = None
    notes: str | None = None
    start_time: str | None = None
    end_time: str | None = None

# Response schemas — reading these fields (rather than passively returning
# the raw SQLAlchemy object) is what actually triggers SQLAlchemy to load
# lazy relationships like `items` and `song` before serializing to JSON.
class SongOut(BaseModel):
    id: int
    title: str
    composer_arranger: str | None = None
    notes: str | None = None
    model_config = {"from_attributes": True}

class RehearsalPlanItemOut(BaseModel):
    id: int
    song_id: int
    start_time: str | None = None
    duration_minutes: int | None = None
    order_index: int
    song: SongOut
    model_config = {"from_attributes": True}

class RehearsalPlanOut(BaseModel):
    id: int
    date: date_type
    title: str | None = None
    notes: str | None = None
    start_time: str
    end_time: str
    items: list[RehearsalPlanItemOut] = []
    model_config = {"from_attributes": True}

class MemberStatus(str, Enum):
    active = "Active"
    inactive = "Inactive"
    probationary = "Probationary"
    trainee = "Trainee"

class MemberSection(str, Enum):
    soprano = "Soprano"
    alto = "Alto"
    tenor = "Tenor"
    bass = "Bass"

class MemberCreate(BaseModel):
    name: str
    email: str | None = None
    status: MemberStatus = MemberStatus.active
    section: MemberSection
    subsection: Literal[1, 2] | None = None
    remarks: str | None = None

class MemberUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    status: MemberStatus | None = None
    section: MemberSection | None = None
    subsection: Literal[1, 2] | None = None
    remarks: str | None = None

class AttendanceStatus(str, Enum):
    present = "Present"
    absent = "Absent"
    excused = "Excused"
    late = "Late"

class AttendanceUpdate(BaseModel):
    status: AttendanceStatus
    remarks: str | None = None

class RosterEntryOut(BaseModel):
    member_id: int
    name: str
    section: str
    subsection: int | None = None
    status: str | None = None  # None means "unmarked" — no attendance record exists yet for this rehearsal
    remarks: str | None = None

class SectionAttendanceOut(BaseModel):
    section: str
    attendance_rate: float
    total_records: int

class MemberAttendanceOut(BaseModel):
    member_id: int
    name: str
    section: str
    present_count: int = 0
    absent_count: int = 0
    excused_count: int = 0
    late_count: int = 0
    attendance_rate: float

class OverallRateOut(BaseModel):
    attendance_rate: float
    total_records: int

class TrendPointOut(BaseModel):
    rehearsal_plan_id: int
    date: date_type
    attendance_rate: float

class AtRiskMemberOut(BaseModel):
    member_id: int
    name: str
    section: str
    recent_rate: float
    historical_rate: float

class GigCreate(BaseModel):
    event_name: str
    date: date_type
    venue: str | None = None
    performance_time: str | None = None
    costume: str | None = None
    notes: str | None = None

class GigUpdate(BaseModel):
    event_name: str | None = None
    date: date_type | None = None
    venue: str | None = None
    performance_time: str | None = None
    costume: str | None = None
    notes: str | None = None

class GigItemCreate(BaseModel):
    song_id: int
    order_index: int

class GigItemUpdate(BaseModel):
    order_index: int | None = None

class GigItemOut(BaseModel):
    id: int
    song_id: int
    order_index: int
    song: SongOut
    model_config = {"from_attributes": True}

class GigOut(BaseModel):
    id: int
    event_name: str
    date: date_type
    venue: str | None = None
    performance_time: str | None = None
    costume: str | None = None
    notes: str | None = None
    items: list[GigItemOut] = []
    model_config = {"from_attributes": True}
#Print all songs
@app.get("/songs", dependencies=[Depends(verify_access_code)])
async def get_songs_db(db: Session = Depends(get_db)):
    from sqlalchemy import nullslast
    return db.query(SongModel).order_by(nullslast(SongModel.order_index), SongModel.id).all()
#Print songs based on ID
@app.get("/songs/{id}", dependencies=[Depends(verify_access_code)])
async def get_song(id:int, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    return song
#Add new songs
@app.post("/songs", dependencies=[Depends(verify_access_code)])
async def add_song(song: SongCreate, db: Session = Depends(get_db)):
    new_song = SongModel(**song.model_dump())
    db.add(new_song)
    db.commit()
    db.refresh(new_song)
    return new_song
#Update song data 
@app.put("/songs/{id}", dependencies=[Depends(verify_access_code)])
async def update_song(id:int, updates: SongUpdate, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    if updates.title:
        song.title = updates.title
    if updates.composer_arranger is not None:
        song.composer_arranger = updates.composer_arranger or None
    if updates.notes is not None:
        song.notes = updates.notes or None
    if updates.order_index is not None:
        song.order_index = updates.order_index
    db.commit()
    db.refresh(song)
    return song
#Delete song
@app.delete("/songs/{id}", dependencies=[Depends(verify_access_code)])
async def delete_song(id:int, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    # Deleting a song also removes it from any rehearsal plan it's currently
    # placed in, across ALL plans (not just whichever one the UI happens to
    # be showing) — rather than blocking the deletion until the user manually
    # removes every placement first.
    db.query(RehearsalPlanItemModel).filter(RehearsalPlanItemModel.song_id == id).delete()
    db.delete(song)
    db.commit()
    return {"Result":f"song {id} deleted"}

#Create a rehearsal plan
@app.post("/rehearsal-plans", response_model=RehearsalPlanOut, dependencies=[Depends(verify_access_code)])
async def add_rehearsal_plan(plan: RehearsalPlanCreate, db: Session = Depends(get_db)):
    new_plan = RehearsalPlanModel(**plan.model_dump())
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

#List all rehearsal plans, optionally filtered to a single calendar month
@app.get("/rehearsal-plans", response_model=list[RehearsalPlanOut], dependencies=[Depends(verify_access_code)])
async def get_rehearsal_plans(month: str | None = None, db: Session = Depends(get_db)):
    query = db.query(RehearsalPlanModel)
    if month:
        from sqlalchemy import extract
        try:
            year_str, month_str = month.split("-")
            query = query.filter(
                extract("year", RehearsalPlanModel.date) == int(year_str),
                extract("month", RehearsalPlanModel.date) == int(month_str),
            )
        except (ValueError, AttributeError):
            raise HTTPException(status_code=422, detail="month must be in YYYY-MM format")
    return query.order_by(RehearsalPlanModel.date, RehearsalPlanModel.id).all()

#Get one rehearsal plan, including its items
@app.get("/rehearsal-plans/{id}", response_model=RehearsalPlanOut, dependencies=[Depends(verify_access_code)])
async def get_rehearsal_plan(id: int, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")
    return plan

#Update a rehearsal plan's own fields (date/title/notes)
@app.put("/rehearsal-plans/{id}", response_model=RehearsalPlanOut, dependencies=[Depends(verify_access_code)])
async def update_rehearsal_plan(id: int, updates: RehearsalPlanUpdate, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")

    if updates.date is not None:
        plan.date = updates.date
    if updates.title is not None:
        plan.title = updates.title
    if updates.notes is not None:
        plan.notes = updates.notes
    if updates.start_time is not None:
        plan.start_time = updates.start_time
    if updates.end_time is not None:
        plan.end_time = updates.end_time

    db.commit()
    db.refresh(plan)
    return plan

#Delete a rehearsal plan (and its items, via cascade)
@app.delete("/rehearsal-plans/{id}", dependencies=[Depends(verify_access_code)])
async def delete_rehearsal_plan(id: int, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")
    db.delete(plan)
    db.commit()
    return {"Result": f"rehearsal plan {id} deleted"}

#Add an item (song block) to a rehearsal plan
@app.post("/rehearsal-plans/{id}/items", response_model=RehearsalPlanItemOut, dependencies=[Depends(verify_access_code)])
async def add_rehearsal_plan_item(id: int, item: RehearsalPlanItemCreate, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")

    song = db.query(SongModel).filter(SongModel.id == item.song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")

    new_item = RehearsalPlanItemModel(rehearsal_plan_id=id, **item.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

#Update an item's time/order/duration
@app.put("/rehearsal-plans/{id}/items/{item_id}", response_model=RehearsalPlanItemOut, dependencies=[Depends(verify_access_code)])
async def update_rehearsal_plan_item(id: int, item_id: int, updates: RehearsalPlanItemUpdate, db: Session = Depends(get_db)):
    item = db.query(RehearsalPlanItemModel).filter(
        RehearsalPlanItemModel.id == item_id,
        RehearsalPlanItemModel.rehearsal_plan_id == id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="rehearsal plan item not found")

    if updates.start_time is not None:
        item.start_time = updates.start_time
    if updates.duration_minutes is not None:
        item.duration_minutes = updates.duration_minutes
    if updates.order_index is not None:
        item.order_index = updates.order_index

    db.commit()
    db.refresh(item)
    return item

#Remove an item from a rehearsal plan
@app.delete("/rehearsal-plans/{id}/items/{item_id}", dependencies=[Depends(verify_access_code)])
async def delete_rehearsal_plan_item(id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(RehearsalPlanItemModel).filter(
        RehearsalPlanItemModel.id == item_id,
        RehearsalPlanItemModel.rehearsal_plan_id == id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="rehearsal plan item not found")

    db.delete(item)
    db.commit()
    return {"Result": f"item {item_id} deleted from plan {id}"}

#List members, optionally filtered by section and/or status
@app.get("/members", dependencies=[Depends(verify_access_code)])
async def get_members(section: MemberSection | None = None, status: MemberStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(MemberModel)
    if section:
        query = query.filter(MemberModel.section == section.value)
    if status:
        query = query.filter(MemberModel.status == status.value)
    return query.order_by(MemberModel.name).all()

#Get a single member
@app.get("/members/{id}", dependencies=[Depends(verify_access_code)])
async def get_member(id: int, db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="member not found")
    return member

#Add a new member
@app.post("/members", dependencies=[Depends(verify_access_code)])
async def add_member(member: MemberCreate, db: Session = Depends(get_db)):
    data = member.model_dump()
    data["status"] = member.status.value
    data["section"] = member.section.value
    new_member = MemberModel(**data)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

#Update member data
@app.put("/members/{id}", dependencies=[Depends(verify_access_code)])
async def update_member(id: int, updates: MemberUpdate, db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="member not found")
    if updates.name:
        member.name = updates.name
    if updates.email is not None:
        member.email = updates.email or None
    if updates.status is not None:
        member.status = updates.status.value
    if updates.section is not None:
        member.section = updates.section.value
    if updates.subsection is not None:
        member.subsection = updates.subsection
    if updates.remarks is not None:
        member.remarks = updates.remarks or None
    db.commit()
    db.refresh(member)
    return member

#Delete a member
@app.delete("/members/{id}", dependencies=[Depends(verify_access_code)])
async def delete_member(id: int, db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="member not found")
    db.delete(member)
    db.commit()
    return {"Result": f"member {id} deleted"}

#Roster for a rehearsal — every non-Inactive member, with their attendance
#status for this specific rehearsal (null/"unmarked" if not yet recorded)
@app.get("/rehearsal-plans/{id}/roster", response_model=list[RosterEntryOut], dependencies=[Depends(verify_access_code)])
async def get_roster(id: int, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")

    members = (
        db.query(MemberModel)
        .filter(MemberModel.status != MemberStatus.inactive.value)
        .order_by(MemberModel.section, MemberModel.subsection, MemberModel.name)
        .all()
    )
    attendance_records = db.query(AttendanceModel).filter(AttendanceModel.rehearsal_plan_id == id).all()
    attendance_by_member = {a.member_id: a for a in attendance_records}

    roster = []
    for member in members:
        record = attendance_by_member.get(member.id)
        roster.append(RosterEntryOut(
            member_id=member.id,
            name=member.name,
            section=member.section,
            subsection=member.subsection,
            status=record.status if record else None,
            remarks=record.remarks if record else None,
        ))
    return roster

#Mark (create or update) one member's attendance status for a rehearsal —
#an upsert, so the frontend doesn't need to know whether a record already exists
@app.put("/rehearsal-plans/{id}/attendance/{member_id}", dependencies=[Depends(verify_access_code)])
async def mark_attendance(id: int, member_id: int, updates: AttendanceUpdate, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")

    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="member not found")

    record = db.query(AttendanceModel).filter(
        AttendanceModel.rehearsal_plan_id == id,
        AttendanceModel.member_id == member_id,
    ).first()

    if record:
        record.status = updates.status.value
        record.remarks = updates.remarks
    else:
        record = AttendanceModel(
            rehearsal_plan_id=id,
            member_id=member_id,
            status=updates.status.value,
            remarks=updates.remarks,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record

#Roster for a gig — same shape as the rehearsal version, keyed to gig_id instead
@app.get("/gigs/{id}/roster", response_model=list[RosterEntryOut], dependencies=[Depends(verify_access_code)])
async def get_gig_roster(id: int, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")

    members = (
        db.query(MemberModel)
        .filter(MemberModel.status != MemberStatus.inactive.value)
        .order_by(MemberModel.section, MemberModel.subsection, MemberModel.name)
        .all()
    )
    attendance_records = db.query(AttendanceModel).filter(AttendanceModel.gig_id == id).all()
    attendance_by_member = {a.member_id: a for a in attendance_records}

    roster = []
    for member in members:
        record = attendance_by_member.get(member.id)
        roster.append(RosterEntryOut(
            member_id=member.id,
            name=member.name,
            section=member.section,
            subsection=member.subsection,
            status=record.status if record else None,
            remarks=record.remarks if record else None,
        ))
    return roster

#Mark (create or update) one member's attendance/personnel status for a gig
@app.put("/gigs/{id}/attendance/{member_id}", dependencies=[Depends(verify_access_code)])
async def mark_gig_attendance(id: int, member_id: int, updates: AttendanceUpdate, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")

    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="member not found")

    record = db.query(AttendanceModel).filter(
        AttendanceModel.gig_id == id,
        AttendanceModel.member_id == member_id,
    ).first()

    if record:
        record.status = updates.status.value
        record.remarks = updates.remarks
    else:
        record = AttendanceModel(
            gig_id=id,
            member_id=member_id,
            status=updates.status.value,
            remarks=updates.remarks,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record

# ---------- Analytics ----------
# "Attended" = Present or Late (they showed up). "Did not attend" = Absent
# or Excused (Excused only explains *why*, it doesn't change whether they
# were there). All rate calculations below use this definition consistently.

def _tally_status(records):
    counts = {"Present": 0, "Absent": 0, "Excused": 0, "Late": 0}
    for r in records:
        counts[r.status] = counts.get(r.status, 0) + 1
    return counts

def _rate_from_counts(counts):
    total = sum(counts.values())
    attended = counts.get("Present", 0) + counts.get("Late", 0)
    return round(attended / total * 100, 1) if total else 0.0

def _all_member_stats(db: Session):
    """MemberAttendanceOut for every member who has at least one attendance record."""
    members = db.query(MemberModel).all()
    stats = []
    for member in members:
        records = db.query(AttendanceModel).filter(AttendanceModel.member_id == member.id).all()
        if not records:
            continue
        counts = _tally_status(records)
        stats.append(MemberAttendanceOut(
            member_id=member.id,
            name=member.name,
            section=member.section,
            present_count=counts["Present"],
            absent_count=counts["Absent"],
            excused_count=counts["Excused"],
            late_count=counts["Late"],
            attendance_rate=_rate_from_counts(counts),
        ))
    return stats

#Average attendance rate per section
@app.get("/analytics/attendance-by-section", response_model=list[SectionAttendanceOut], dependencies=[Depends(verify_access_code)])
async def attendance_by_section(db: Session = Depends(get_db)):
    records = db.query(AttendanceModel).join(MemberModel).all()
    by_section = {}
    for record in records:
        section = record.member.section
        by_section.setdefault(section, {"attended": 0, "total": 0})
        by_section[section]["total"] += 1
        if record.status in ("Present", "Late"):
            by_section[section]["attended"] += 1

    result = [
        SectionAttendanceOut(
            section=section,
            attendance_rate=round(counts["attended"] / counts["total"] * 100, 1),
            total_records=counts["total"],
        )
        for section, counts in by_section.items()
    ]
    return sorted(result, key=lambda r: r.section)

#Attendance rate across every member, every rehearsal
@app.get("/analytics/overall-rate", response_model=OverallRateOut, dependencies=[Depends(verify_access_code)])
async def overall_rate(db: Session = Depends(get_db)):
    records = db.query(AttendanceModel).all()
    counts = _tally_status(records)
    return OverallRateOut(attendance_rate=_rate_from_counts(counts), total_records=len(records))

#Members with the highest attendance rate
@app.get("/analytics/top-attendees", response_model=list[MemberAttendanceOut], dependencies=[Depends(verify_access_code)])
async def top_attendees(limit: int = 5, db: Session = Depends(get_db)):
    stats = _all_member_stats(db)
    stats.sort(key=lambda s: s.attendance_rate, reverse=True)
    return stats[:limit]

#Members with the most absences (raw count, not rate)
@app.get("/analytics/most-absences", response_model=list[MemberAttendanceOut], dependencies=[Depends(verify_access_code)])
async def most_absences(limit: int = 5, db: Session = Depends(get_db)):
    stats = _all_member_stats(db)
    stats.sort(key=lambda s: s.absent_count, reverse=True)
    return stats[:limit]

#Overall attendance rate per rehearsal, in date order — for a trend line
@app.get("/analytics/trend", response_model=list[TrendPointOut], dependencies=[Depends(verify_access_code)])
async def attendance_trend(db: Session = Depends(get_db)):
    plans = db.query(RehearsalPlanModel).order_by(RehearsalPlanModel.date).all()
    trend = []
    for plan in plans:
        records = db.query(AttendanceModel).filter(AttendanceModel.rehearsal_plan_id == plan.id).all()
        if not records:
            continue  # skip rehearsals where attendance was never taken
        trend.append(TrendPointOut(
            rehearsal_plan_id=plan.id,
            date=plan.date,
            attendance_rate=_rate_from_counts(_tally_status(records)),
        ))
    return trend

#Members whose recent attendance has dropped notably below their own historical average
@app.get("/analytics/at-risk", response_model=list[AtRiskMemberOut], dependencies=[Depends(verify_access_code)])
async def at_risk_members(db: Session = Depends(get_db)):
    RECENT_WINDOW = 3
    DROP_THRESHOLD = 20.0  # percentage points

    members = db.query(MemberModel).all()
    at_risk = []
    for member in members:
        records = (
            db.query(AttendanceModel)
            .join(RehearsalPlanModel, AttendanceModel.rehearsal_plan_id == RehearsalPlanModel.id)
            .filter(AttendanceModel.member_id == member.id)
            .order_by(RehearsalPlanModel.date)
            .all()
        )
        if len(records) < RECENT_WINDOW + 1:
            continue  # not enough history for a meaningful comparison

        historical_rate = _rate_from_counts(_tally_status(records))
        recent_rate = _rate_from_counts(_tally_status(records[-RECENT_WINDOW:]))

        if historical_rate - recent_rate >= DROP_THRESHOLD:
            at_risk.append(AtRiskMemberOut(
                member_id=member.id,
                name=member.name,
                section=member.section,
                recent_rate=recent_rate,
                historical_rate=historical_rate,
            ))
    return at_risk

#List all gigs
@app.get("/gigs", response_model=list[GigOut], dependencies=[Depends(verify_access_code)])
async def get_gigs(db: Session = Depends(get_db)):
    return db.query(GigModel).order_by(GigModel.date).all()

#Get a single gig, including its repertoire
@app.get("/gigs/{id}", response_model=GigOut, dependencies=[Depends(verify_access_code)])
async def get_gig(id: int, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")
    return gig

#Create a gig
@app.post("/gigs", response_model=GigOut, dependencies=[Depends(verify_access_code)])
async def add_gig(gig: GigCreate, db: Session = Depends(get_db)):
    new_gig = GigModel(**gig.model_dump())
    db.add(new_gig)
    db.commit()
    db.refresh(new_gig)
    return new_gig

#Update a gig
@app.put("/gigs/{id}", response_model=GigOut, dependencies=[Depends(verify_access_code)])
async def update_gig(id: int, updates: GigUpdate, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")
    if updates.event_name:
        gig.event_name = updates.event_name
    if updates.date is not None:
        gig.date = updates.date
    if updates.venue is not None:
        gig.venue = updates.venue or None
    if updates.performance_time is not None:
        gig.performance_time = updates.performance_time or None
    if updates.costume is not None:
        gig.costume = updates.costume or None
    if updates.notes is not None:
        gig.notes = updates.notes or None
    db.commit()
    db.refresh(gig)
    return gig

#Delete a gig (and its repertoire items, via cascade)
@app.delete("/gigs/{id}", dependencies=[Depends(verify_access_code)])
async def delete_gig(id: int, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")
    db.delete(gig)
    db.commit()
    return {"Result": f"gig {id} deleted"}

#Add a song to a gig's repertoire
@app.post("/gigs/{id}/items", response_model=GigItemOut, dependencies=[Depends(verify_access_code)])
async def add_gig_item(id: int, item: GigItemCreate, db: Session = Depends(get_db)):
    gig = db.query(GigModel).filter(GigModel.id == id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="gig not found")
    song = db.query(SongModel).filter(SongModel.id == item.song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")

    new_item = GigItemModel(gig_id=id, **item.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

#Update a repertoire item's order (used for reordering)
@app.put("/gigs/{id}/items/{item_id}", response_model=GigItemOut, dependencies=[Depends(verify_access_code)])
async def update_gig_item(id: int, item_id: int, updates: GigItemUpdate, db: Session = Depends(get_db)):
    item = db.query(GigItemModel).filter(
        GigItemModel.id == item_id,
        GigItemModel.gig_id == id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="gig item not found")
    if updates.order_index is not None:
        item.order_index = updates.order_index
    db.commit()
    db.refresh(item)
    return item

#Remove a song from a gig's repertoire
@app.delete("/gigs/{id}/items/{item_id}", dependencies=[Depends(verify_access_code)])
async def delete_gig_item(id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(GigItemModel).filter(
        GigItemModel.id == item_id,
        GigItemModel.gig_id == id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="gig item not found")
    db.delete(item)
    db.commit()
    return {"Result": f"item {item_id} deleted from gig {id}"}

