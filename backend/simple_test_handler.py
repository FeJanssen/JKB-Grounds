"""
Super minimaler Lambda Handler nur zum Testen
"""
from mangum import Mangum
from fastapi import FastAPI

# Minimale FastAPI App
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Lambda funktioniert!", "status": "ok"}

@app.get("/test")
async def test():
    return {"test": "erfolgreich"}

# Lambda Handler
handler = Mangum(app, lifespan="off")
