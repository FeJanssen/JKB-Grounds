from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..database.connection import get_supabase_client
from supabase import Client

router = APIRouter(tags=["clubs"])

@router.get("/list")
async def get_clubs(supabase: Client = Depends(get_supabase_client)):
    """Alle Vereine für das Frontend laden"""
    try:
        print("🔍 DEBUG: Lade alle Vereine aus der Datenbank...")
        
        # Nur id und name abrufen, vereinspasswort ausschließen
        response = supabase.table("verein").select("id, name").order("name").execute()
        
        if response.data:
            print(f"✅ {len(response.data)} Vereine erfolgreich geladen")
            return {"clubs": response.data}
        else:
            print("⚠️ Keine Vereine gefunden")
            return {"clubs": []}
            
    except Exception as e:
        print(f"❌ Fehler beim Laden der Vereine: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Vereine: {str(e)}")

@router.get("/{club_id}")
async def get_club_by_id(club_id: str, supabase: Client = Depends(get_supabase_client)):
    """
    Einzelnen Verein anhand der ID abrufen
    """
    try:
        print(f"🔍 DEBUG: Lade Verein mit ID: {club_id}")
        
        response = supabase.table("verein").select("id, name").eq("id", club_id).execute()
        
        if response.data:
            club = response.data[0]
            print(f"✅ DEBUG: Verein gefunden: {club.get('name')}")
            return club
        else:
            print(f"❌ DEBUG: Kein Verein mit ID {club_id} gefunden")
            raise HTTPException(status_code=404, detail="Verein nicht gefunden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Laden des Vereins: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden des Vereins: {str(e)}")
