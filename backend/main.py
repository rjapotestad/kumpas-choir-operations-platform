from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
async def test_get():
    return {"health":"success"}
@app.get("/version")
async def test_get():
    return {"version":"success"}