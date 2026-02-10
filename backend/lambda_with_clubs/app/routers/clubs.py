from fastapi import APIRouter
from app.database.connection import supabase

router = APIRouter(
    prefix="/clubs",
    tags=["clubs"]
)

@router.get("/list")
async def get_clubs():
    """Liste aller Vereine für die Registrierung"""
    try:
        result = supabase.table("verein").select("id, name").order("name").execute()
        
        if result.data:
            return {"clubs": result.data}
        else:
            return {"clubs": []}
            
    except Exception as e:
        print(f"Fehler beim Laden der Vereine: {e}")
        return {"clubs": []}
