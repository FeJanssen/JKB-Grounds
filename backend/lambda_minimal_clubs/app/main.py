from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clubs

app = FastAPI(title="JKB Grounds API - Clubs Only", version="1.0.0")

# Router einbinden - nur Clubs
app.include_router(clubs.router, prefix="/api/clubs")

@app.get("/")
async def root():
    return {"message": "JKB Grounds Clubs API läuft!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}