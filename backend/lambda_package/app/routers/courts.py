from fastapi import APIRouter, HTTPException, Header
from app.services.courts_service import CourtsService
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/courts", tags=["courts"])

courts_service = CourtsService()

# Pydantic Models für CREATE und UPDATE (OHNE BELAG)
class CourtCreateRequest(BaseModel):
    name: str
    platztyp: str
    verein_id: str
    aktiv_von: Optional[str] = None
    aktiv_bis: Optional[str] = None
    buchbar_von: str = "07:00"
    buchbar_bis: str = "22:00"
    preise: Optional[Dict[str, float]] = {}

class CourtUpdateRequest(BaseModel):
    name: Optional[str] = None
    platztyp: Optional[str] = None
    aktiv_von: Optional[str] = None
    aktiv_bis: Optional[str] = None
    buchbar_von: Optional[str] = None
    buchbar_bis: Optional[str] = None
    preise: Optional[Dict[str, float]] = {}

@router.get("")
async def get_all_courts():
    """Alle Plätze abrufen (für Dashboard)"""
    try:
        courts = await courts_service.get_courts_by_verein("fab28464-e42a-4e6e-b314-37eea1e589e6")
        
        return {
            "status": "success",
            "courts": courts,
            "count": len(courts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/verein/{verein_id}")
async def get_courts_by_verein(verein_id: str):
    """Alle Plätze eines Vereins abrufen"""
    try:
        courts = await courts_service.get_courts_by_verein(verein_id)
        
        return {
            "status": "success",
            "courts": courts,
            "count": len(courts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/available/{verein_id}")
async def get_available_courts(
    verein_id: str,
    datum: str,
    uhrzeit_von: str,
    uhrzeit_bis: str
):
    """Verfügbare Plätze für bestimmte Zeit abrufen"""
    try:
        available_courts = await courts_service.get_available_courts(
            verein_id, datum, uhrzeit_von, uhrzeit_bis
        )
        
        return {
            "status": "success",
            "available_courts": available_courts,
            "count": len(available_courts),
            "datum": datum,
            "uhrzeit_von": uhrzeit_von,
            "uhrzeit_bis": uhrzeit_bis
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Debug Endpoint (später entfernen)
@router.get("/debug/all")
async def debug_all_courts():
    """Debug: Alle Plätze anzeigen"""
    try:
        from app.database.connection import supabase
        response = supabase.table("platz").select("*").execute()
        
        return {
            "status": "success",
            "courts": response.data,
            "count": len(response.data) if response.data else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ⚡ DELETE COURT - MUSS VOR GET /{court_id} STEHEN! ⚡
@router.delete("/{court_id}")
async def delete_court(court_id: str, x_user_id: str = Header(None, alias="X-User-ID")):
    """Platz löschen"""
    try:
        print(f"🗑️ DELETE Request empfangen für Platz: {court_id} (User: {x_user_id})")
        
        from app.database.connection import supabase
        
        # Prüfen ob Platz existiert
        existing = supabase.table("platz").select("id, name").eq("id", court_id).execute()
        print(f"📊 Existierender Platz: {existing.data}")
        
        if not existing.data:
            print(f"❌ Platz {court_id} nicht gefunden")
            raise HTTPException(status_code=404, detail="Platz nicht gefunden")
        
        # Platz löschen
        response = supabase.table("platz").delete().eq("id", court_id).execute()
        print(f"📊 DELETE Response: {response}")
        
        print(f"✅ Platz gelöscht: {court_id}")
        return {
            "status": "success",
            "message": f"Platz '{existing.data[0]['name']}' erfolgreich gelöscht"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Löschen des Platzes: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen des Platzes: {str(e)}")

# ⚡ CREATE COURT ⚡
@router.post("")
async def create_court(court_data: CourtCreateRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    """Neuen Platz erstellen"""
    try:
        print(f"➕ Erstelle neuen Platz: {court_data.name} für Verein: {court_data.verein_id}")
        
        from app.database.connection import supabase
        
        court_dict = {
            "name": court_data.name,
            "platztyp": court_data.platztyp,
            "verein_id": court_data.verein_id,
            "buchbar_von": court_data.buchbar_von,
            "buchbar_bis": court_data.buchbar_bis,
        }
        
        if court_data.aktiv_von and court_data.aktiv_von.strip():
            court_dict["aktiv_von"] = court_data.aktiv_von
        if court_data.aktiv_bis and court_data.aktiv_bis.strip():
            court_dict["aktiv_bis"] = court_data.aktiv_bis
            
        response = supabase.table("platz").insert(court_dict).execute()
        
        if response.data:
            print(f"✅ Platz erstellt: {response.data[0]['id']}")
            return {
                "status": "success",
                "message": "Platz erfolgreich erstellt",
                "court": response.data[0]
            }
        else:
            raise Exception("Keine Daten zurückgegeben")
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen des Platzes: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen des Platzes: {str(e)}")

# ⚡ UPDATE COURT ⚡
@router.put("/{court_id}")
async def update_court(court_id: str, court_data: CourtUpdateRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    """Platz aktualisieren"""
    try:
        print(f"🔄 Aktualisiere Platz: {court_id}")
        
        from app.database.connection import supabase
        
        update_dict = {}
        if court_data.name is not None:
            update_dict["name"] = court_data.name
        if court_data.platztyp is not None:
            update_dict["platztyp"] = court_data.platztyp
        
        if court_data.aktiv_von is not None:
            update_dict["aktiv_von"] = court_data.aktiv_von if court_data.aktiv_von.strip() else None
        if court_data.aktiv_bis is not None:
            update_dict["aktiv_bis"] = court_data.aktiv_bis if court_data.aktiv_bis.strip() else None
            
        if court_data.buchbar_von is not None:
            update_dict["buchbar_von"] = court_data.buchbar_von
        if court_data.buchbar_bis is not None:
            update_dict["buchbar_bis"] = court_data.buchbar_bis
            
        if not update_dict:
            raise HTTPException(status_code=400, detail="Keine Daten zum Aktualisieren")
        
        response = supabase.table("platz").update(update_dict).eq("id", court_id).execute()
        
        if response.data:
            print(f"✅ Platz aktualisiert: {court_id}")
            return {
                "status": "success",
                "message": "Platz erfolgreich aktualisiert",
                "court": response.data[0]
            }
        else:
            raise HTTPException(status_code=404, detail="Platz nicht gefunden")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren des Platzes: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Aktualisieren des Platzes: {str(e)}")

# ⚡ GET SINGLE COURT - MUSS AM ENDE STEHEN! ⚡
@router.get("/{court_id}")
async def get_court_by_id(court_id: str):
    """Einzelnen Platz abrufen"""
    try:
        court = await courts_service.get_court_by_id(court_id)
        
        if not court:
            raise HTTPException(status_code=404, detail="Platz nicht gefunden")
        
        return {
            "status": "success",
            "court": court
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))