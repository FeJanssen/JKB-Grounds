from app.database.connection import supabase
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uuid

class BookingService:
    
    async def create_booking(self, booking_data: dict) -> dict:
        """Neue Buchung erstellen"""
        try:
            print(f"🎯 Erstelle Buchung mit Daten: {booking_data}")
            
            # Validierung der Eingabedaten
            required_fields = ["court_id", "date", "time", "duration", "type", "user_id"]
            missing_fields = [field for field in required_fields if field not in booking_data or booking_data[field] is None]
            
            if missing_fields:
                raise ValueError(f"Fehlende Pflichtfelder: {', '.join(missing_fields)}")
            
            # Zeitvalidierung
            if not self.validate_booking_time(booking_data["date"], booking_data["time"]):
                raise ValueError("Ungültige Buchungszeit (Vergangenheit, außerhalb Öffnungszeiten oder zu weit in der Zukunft)")
            
            # Verfügbarkeit prüfen
            is_available = await self.check_availability(
                booking_data["court_id"],
                booking_data["date"],
                booking_data["time"],
                booking_data["duration"]
            )
            
            if not is_available:
                raise ValueError("Platz ist zu dieser Zeit bereits gebucht")
            
            # Endzeit berechnen
            end_time = self.calculate_end_time(booking_data["time"], booking_data["duration"])
            
            # Preis berechnen (marktreif)
            price = self.calculate_price(booking_data["duration"], booking_data["court_id"])
            
            # Buchung in DB speichern
            buchung = {
                "id": str(uuid.uuid4()),
                "platz_id": booking_data["court_id"],  # KORRIGIERT: Als STRING, NICHT int()
                "nutzer_id": booking_data["user_id"],
                "datum": booking_data["date"],
                "uhrzeit_von": booking_data["time"],
                "uhrzeit_bis": end_time,
                "buchungstyp": booking_data["type"],
                "notizen": booking_data.get("notes", ""),
                "status": "aktiv",
                "preis": price,
                "erstellt_am": datetime.now().isoformat()
            }
            
            print(f"📤 Speichere Buchung: {buchung}")
            
            response = supabase.table("buchung").insert(buchung).execute()
            
            if response.data:
                created_booking = response.data[0]
                print(f"✅ SUCCESS: Buchung erstellt - {created_booking['id']}")
                
                return {
                    "id": created_booking['id'],
                    "success": True,
                    "booking": created_booking,
                    "message": f"Buchung für {booking_data['date']} um {booking_data['time']} Uhr erfolgreich erstellt"
                }
            else:
                print(f"❌ ERROR: Keine Daten zurückgegeben")
                raise ValueError("Buchung konnte nicht gespeichert werden")
                
        except ValueError as ve:
            print(f"❌ Validation Error: {ve}")
            raise ve
        except Exception as e:
            print(f"❌ ERROR bei Buchungserstellung: {e}")
            print(f"❌ Error Type: {type(e)}")
            raise ValueError(f"Buchung fehlgeschlagen: {str(e)}")
    
    async def check_availability(self, court_id: str, date: str, time: str, duration: int) -> bool:
        """Verfügbarkeit eines Platzes prüfen"""
        try:
            print(f"🔍 Prüfe Verfügbarkeit: Platz {court_id}, {date}, {time}, {duration}min")
            
            end_time = self.calculate_end_time(time, duration)
            
            # Bestehende Buchungen für diesen Platz und Tag prüfen
            response = supabase.table("buchung").select("*").eq("platz_id", court_id).eq("datum", date).eq("status", "aktiv").execute()
            if not response.data:
                print("✅ Keine Buchungen gefunden - verfügbar")
                return True
            
            print(f"📋 Gefundene Buchungen: {len(response.data)}")
            
            # Zeitüberschneidungen prüfen
            new_start = self.time_to_minutes(time)
            new_end = self.time_to_minutes(end_time)
            
            for booking in response.data:
                existing_start = self.time_to_minutes(booking["uhrzeit_von"])
                existing_end = self.time_to_minutes(booking["uhrzeit_bis"])
                
                print(f"   Prüfe gegen: {booking['uhrzeit_von']}-{booking['uhrzeit_bis']}")
                
                # Überschneidung prüfen
                if (new_start < existing_end and new_end > existing_start):
                    print(f"❌ Überschneidung gefunden!")
                    return False
            
            print("✅ Keine Überschneidung - verfügbar")
            return True
            
        except Exception as e:
            print(f"❌ ERROR bei Verfügbarkeitsprüfung: {e}")
            return False
    
    async def get_bookings_by_date(self, date: str, verein_id: str = "fab28464-e42a-4e6e-b314-37eea1e589e6") -> List[dict]:
        """Alle Buchungen für ein bestimmtes Datum und Verein"""
        try:
            print(f"📅 Lade Buchungen für {date}, Verein: {verein_id}")
            
            # Erst alle Plätze des Vereins holen
            courts_response = supabase.table("platz").select("id").eq("verein_id", verein_id).execute()
            
            if not courts_response.data:
                print("❌ Keine Plätze für Verein gefunden")
                return []
            
            court_ids = [court["id"] for court in courts_response.data]
            print(f"🎾 Gefundene Plätze: {court_ids}")
            
            # KORRIGIERT: Einfache Query OHNE problematische JOINs
            response = supabase.table("buchung").select("*").eq("datum", date).eq("status", "aktiv").in_("platz_id", court_ids).order("uhrzeit_von", desc=False).execute()
            
            bookings = response.data or []
            print(f"📊 Gefundene Buchungen: {len(bookings)}")
            
            # Platz-Details separat laden für bessere Performance
            for booking in bookings:
                try:
                    platz_response = supabase.table("platz").select("*").eq("id", booking["platz_id"]).execute()
                    if platz_response.data:
                        booking["platz"] = platz_response.data[0]
                    else:
                        booking["platz"] = {"id": booking["platz_id"], "name": f"Platz {booking['platz_id']}", "platztyp": "Standard"}
                except Exception as e:
                    print(f"⚠️ Platz-Details für {booking['platz_id']} nicht gefunden: {e}")
                    booking["platz"] = {"id": booking["platz_id"], "name": f"Platz {booking['platz_id']}", "platztyp": "Standard"}
            
            return bookings
            
        except Exception as e:
            print(f"❌ ERROR beim Laden der Buchungen: {e}")
            return []
    
    async def cancel_booking(self, booking_id: str, user_id: str) -> dict:
        """Buchung stornieren"""
        try:
            print(f"🗑️ Storniere Buchung {booking_id} für User {user_id}")
            
            # Buchung existiert und gehört dem User?
            response = supabase.table("buchung").select("*").eq("id", booking_id).eq("nutzer_id", user_id).execute()
            
            if not response.data:
                print("❌ Buchung nicht gefunden oder nicht berechtigt")
                print(f"🔍 DEBUG: Suche nach booking_id={booking_id}, nutzer_id={user_id}")
                
                # Debug: Zeige alle Buchungen für diesen User
                user_bookings = supabase.table("buchung").select("id, datum, uhrzeit_von, status").eq("nutzer_id", user_id).execute()
                print(f"🔍 DEBUG: Alle Buchungen für User {user_id}:")
                for b in user_bookings.data:
                    print(f"  - ID: {b['id']}, Datum: {b['datum']}, Zeit: {b['uhrzeit_von']}, Status: {b['status']}")
                
                raise ValueError("Buchung nicht gefunden oder Sie sind nicht berechtigt diese zu stornieren")
            
            booking = response.data[0]
            print(f"📋 Gefundene Buchung: {booking['datum']} {booking['uhrzeit_von']}, Status: {booking.get('status', 'unbekannt')}")
            
            # Prüfen ob Buchung bereits storniert ist
            if booking.get('status') == 'storniert':
                raise ValueError("Buchung ist bereits storniert")
            
            # Prüfen ob Buchung noch stornierbar ist (mindestens 2h vorher)
            # Datum korrekt parsen (nur Datum-Teil verwenden)
            date_str = booking['datum'].split('T')[0]  # "2025-11-03"
            time_str = booking['uhrzeit_von'].split('+')[0]  # "18:30:00"
            booking_datetime = datetime.fromisoformat(f"{date_str} {time_str}")
            now = datetime.now()
            time_until_booking = booking_datetime - now
            
            print(f"⏰ Zeit-Check: Buchung um {booking_datetime}, jetzt {now}")
            print(f"⏰ Verbleibende Zeit: {time_until_booking.total_seconds()} Sekunden ({time_until_booking.total_seconds()/3600:.1f} Stunden)")
            
            # TEMPORÄR: Nur für bereits vergangene Buchungen verbieten (für Tests)
            if time_until_booking.total_seconds() < -3600:  # Nur wenn Buchung mehr als 1 Stunde vorbei ist
                hours_past = abs(time_until_booking.total_seconds()) / 3600
                raise ValueError(f"Buchung ist bereits {hours_past:.1f} Stunden vorbei und kann nicht mehr storniert werden")
            
            # ORIGINAL REGEL (später wieder aktivieren):
            # if time_until_booking.total_seconds() < 7200:  # 2 Stunden = 7200 Sekunden
            #     hours_remaining = time_until_booking.total_seconds() / 3600
            #     raise ValueError(f"Buchung kann nur bis 2 Stunden vor Beginn storniert werden. Verbleibende Zeit: {hours_remaining:.1f} Stunden")
            
            # Status auf "storniert" setzen
            update_response = supabase.table("buchung").update({
                "status": "storniert"
            }).eq("id", booking_id).execute()
            
            if update_response.data:
                print("✅ Buchung erfolgreich storniert")
                return {
                    "success": True,
                    "message": "Buchung erfolgreich storniert"
                }
            else:
                print(f"❌ Update fehlgeschlagen: {update_response}")
                raise ValueError("Stornierung fehlgeschlagen")
                
        except ValueError as ve:
            print(f"❌ Stornierung Error: {ve}")
            raise ve
        except Exception as e:
            print(f"❌ ERROR bei Stornierung: {e}")
            raise ValueError(f"Stornierung fehlgeschlagen: {str(e)}")
    
    async def get_user_bookings(self, user_id: str, from_date: str = None) -> List[dict]:
        """Alle Buchungen eines Users laden"""
        try:
            print(f"📋 Lade Buchungen für User: {user_id}")
            
            # KORRIGIERT: Einfache Query OHNE problematische JOINs
            query = supabase.table("buchung").select("*").eq("nutzer_id", user_id).eq("status", "aktiv")
            
            if from_date:
                query = query.gte("datum", from_date)
            
            query = query.order("datum", desc=False).order("uhrzeit_von", desc=False)
            
            response = query.execute()
            
            bookings = response.data or []
            print(f"📊 User-Buchungen gefunden: {len(bookings)}")
            
            # Platz-Details separat laden
            for booking in bookings:
                try:
                    platz_response = supabase.table("platz").select("*").eq("id", booking["platz_id"]).execute()
                    if platz_response.data:
                        booking["platz"] = platz_response.data[0]
                    else:
                        booking["platz"] = {"id": booking["platz_id"], "name": f"Platz {booking['platz_id']}", "platztyp": "Standard"}
                except Exception as e:
                    print(f"⚠️ Platz-Details für {booking['platz_id']} nicht gefunden: {e}")
                    booking["platz"] = {"id": booking["platz_id"], "name": f"Platz {booking['platz_id']}", "platztyp": "Standard"}
            
            return bookings
            
        except Exception as e:
            print(f"❌ ERROR beim Laden der User-Buchungen: {e}")
            return []
    
    def calculate_end_time(self, start_time: str, duration_minutes: int) -> str:
        """Endzeit basierend auf Startzeit und Dauer berechnen"""
        try:
            hours, minutes = map(int, start_time.split(':'))
            start_minutes = hours * 60 + minutes
            end_minutes = start_minutes + duration_minutes
            
            end_hours = end_minutes // 60
            end_mins = end_minutes % 60
            
            return f"{end_hours:02d}:{end_mins:02d}"
            
        except Exception as e:
            print(f"❌ ERROR bei Zeitberechnung: {e}")
            return start_time
    
    def time_to_minutes(self, time_str: str) -> int:
        """Zeit-String zu Minuten konvertieren für Vergleiche"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except Exception as e:
            print(f"❌ ERROR bei Zeit-Konvertierung: {e}")
            return 0
    
    def calculate_price(self, duration_minutes: int, court_id: str = None) -> float:
        """Marktreife Preisberechnung"""
        try:
            # Basis-Stundensatz (später aus DB/Admin-Panel)
            base_price_per_hour = 25.0  # €25 pro Stunde
            
            # Preis basierend auf Dauer
            hours = duration_minutes / 60
            total_price = base_price_per_hour * hours
            
            # Platz-spezifische Aufschläge (später aus DB)
            if court_id:
                try:
                    court_id_int = int(court_id)
                    if court_id_int == 1:  # Hauptplatz
                        total_price *= 1.2  # 20% Aufschlag
                    elif court_id_int == 2:  # Premium-Platz
                        total_price *= 1.5  # 50% Aufschlag
                    # Weitere Plätze können hier ergänzt werden
                except ValueError:
                    pass  # Wenn court_id nicht in int konvertierbar ist
            
            # Auf 2 Dezimalstellen runden
            return round(total_price, 2)
            
        except Exception as e:
            print(f"❌ ERROR bei Preisberechnung: {e}")
            return 25.0  # Fallback-Preis
    
    def validate_booking_time(self, date: str, time: str) -> bool:
        """Prüft ob Buchungszeit gültig ist (nicht in der Vergangenheit, Öffnungszeiten)"""
        try:
            # Datum + Zeit parsen
            booking_datetime = datetime.fromisoformat(f"{date} {time}")
            now = datetime.now()
            
            # Nicht in der Vergangenheit (mit 5 Minuten Puffer)
            if booking_datetime <= now + timedelta(minutes=5):
                print(f"❌ Buchung liegt in der Vergangenheit: {booking_datetime} <= {now}")
                return False
            
            # Öffnungszeiten prüfen (7:00 - 22:00)
            hour = booking_datetime.hour
            if hour < 7 or hour >= 22:
                print(f"❌ Buchung außerhalb der Öffnungszeiten: {hour}:xx")
                return False
            
            # Nicht mehr als 30 Tage im Voraus
            days_ahead = (booking_datetime - now).days
            if days_ahead > 30:
                print(f"❌ Buchung zu weit in der Zukunft: {days_ahead} Tage")
                return False
            
            print(f"✅ Buchungszeit ist gültig: {booking_datetime}")
            return True
            
        except Exception as e:
            print(f"❌ ERROR bei Zeit-Validierung: {e}")
            return False
    
    async def get_available_time_slots(self, court_id: str, date: str) -> List[str]:
        """Verfügbare Zeitslots für einen Platz an einem Tag ermitteln"""
        try:
            print(f"🕐 Ermittle verfügbare Slots für Platz {court_id} am {date}")
            
            # Bestehende Buchungen für diesen Platz und Tag laden
            response = supabase.table("buchung").select("uhrzeit_von, uhrzeit_bis").eq("platz_id", int(court_id)).eq("datum", date).eq("status", "aktiv").execute()
            
            booked_slots = []
            if response.data:
                for booking in response.data:
                    start_minutes = self.time_to_minutes(booking["uhrzeit_von"])
                    end_minutes = self.time_to_minutes(booking["uhrzeit_bis"])
                    booked_slots.append((start_minutes, end_minutes))
            
            # Alle möglichen Slots (7:00 - 22:00, jede Stunde)
            available_slots = []
            for hour in range(7, 22):  # 7:00 bis 21:00 (letzte Startzeit)
                time_str = f"{hour:02d}:00"
                slot_start = self.time_to_minutes(time_str)
                slot_end = slot_start + 60  # 1-Stunden-Slots
                
                # Prüfen ob Slot verfügbar ist
                is_available = True
                for booked_start, booked_end in booked_slots:
                    if (slot_start < booked_end and slot_end > booked_start):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append(time_str)
            
            print(f"✅ {len(available_slots)} verfügbare Slots gefunden")
            return available_slots
            
        except Exception as e:
            print(f"❌ ERROR bei Slot-Ermittlung: {e}")
            return []
    
    async def get_booking_statistics(self, user_id: str = None, date_from: str = None, date_to: str = None) -> dict:
        """Buchungsstatistiken für Admin-Dashboard"""
        try:
            print(f"📊 Erstelle Buchungsstatistiken")
            
            query = supabase.table("buchung").select("*")
            
            if user_id:
                query = query.eq("nutzer_id", user_id)
            
            if date_from:
                query = query.gte("datum", date_from)
                
            if date_to:
                query = query.lte("datum", date_to)
            
            response = query.execute()
            bookings = response.data or []
            
            # Statistiken berechnen
            total_bookings = len(bookings)
            active_bookings = len([b for b in bookings if b["status"] == "aktiv"])
            cancelled_bookings = len([b for b in bookings if b["status"] == "storniert"])
            total_revenue = sum([b.get("preis", 0) for b in bookings if b["status"] == "aktiv"])
            
            # Beliebte Zeiten ermitteln
            time_slots = {}
            for booking in bookings:
                if booking["status"] == "aktiv":
                    time_slot = booking["uhrzeit_von"]
                    time_slots[time_slot] = time_slots.get(time_slot, 0) + 1
            
            popular_times = sorted(time_slots.items(), key=lambda x: x[1], reverse=True)[:5]
            
            stats = {
                "total_bookings": total_bookings,
                "active_bookings": active_bookings,
                "cancelled_bookings": cancelled_bookings,
                "total_revenue": round(total_revenue, 2),
                "popular_times": popular_times,
                "cancellation_rate": round((cancelled_bookings / total_bookings * 100), 2) if total_bookings > 0 else 0
            }
            
            print(f"✅ Statistiken erstellt: {stats}")
            return stats
            
        except Exception as e:
            print(f"❌ ERROR bei Statistik-Erstellung: {e}")
            return {}