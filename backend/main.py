from fastapi import FastAPI
app = FastAPI()

@app.get("/appinfo")
async def test_get():
    return {"app":"Kumpas","version":"0.1.0","status":"healthy"}