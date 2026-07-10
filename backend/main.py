from fastapi import FastAPI
from pydantic import BaseModel
from typing import Union

app = FastAPI()
members = [] #members local database
#Get App Info
@app.get("/appinfo")
async def get_appinfo():
    return {"app":"Kumpas","version":"0.1.0","status":"healthy"}

class Member(BaseModel):
    id:int
    name:str
    voice_section:str
    email:str | None = None
    phone:int | None = None
    status:str

#Print all members
@app.get("/members")
async def get_members_db():
    print=[]    
    for member in members:
        print.append(member.name)
    return print
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
async def update_member(id:int,name:str|None = None,voice_section:str|None=None,email:str|None=None,phone:int|None=None,status:str|None=None):
    for member in members:
        if member.id==id:
            if name:
                member.name=name
            elif voice_section:
                member.voice_section=voice_section
            elif email:
                member.email = email
            elif phone:
                member.phone =phone
            elif status:
                member.status=status 
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

    



