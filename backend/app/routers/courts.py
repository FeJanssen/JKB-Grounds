from fastapi import APIRouter, HTTPException, Header
from app.services.courts_service import CourtsService
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/courts", tags=["courts"])

courts_service = CourtsService()

# Hilfsfunktionen für Preis-Management
async def save_court_prices(court_id: str, preise_dict: Dict[str, float], abrechnungsmodell_dict: Dict[str, str] = None):
    """Preise für einen Platz in preis Tabelle speichern"""
    try:
        from app.database.connection import supabase
        
        # Existierende Preise für diesen Platz löschen
        delete_response = supabase.table("preis").delete().eq("platz_id", court_id).execute()
        print(f"💰 Alte Preise gelöscht für Platz {court_id}")
        
        # Neue Preise einfügen
        inserted_count = 0
        for rolle_id, preis in preise_dict.items():
            if preis and float(preis) > 0:  # Nur Preise > 0 speichern
                abrechnungsmodell = "stunde"  # Standard
                if abrechnungsmodell_dict and rolle_id in abrechnungsmodell_dict:
                    abrechnungsmodell = abrechnungsmodell_dict[rolle_id]
                    
                # Prüfe ob abrechnungsmodell Spalte existiert
                preis_data = {
                    "platz_id": court_id,
                    "rolle_id": rolle_id,
                    "preis": float(preis)
                }
                
                # Füge abrechnungsmodell nur hinzu wenn Spalte existiert
                try:
                    # Test ob Spalte existiert durch einen Select
                    test_response = supabase.table("preis").select("abrechnungsmodell").limit(1).execute()
                    preis_data["abrechnungsmodell"] = abrechnungsmodell
                    print(f"💰 Mit Abrechnungsmodell: {abrechnungsmodell}")
                except Exception as e:
                    print(f"⚠️ Abrechnungsmodell-Spalte noch nicht vorhanden, speichere nur Preis")
                
                # Supabase generiert automatisch UUID für id - kein id Feld hinzufügen!
                insert_response = supabase.table("preis").insert(preis_data).execute()
                if insert_response.data:
                    inserted_count += 1
                    print(f"💰 Preis gespeichert: Platz {court_id}, Rolle {rolle_id}, €{preis}")
                else:
                    print(f"⚠️ Preis konnte nicht gespeichert werden: Rolle {rolle_id}")
                    print(f"Insert Response: {insert_response}")
        
        print(f"✅ {inserted_count} Preise erfolgreich gespeichert für Platz {court_id}")
                
    except Exception as e:
        print(f"❌ Fehler beim Speichern der Preise: {e}")
        raise e

async def load_court_prices(court_id: str) -> tuple[Dict[str, float], Dict[str, str]]:
    """Preise für einen Platz aus preis Tabelle laden"""
    try:
        from app.database.connection import supabase
        
        # Versuche erst alle Spalten zu laden
        try:
            response = supabase.table("preis").select("rolle_id, preis, abrechnungsmodell").eq("platz_id", court_id).execute()
            has_abrechnungsmodell = True
        except Exception:
            # Fallback: Lade nur ohne abrechnungsmodell
            response = supabase.table("preis").select("rolle_id, preis").eq("platz_id", court_id).execute()
            has_abrechnungsmodell = False
            print(f"⚠️ Abrechnungsmodell-Spalte noch nicht vorhanden")
        
        preise = {}
        abrechnungsmodelle = {}
        
        if response.data:
            for preis_entry in response.data:
                rolle_id = preis_entry["rolle_id"]
                preise[rolle_id] = preis_entry["preis"]
                
                if has_abrechnungsmodell and "abrechnungsmodell" in preis_entry:
                    abrechnungsmodelle[rolle_id] = preis_entry["abrechnungsmodell"]
                else:
                    abrechnungsmodelle[rolle_id] = "stunde"  # Standard
                    
        print(f"📊 Preise geladen für Platz {court_id}: {len(preise)} Einträge")
        return preise, abrechnungsmodelle
        
    except Exception as e:
        print(f"❌ Fehler beim Laden der Preise: {e}")
        return {}, {}

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
    abrechnungsmodelle: Optional[Dict[str, str]] = {}  # rolle_id -> abrechnungsmodell
    # Buchungszeiten als boolean Felder
    booking_15min: Optional[bool] = False
    booking_30min: Optional[bool] = True
    booking_45min: Optional[bool] = False
    booking_60min: Optional[bool] = True
    booking_75min: Optional[bool] = False
    booking_90min: Optional[bool] = True
    booking_105min: Optional[bool] = False
    booking_120min: Optional[bool] = True
    booking_135min: Optional[bool] = False
    booking_150min: Optional[bool] = False
    booking_165min: Optional[bool] = False
    booking_180min: Optional[bool] = False
    booking_195min: Optional[bool] = False
    booking_210min: Optional[bool] = False
    booking_225min: Optional[bool] = False
    booking_240min: Optional[bool] = False
    booking_300min: Optional[bool] = False
    booking_360min: Optional[bool] = False
    booking_480min: Optional[bool] = False
    
    class Config:
        # Validierung für abrechnungsmodelle
        @classmethod
        def validate_abrechnungsmodelle(cls, v):
            if v:
                valid_models = {'stunde', 'tag', 'woche', 'monat'}
                for rolle_id, modell in v.items():
                    if modell not in valid_models:
                        raise ValueError(f"Ungültiges Abrechnungsmodell: {modell}")
            return v

