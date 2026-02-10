from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import supabase
import logging

router = APIRouter(prefix="/api/vereine", tags=["vereine"])

# Pydantic Models
class Verein(BaseModel):
    verein_id: str
    vereinsname: str
    adresse: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    beschreibung: Optional[str] = None
    kontaktperson: Optional[str] = None
    mitgliedsbeitrag: Optional[float] = None
    plaetze_anzahl: Optional[int] = None

@router.get("/", response_model=List[Verein])
async def get_all_vereine():
    """Lädt alle Vereine aus der Datenbank"""
    try:
        # Supabase Query um alle Vereine zu holen
        response = supabase.table('vereine').select("*").order('vereinsname').execute()
        
        if response.data:
            vereine = []
            for row in response.data:
                verein = Verein(
                    verein_id=row.get('verein_id', ''),
                    vereinsname=row.get('vereinsname', ''),
                    adresse=row.get('adresse'),
                    telefon=row.get('telefon'),
                    email=row.get('email'),
                    website=row.get('website'),
                    beschreibung=row.get('beschreibung'),
                    kontaktperson=row.get('kontaktperson'),
                    mitgliedsbeitrag=row.get('mitgliedsbeitrag'),
                    plaetze_anzahl=row.get('plaetze_anzahl')
                )
                vereine.append(verein)
            
            logging.info(f"✅ {len(vereine)} Vereine geladen")
            return vereine
        else:
            logging.info("✅ Keine Vereine gefunden")
            return []
        
    except Exception as e:
        logging.error(f"❌ Fehler beim Laden der Vereine: {e}")
        raise HTTPException(status_code=500, detail=f"Server Fehler: {e}")

@router.get("/{verein_id}", response_model=Verein)
async def get_verein_by_id(verein_id: str):
    """Lädt einen spezifischen Verein"""
    try:
        response = supabase.table('vereine').select("*").eq('verein_id', verein_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Verein nicht gefunden")
        
        row = response.data[0]
        verein = Verein(
            verein_id=row.get('verein_id', ''),
            vereinsname=row.get('vereinsname', ''),
            adresse=row.get('adresse'),
            telefon=row.get('telefon'),
            email=row.get('email'),
            website=row.get('website'),
            beschreibung=row.get('beschreibung'),
            kontaktperson=row.get('kontaktperson'),
            mitgliedsbeitrag=row.get('mitgliedsbeitrag'),
            plaetze_anzahl=row.get('plaetze_anzahl')
        )
        
        return verein
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Fehler beim Laden des Vereins {verein_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Server Fehler: {e}")
