from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..database.connection import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

@router.get("/", response_model=List[dict])
async def get_all_clubs(supabase: Client = Depends(get_supabase_client)):
    """
    Alle Vereine abrufen (nur ID und Name, ohne Vereinspasswort)
    """
    try:
        print("🔍 DEBUG: Lade alle Vereine aus der Datenbank...")
        
        # Nur id und name abrufen, vereinspasswort ausschließen
        response = supabase.table("verein").select("id, name").execute()
        
        if response.data:
            print(f"✅ DEBUG: {len(response.data)} Vereine gefunden")
            for club in response.data:
                print(f"   📋 Verein: {club.get('name')} - ID: {club.get('id')}")
            
            return response.data
        else:
            print("❌ DEBUG: Keine Vereine in der Datenbank gefunden")
            return []
            
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