class CourtUpdateRequest(BaseModel):
    name: Optional[str] = None
    platztyp: Optional[str] = None
    aktiv_von: Optional[str] = None
    aktiv_bis: Optional[str] = None
    buchbar_von: Optional[str] = None
    buchbar_bis: Optional[str] = None
    preise: Optional[Dict[str, float]] = {}
    abrechnungsmodelle: Optional[Dict[str, str]] = {}  # rolle_id -> abrechnungsmodell
    # Buchungszeiten als boolean Felder
    booking_15min: Optional[bool] = None
    booking_30min: Optional[bool] = None
    booking_45min: Optional[bool] = None
    booking_60min: Optional[bool] = None
    booking_75min: Optional[bool] = None
    booking_90min: Optional[bool] = None
    booking_105min: Optional[bool] = None
    booking_120min: Optional[bool] = None
    booking_135min: Optional[bool] = None
    booking_150min: Optional[bool] = None
    booking_165min: Optional[bool] = None
    booking_180min: Optional[bool] = None
    booking_195min: Optional[bool] = None
    booking_210min: Optional[bool] = None
    booking_225min: Optional[bool] = None
    booking_240min: Optional[bool] = None
    booking_300min: Optional[bool] = None
    booking_360min: Optional[bool] = None
    booking_480min: Optional[bool] = None
    
    class Config:
        # Validierung für abrechnungsmodelle  
        @classmethod
        def validate_abrechnungsmodelle(cls, v):
            if v:
                valid_models = {'stunde', 'tag', 'woche', 'monat'}
                for rolle_id, modell in v.items():
                    if modell not in valid_models:
                        raise ValueError(f"Ungültiges Abrechnungsmodell: {modell}")
            return v

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
    """Alle Plätze eines Vereins abrufen mit Preisen"""
    try:
        courts = await courts_service.get_courts_by_verein(verein_id)
        
        # Preise für jeden Platz laden
        for court in courts:
            court_id = court.get('id')
            if court_id:
                preise, abrechnungsmodelle = await load_court_prices(court_id)
                court['preise'] = preise
                court['abrechnungsmodelle'] = abrechnungsmodelle
        
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

# ⚡ GET SINGLE COURT ⚡
@router.get("/{court_id}")
async def get_court_by_id(court_id: str):
    """Einzelnen Platz abrufen mit Preisen"""
    try:
        court = await courts_service.get_court_by_id(court_id)
        
        if not court:
            raise HTTPException(status_code=404, detail="Platz nicht gefunden")
        
        # Preise laden
        preise, abrechnungsmodelle = await load_court_prices(court_id)
        court['preise'] = preise
        court['abrechnungsmodelle'] = abrechnungsmodelle
        
        return {
            "status": "success",
            "court": court
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Abrufen des Platzes: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Abrufen des Platzes: {str(e)}")

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
        
        # Buchungszeiten als boolean Felder hinzufügen
        booking_fields = [
            'booking_15min', 'booking_30min', 'booking_45min', 'booking_60min', 
            'booking_75min', 'booking_90min', 'booking_105min', 'booking_120min',
            'booking_135min', 'booking_150min', 'booking_165min', 'booking_180min',
            'booking_195min', 'booking_210min', 'booking_225min', 'booking_240min',
            'booking_300min', 'booking_360min', 'booking_480min'
        ]
        
        for field in booking_fields:
            court_dict[field] = getattr(court_data, field, False)
        
        if court_data.aktiv_von and court_data.aktiv_von.strip():
            court_dict["aktiv_von"] = court_data.aktiv_von
        if court_data.aktiv_bis and court_data.aktiv_bis.strip():
            court_dict["aktiv_bis"] = court_data.aktiv_bis
            
        # Platz erstellen
        response = supabase.table("platz").insert(court_dict).execute()
        
        if response.data:
            court_id = response.data[0]['id']
            print(f"✅ Platz erstellt: {court_id}")
            
            # Preise in separate preis Tabelle speichern
            if court_data.preise:
                await save_court_prices(court_id, court_data.preise, court_data.abrechnungsmodelle)
            
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
        
        # Buchungszeiten aktualisieren falls übermittelt
        booking_fields = [
            'booking_15min', 'booking_30min', 'booking_45min', 'booking_60min', 
            'booking_75min', 'booking_90min', 'booking_105min', 'booking_120min',
            'booking_135min', 'booking_150min', 'booking_165min', 'booking_180min',
            'booking_195min', 'booking_210min', 'booking_225min', 'booking_240min',
            'booking_300min', 'booking_360min', 'booking_480min'
        ]
        
        for field in booking_fields:
            value = getattr(court_data, field, None)
            if value is not None:
                update_dict[field] = value
            
        if not update_dict:
            raise HTTPException(status_code=400, detail="Keine Daten zum Aktualisieren")
        
        response = supabase.table("platz").update(update_dict).eq("id", court_id).execute()
        
        # Preise aktualisieren falls übermittelt
        if court_data.preise is not None:
            await save_court_prices(court_id, court_data.preise, court_data.abrechnungsmodelle)
        
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