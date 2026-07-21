from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import Base, engine, get_db
from app.models.song import Song as SongModel
from fastapi.middleware.cors import CORSMiddleware

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

    



