from fastapi import APIRouter, HTTPException
from app.database.connection import get_supabase_client

router = APIRouter(
    prefix="/clubs",
    tags=["clubs"]
)

@router.get("/list")
async def get_clubs():
    """Liste aller Vereine für die Registrierung"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("verein").select("id, name").order("name").execute()
        
        if result.data:
            return {"clubs": result.data}
        else:
            return {"clubs": []}
            
    except Exception as e:
        print(f"Fehler beim Laden der Vereine: {e}")
        return {"clubs": []}

@router.get("")
async def get_all_clubs():
    """
    🌐 PUBLIC ENDPOINT: Alle Vereine für öffentliche Vereinsliste
    Dieser Endpoint wird von der PublicClubListScreen verwendet
    """
    try:
        supabase = get_supabase_client()
        
        # Erst nur Grundfelder probieren (wie bei /list)
        result = supabase.table("verein").select("id, name").order("name").execute()
        
        if result.data:
            # Format für Frontend anpassen
            clubs = []
            for club in result.data:
                clubs.append({
                    "id": club["id"],
                    "name": club["name"],
                    "beschreibung": "",  # Placeholder
                    "anzahl_plaetze": 0,  # Placeholder
                    "created_at": None   # Placeholder
                })
            
            return {"clubs": clubs}
        else:
            return {"clubs": []}
            
    except Exception as e:
        print(f"❌ PUBLIC: Fehler beim Laden aller Vereine: {e}")
        print(f"❌ Exception Details: {type(e).__name__}: {str(e)}")
        # Fallback: Verwende den funktionierenden /list Endpoint
        try:
            result = supabase.table("verein").select("id, name").order("name").execute()
            if result.data:
                return {"clubs": [{"id": club["id"], "name": club["name"], "beschreibung": "", "anzahl_plaetze": 0} for club in result.data]}
        except:
            pass
        return {"clubs": []}

@router.get("/{club_id}")
async def get_club_details(club_id: str):
    """
    🌐 PUBLIC ENDPOINT: Detailinformationen für einen bestimmten Verein
    Wird von der PublicInfoScreen verwendet
    """
    try:
        supabase = get_supabase_client()
        
        # Nur Grundfelder laden (wie bei /list)
        result = supabase.table("verein").select("id, name").eq("id", club_id).execute()
        
        if result.data and len(result.data) > 0:
            club = result.data[0]
            
            return {
                "id": club["id"],
                "name": club["name"],
                "beschreibung": "",  # Placeholder
                "anzahl_plaetze": 0,  # Placeholder
                "buchbar_von": None,  # Placeholder
                "buchbar_bis": None,  # Placeholder
                "created_at": None    # Placeholder
            }
        else:
            raise HTTPException(status_code=404, detail="Verein nicht gefunden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ PUBLIC: Fehler beim Laden von Verein {club_id}: {e}")
        print(f"❌ Exception Details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Serverfehler beim Laden der Vereinsdetails")