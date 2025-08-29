from app.database.connection import supabase
from typing import List, Optional
from datetime import date, time

class CourtsService:
    def __init__(self):
        self.supabase = supabase

    async def get_courts_by_verein(self, verein_id: str) -> List[dict]:
        """Alle Plätze eines Vereins abrufen"""
        try:
            print(f"🔍 DEBUG: Suche Plätze für Verein: {verein_id}")
            
            response = self.supabase.table("platz").select("*").eq("verein_id", verein_id).execute()
            
            print(f"🔍 DEBUG: Supabase Response: {response}")
            print(f"🔍 DEBUG: Response.data: {response.data}")
            print(f"🔍 DEBUG: Response.data type: {type(response.data)}")
            
            if response.data:
                print(f"✅ DEBUG: {len(response.data)} Plätze gefunden für Verein {verein_id}")
                for court in response.data:
                    print(f"   📋 Platz: {court.get('name')} - ID: {court.get('id')} - Verein: {court.get('verein_id')}")
                return response.data
            else:
                print(f"❌ DEBUG: Keine Plätze gefunden für Verein {verein_id}")
                # Zusätzliche Debug-Info: Alle Plätze abrufen
                all_courts_response = self.supabase.table("platz").select("*").execute()
                print(f"🔍 DEBUG: Alle vorhandenen Plätze in DB:")
                if all_courts_response.data:
                    for court in all_courts_response.data:
                        print(f"   📋 DB-Platz: {court.get('name')} - Verein: {court.get('verein_id')}")
                return []
                
        except Exception as e:
            print(f"❌ ERROR beim Abrufen der Plätze: {e}")
            raise ValueError(f"Fehler beim Laden der Plätze: {str(e)}")

    async def get_court_by_id(self, court_id: str) -> Optional[dict]:
        """Einzelnen Platz abrufen"""
        try:
            response = self.supabase.table("platz").select("*").eq("id", court_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            else:
                return None
                
        except Exception as e:
            print(f"ERROR beim Abrufen des Platzes: {e}")
            raise ValueError(f"Fehler beim Laden des Platzes: {str(e)}")

    async def get_available_courts(self, verein_id: str, datum: str, uhrzeit_von: str, uhrzeit_bis: str) -> List[dict]:
        """Verfügbare Plätze für bestimmte Zeit abrufen"""
        try:
            # Alle Plätze des Vereins
            all_courts = await self.get_courts_by_verein(verein_id)
            
            # Bestehende Buchungen für das Datum und die Zeit prüfen
            bookings_response = self.supabase.table("buchung").select("platz_id").eq("datum", datum).execute()
            
            booked_court_ids = []
            if bookings_response.data:
                for booking in bookings_response.data:
                    # Hier könnte man noch Zeitüberschneidungen prüfen
                    booked_court_ids.append(booking["platz_id"])
            
            # Verfügbare Plätze filtern
            available_courts = [court for court in all_courts if court["id"] not in booked_court_ids]
            
            print(f"DEBUG: {len(available_courts)} verfügbare Plätze von {len(all_courts)} Gesamtplätzen")
            return available_courts
            
        except Exception as e:
            print(f"ERROR beim Prüfen der Verfügbarkeit: {e}")
            raise ValueError(f"Fehler beim Prüfen der Verfügbarkeit: {str(e)}")