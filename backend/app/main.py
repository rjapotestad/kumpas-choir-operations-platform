from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import Base, engine, get_db
from app.models.song import Song as SongModel
from app.models.rehearsal_plan import RehearsalPlan as RehearsalPlanModel, RehearsalPlanItem as RehearsalPlanItemModel
from app.models.member import Member as MemberModel
from app.models.attendance import Attendance as AttendanceModel
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

#List all rehearsal plans
@app.get("/rehearsal-plans", response_model=list[RehearsalPlanOut], dependencies=[Depends(verify_access_code)])
async def get_rehearsal_plans(db: Session = Depends(get_db)):
    return db.query(RehearsalPlanModel).all()

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

