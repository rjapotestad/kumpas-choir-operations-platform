from fastapi import FastAPI
from pydantic import BaseModel
from app.database import Base, engine
from app.models.member import Member as MemberModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
members = []
#Get App Info
@app.get("/appinfo")
async def get_appinfo():
    return {"app":"Kumpas","version":"0.1.0","status":"healthy"}

class Member(BaseModel):
    id:int
    name:str
    email:str

#Print all members
@app.get("/members")
async def get_members_db():
    mems=[]    
    for member in members:
        mems.append(member.name)
    return mems
#Print member based on ID
@app.get("/members/{id}")
async def get_member(id:int):
    for member in members:
        if member.id == id:
            return member
    return {"error":"member not found"}
#Add new member
@app.post("/members")
async def add_member(member:Member):
    members.append(member)
    return {"Result":"Member successfully added"}
#Update member data 
@app.put("/members/{id}")
async def update_member(id:int,name:str|None = None,voice_section:str|None=None):
    for member in members:
        if member.id==id:
            if name:
                member.name=name
            if voice_section:
                member.voice_section=voice_section
            return {"Updated":member}
    return {"error":"member not found"}
#Delete member
@app.delete("/members/{id}")
async def delete_member(id:int):
    for member in members:
        if member.id == id:
            members.remove(member)
            return {"Result":f"Member {id} deleted"}
    return {"error":"member not found"}

    



