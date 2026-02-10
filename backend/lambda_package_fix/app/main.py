from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.routers import courts
from app.routers import bookings
from app.routers import users
from app.routers import roles        # ← NEU HINZUFÜGEN
from app.routers import permissions  # ← NEU HINZUFÜGEN
from app.routers import crm  # ← NEU HINZUFÜGEN
from app.routers import clubs

app = FastAPI(title="JKB Grounds API", version="1.0.0")

# CORS wird durch AWS Lambda Function URL gehandhabt
# FastAPI CORS-Middleware deaktiviert um Konflikte zu vermeiden
# app.add_middleware(CORSMiddleware, ...)

# Router einbinden
app.include_router(auth.router, prefix="/api/auth")
app.include_router(courts.router)
app.include_router(bookings.router)
app.include_router(users.router)
app.include_router(roles.router)        # ← NEU HINZUFÜGEN
app.include_router(permissions.router)  # ← NEU HINZUFÜGEN
app.include_router(crm.router, prefix="/api")  # ← NEU HINZUFÜGEN
app.include_router(clubs.router)  # ← CLUBS API (prefix already in router definition)

@app.get("/")
async def root():
    return {"message": "JKB Grounds API läuft!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}