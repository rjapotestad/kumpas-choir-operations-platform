from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import Base, engine, get_db
from app.models.song import Song as SongModel
from app.models.rehearsal_plan import RehearsalPlan as RehearsalPlanModel, RehearsalPlanItem as RehearsalPlanItemModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as date_type

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
class RehearsalPlanCreate(BaseModel):
    date: date_type
    title: str | None = None
    notes: str | None = None

class RehearsalPlanItemCreate(BaseModel):
    song_id: int
    start_time: str | None = None
    duration_minutes: int | None = None
    order_index: int

class RehearsalPlanItemUpdate(BaseModel):
    start_time: str | None = None
    duration_minutes: int | None = None
    order_index: int | None = None

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
    items: list[RehearsalPlanItemOut] = []
    model_config = {"from_attributes": True}
#Print all songs
@app.get("/songs")
async def get_songs_db(db: Session = Depends(get_db)):
    return db.query(SongModel).all()
#Print songs based on ID
@app.get("/songs/{id}")
async def get_song(id:int, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    return song
#Add new songs
@app.post("/songs")
async def add_song(song: SongCreate, db: Session = Depends(get_db)):
    new_song = SongModel(**song.model_dump())
    db.add(new_song)
    db.commit()
    db.refresh(new_song)
    return new_song
#Update song data 
@app.put("/songs/{id}")
async def update_song(id:int, updates: SongUpdate, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    if updates.title:
        song.title = updates.title
    if updates.composer_arranger:
        song.composer_arranger = updates.composer_arranger
    if updates.notes:
        song.notes = updates.notes
    db.commit()
    db.refresh(song)
    return song
#Delete song
@app.delete("/songs/{id}")
async def delete_song(id:int, db: Session = Depends(get_db)):
    song = db.query(SongModel).filter(SongModel.id == id).first()
    if not song:
        raise HTTPException(status_code=404, detail="song not found")
    db.delete(song)
    db.commit()
    return {"Result":f"song {id} deleted"}

#Create a rehearsal plan
@app.post("/rehearsal-plans", response_model=RehearsalPlanOut)
async def add_rehearsal_plan(plan: RehearsalPlanCreate, db: Session = Depends(get_db)):
    new_plan = RehearsalPlanModel(**plan.model_dump())
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

#List all rehearsal plans
@app.get("/rehearsal-plans", response_model=list[RehearsalPlanOut])
async def get_rehearsal_plans(db: Session = Depends(get_db)):
    return db.query(RehearsalPlanModel).all()

#Get one rehearsal plan, including its items
@app.get("/rehearsal-plans/{id}", response_model=RehearsalPlanOut)
async def get_rehearsal_plan(id: int, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")
    return plan

#Delete a rehearsal plan (and its items, via cascade)
@app.delete("/rehearsal-plans/{id}")
async def delete_rehearsal_plan(id: int, db: Session = Depends(get_db)):
    plan = db.query(RehearsalPlanModel).filter(RehearsalPlanModel.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="rehearsal plan not found")
    db.delete(plan)
    db.commit()
    return {"Result": f"rehearsal plan {id} deleted"}

#Add an item (song block) to a rehearsal plan
@app.post("/rehearsal-plans/{id}/items", response_model=RehearsalPlanItemOut)
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
@app.put("/rehearsal-plans/{id}/items/{item_id}", response_model=RehearsalPlanItemOut)
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
@app.delete("/rehearsal-plans/{id}/items/{item_id}")
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

