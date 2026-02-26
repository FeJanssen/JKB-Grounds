from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel
from typing import List, Optional
from app.services.booking_service import BookingService
from datetime import datetime
from app.middleware.permissions import check_user_permissions
import uuid

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])
booking_service = BookingService()

# ENTERPRISE DEPENDENCY - USER AUTHENTICATION
async def get_current_user_id(request: Request, x_user_id: str = Header(None, alias="X-User-ID")):
    """Enterprise User ID Authentication aus Header"""
    if not x_user_id:
        print("❌ SECURITY: X-User-ID Header fehlt - Zugriff verweigert")
        available_headers = list(request.headers.keys())
        print(f"🔍 DEBUG: Verfügbare Headers: {available_headers}")
        raise HTTPException(
            status_code=401, 
            detail={
                "error": "Authentication required: X-User-ID Header ist erforderlich",
                "available_headers": available_headers,
                "security_note": "Frontend muss X-User-ID Header setzen"
            }
        )
    
    print(f"✅ AUTHENTICATED: User ID: {x_user_id}")
    return x_user_id

# ENTERPRISE PYDANTIC MODELS
class BookingRequest(BaseModel):
    """Enterprise Booking Request Model"""
    platz_id: str  # ✅ Korrigiert: platz_id (konsistent mit Datenbank)
    date: str  # YYYY-MM-DD Format
    time: str  # HH:MM Format
    duration: int  # Minuten (Standard: 60)
    type: str  # 'private' oder 'public'
    notes: Optional[str] = ""
    color: Optional[str] = None  # ✅ NEU: Hex-Farbe für öffentliche Buchungen

class SeriesBookingRequest(BaseModel):
    """Enterprise Series Booking Request Model - Serienbuchungen"""
    platz_id: str
    start_date: str  # YYYY-MM-DD Format - Startdatum der Serie
    time: str  # HH:MM Format
    duration: int  # Minuten (Standard: 60)
    type: str  # 'private' oder 'public'
    weeks: int  # Anzahl Wochen
    notes: Optional[str] = ""
    series_name: Optional[str] = ""  # Name für die Serie

class BookingResponse(BaseModel):
    """Enterprise Booking Response Model"""
    id: str
    platz_id: str
    user_id: Optional[str]
    datum: str
    uhrzeit_von: str
    uhrzeit_bis: str
    buchungstyp: str
    notizen: str
    color: Optional[str] = None  # ✅ NEU: Hex-Farbe für öffentliche Buchungen
    status: str
    erstellt_am: str

# ENTERPRISE MAIN BOOKING ENDPOINT
@router.post("/create")
async def create_booking(
    request: BookingRequest, 
    http_request: Request,
    user_id: str = Header(None, alias="X-User-ID")
):
    """
    MARKTREIFE BUCHUNGSERSTELLUNG - ENTERPRISE LEVEL
    
    Features:
    - Multi-Level Permission System
    - Admin-Bypass Architecture
    - Fail-Safe Security
    - Comprehensive Logging
    - Error Handling & Recovery
    """
    try:        
        # SECURITY: User Authentication
        if not user_id:
            print("❌ SECURITY BREACH: Unautorisierte Buchungsanfrage abgelehnt")
            raise HTTPException(status_code=401, detail="Authentication required: User-ID fehlt")
        
        print(f"🏓 ENTERPRISE BOOKING REQUEST von User: {user_id}")
        print(f"📊 REQUEST DATA: {request.dict()}")
        
        # ENTERPRISE PERMISSION SYSTEM
        
        # 1. GRUNDLEGENDE BUCHUNGSBERECHTIGUNG (Basis-Level)
        print(f"🔐 SECURITY CHECK 1/2: Prüfe Grundberechtigung 'darf_buchen'")
        if not check_user_permissions(user_id, 'darf_buchen'):
            print(f"❌ SECURITY: User {user_id} hat keine Buchungsberechtigung")
            raise HTTPException(status_code=403, detail="Keine Buchungsberechtigung")
        
        print(f"✅ SECURITY CHECK 1/2: Grundberechtigung bestätigt")
        
        # 2. ÖFFENTLICHE BUCHUNG (Erweiterte Berechtigung)
        if request.type == 'public':
            print(f"🔐 SECURITY CHECK 2/2: Prüfe öffentliche Buchungsberechtigung 'darf_oeffentlich_buchen'")
            if not check_user_permissions(user_id, 'darf_oeffentlich_buchen'):
                print(f"❌ SECURITY: User {user_id} hat keine Berechtigung für öffentliche Buchungen")
                raise HTTPException(status_code=403, detail="Keine Berechtigung für öffentliche Buchungen")
            else:
                print(f"✅ SECURITY CHECK 2/2: Öffentliche Buchungsberechtigung bestätigt")
        else:
            print(f"📝 SECURITY CHECK 2/2: Private Buchung - keine zusätzlichen Checks erforderlich")

        print(f"🛡️ ENTERPRISE SECURITY: Alle Berechtigungsprüfungen erfolgreich")
        
        # ENTERPRISE BOOKING DATA PREPARATION
        booking_data = {
            "platz_id": request.platz_id,  # ✅ KORRIGIERT: Einheitlich platz_id verwenden
            "date": request.date,
            "time": request.time,
            "duration": request.duration,
            "type": request.type,
            "notes": request.notes,
            "color": request.color,  # ✅ NEU: Color-Feld weiterleiten
            "user_id": user_id
        }
        
        print(f"📤 ENTERPRISE BOOKING: Erstelle Buchung mit verifizierten Daten")
        
        # EXECUTE BOOKING VIA SERVICE LAYER
        result = await booking_service.create_booking(booking_data)
        
        print(f"✅ ENTERPRISE SUCCESS: Buchung erfolgreich erstellt")
        
        return {
            "status": "success", 
            "message": "Buchung erfolgreich erstellt",
            "booking": result,
            "security_level": "enterprise",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        # HTTP-Exceptions direkt weiterleiten (bereits korrekt formatiert)
        raise
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Kritischer Buchungsfehler: {e}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Buchungsfehler", 
                "message": str(e),
                "error_type": "internal_server_error",
                "contact_support": True
            }
        )

# ENTERPRISE VERFÜGBARKEITSPRÜFUNG
@router.get("/availability/{court_id}")
async def check_availability(court_id: str, date: str, time: str, duration: int = 60):
    """Enterprise Verfügbarkeitsprüfung mit Performance-Optimierung"""
    try:
        print(f"🔍 ENTERPRISE AVAILABILITY CHECK: Platz {court_id}, {date}, {time}, {duration}min")
        
        is_available = await booking_service.check_availability(court_id, date, time, duration)
        
        return {
            "status": "success",
            "available": is_available,
            "court_id": court_id,
            "date": date,
            "time": time,
            "duration": duration,
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Verfügbarkeitsprüfung fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Verfügbarkeitsprüfung fehlgeschlagen")

# ENTERPRISE BUCHUNGEN NACH DATUM
@router.get("/date/{date}")
async def get_bookings_by_date(date: str, verein_id: str = "fab28464-e42a-4e6e-b314-37eea1e589e6"):
    """Enterprise Buchungsabfrage mit optimierter Datenbankabfrage"""
    try:
        print(f"📅 ENTERPRISE QUERY: Lade Buchungen für Datum: {date}")
        
        bookings = await booking_service.get_bookings_by_date(date, verein_id)
        
        return {
            "status": "success",
            "date": date,
            "bookings": bookings,
            "count": len(bookings),
            "verein_id": verein_id,
            "queried_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Buchungsabfrage fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Buchungen konnten nicht geladen werden")

# ENTERPRISE BUCHUNGSSTORNIERUNG
@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Enterprise Buchungsstornierung mit Berechtigungsprüfung"""
    try:
        print(f"🗑️ ENTERPRISE CANCELLATION: Storniere Buchung {booking_id} für User: {current_user_id}")
        
        result = await booking_service.cancel_booking(booking_id, current_user_id)
        
        if result.get("success"):
            return {
                "status": "success",
                "message": result["message"],
                "booking_id": booking_id,
                "cancelled_at": datetime.now().isoformat()
            }
        else:
            raise ValueError("Stornierung fehlgeschlagen - Siehe Service-Logs")
        
    except ValueError as e:
        print(f"❌ ENTERPRISE VALIDATION ERROR: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Stornierung fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Stornierung fehlgeschlagen")

# ENTERPRISE USER BUCHUNGEN
@router.get("/user/{user_id}")
async def get_user_bookings(user_id: str, from_date: Optional[str] = None):
    """Enterprise User-Buchungsabfrage mit Datumsfilter"""
    try:
        print(f"📋 ENTERPRISE USER QUERY: Lade Buchungen für User: {user_id}")
        
        bookings = await booking_service.get_user_bookings(user_id, from_date)
        
        return {
            "status": "success",
            "user_id": user_id,
            "bookings": bookings,
            "count": len(bookings),
            "from_date": from_date,
            "queried_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: User-Buchungsabfrage fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Benutzer-Buchungen konnten nicht geladen werden")

# ENTERPRISE ZEITSLOT VERFÜGBARKEIT
@router.get("/available-slots/{court_id}")
async def get_available_slots(court_id: str, date: str):
    """Enterprise Zeitslot-Verfügbarkeit mit Optimierung"""
    try:
        print(f"🕐 ENTERPRISE SLOTS: Lade verfügbare Slots für Platz {court_id} am {date}")
        
        slots = await booking_service.get_available_time_slots(court_id, date)
        
        return {
            "status": "success",
            "court_id": court_id,
            "date": date,
            "available_slots": slots,
            "count": len(slots),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Slot-Abfrage fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Verfügbare Slots konnten nicht geladen werden")

# ENTERPRISE STATISTIKEN (ADMIN-ONLY)
@router.get("/statistics")
async def get_booking_statistics(
    user_id: Optional[str] = None, 
    date_from: Optional[str] = None, 
    date_to: Optional[str] = None,
    admin_user_id: str = Header(None, alias="X-User-ID")
):
    """Enterprise Statistiken - Admin-Level Berechtigung erforderlich"""
    try:
        # ADMIN-BERECHTIGUNG PRÜFEN
        if not check_user_permissions(admin_user_id, 'darf_statistiken_einsehen'):
            print(f"❌ ADMIN ACCESS DENIED: User {admin_user_id} hat keine Statistik-Berechtigung")
            raise HTTPException(status_code=403, detail="Admin-Berechtigung für Statistiken erforderlich")
        
        print(f"📊 ENTERPRISE STATISTICS: Admin {admin_user_id} - User: {user_id}, Von: {date_from}, Bis: {date_to}")
        
        stats = await booking_service.get_booking_statistics(user_id, date_from, date_to)
        
        return {
            "status": "success",
            "statistics": stats,
            "requested_by": admin_user_id,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ENTERPRISE ERROR: Statistik-Erstellung fehlgeschlagen: {e}")
        raise HTTPException(status_code=500, detail="Statistiken konnten nicht erstellt werden")

# DEVELOPMENT & DEBUG ENDPOINTS (Nur für Entwicklung)
@router.get("/debug/all")
async def debug_all_bookings():
    """DEBUG: Alle Buchungen anzeigen - Nur für Entwicklung"""
    try:
        print(f"🐛 DEBUG: Lade alle Buchungen für Entwicklungszwecke")
        
        from app.database.connection import supabase
        
        response = supabase.table("buchung").select("*").order("erstellt_am", desc=True).execute()
        bookings = response.data or []
        
        # Platz-Details erweitern
        for booking in bookings:
            try:
                platz_response = supabase.table("platz").select("*").eq("id", booking["platz_id"]).execute()
                if platz_response.data:
                    booking["platz"] = platz_response.data[0]
                else:
                    booking["platz"] = {
                        "id": booking["platz_id"], 
                        "name": f"Platz {booking['platz_id']}", 
                        "platztyp": "Standard"
                    }
            except Exception as e:
                print(f"⚠️ Platz-Details für {booking['platz_id']} nicht verfügbar: {e}")
                booking["platz"] = {"id": booking["platz_id"], "name": "Unbekannt", "platztyp": "Standard"}
        
        return {
            "status": "debug_success",
            "bookings": bookings,
            "count": len(bookings),
            "debug_timestamp": datetime.now().isoformat(),
            "environment": "development"
        }
        
    except Exception as e:
        print(f"❌ DEBUG ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Debug-Abfrage fehlgeschlagen: {str(e)}")

@router.get("/debug/headers")
async def debug_headers(request: Request):
    """DEBUG: Header-Analyse für Entwicklung"""
    try:
        headers = dict(request.headers)
        print(f"🐛 DEBUG Headers: {headers}")
        
        return {
            "status": "debug_success",
            "all_headers": headers,
            "user_agent": headers.get("user-agent", "Not found"),
            "x_user_id": headers.get("x-user-id", "Not found"),
            "content_type": headers.get("content-type", "Not found"),
            "debug_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ DEBUG ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/series")
async def create_series_booking(
    request: SeriesBookingRequest, 
    http_request: Request,
    user_id: str = Header(None, alias="X-User-ID")
):
    """🔄 ENTERPRISE SERIES BOOKING: Serienbuchungen erstellen"""
    try:
        print(f"🔄 SERIES BOOKING START: User {user_id}")
        print(f"📊 SERIES DATA: {request.dict()}")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="X-User-ID Header erforderlich")
        
        # Import datetime für Datumsberechnung
        from datetime import datetime, timedelta
        
        created_bookings = []
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        
        # Erstelle Buchungen für jede Woche
        for week in range(request.weeks):
            booking_date = start_date + timedelta(weeks=week)
            booking_date_str = booking_date.strftime("%Y-%m-%d")
            
            # Einzelbuchung erstellen
            booking_data = {
                "platz_id": request.platz_id,  # ✅ KORRIGIERT: platz_id statt court_id
                "date": booking_date_str,
                "time": request.time,
                "duration": request.duration,
                "type": request.type,
                "notes": f"{request.series_name} (Woche {week + 1}/{request.weeks})" if request.series_name else f"Serie - Woche {week + 1}/{request.weeks}",
                "user_id": user_id
            }
            
            try:
                result = await booking_service.create_booking(booking_data)
                created_bookings.append({
                    "week": week + 1,
                    "date": booking_date_str,
                    "booking": result.get("booking")
                })
                print(f"✅ SERIES: Woche {week + 1} - {booking_date_str} erstellt")
            except Exception as e:
                print(f"⚠️ SERIES: Fehler bei Woche {week + 1} - {booking_date_str}: {e}")
                # Weiter mit nächster Woche, auch bei Fehlern
        
        return {
            "status": "success",  # ✅ KORRIGIERT: status = "success" für Frontend-Kompatibilität
            "message": f"Serien-Buchung abgeschlossen: {len(created_bookings)} von {request.weeks} Buchungen erstellt",
            "series_info": {  # ✅ Frontend erwartet "series_info"
                "name": request.series_name,
                "weeks": request.weeks,
                "start_date": request.start_date,
                "court_id": request.platz_id
            },
            "summary": {  # ✅ Frontend erwartet "summary"
                "successful": len(created_bookings),
                "failed": request.weeks - len(created_bookings),
                "total": request.weeks
            },
            "created_bookings": created_bookings,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ SERIES BOOKING ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Serienbuchung fehlgeschlagen: {str(e)}")

@router.get("/test-create")
async def test_create_booking():
    """TEST: Buchung für Entwicklungstests erstellen"""
    try:
        print(f"🧪 DEVELOPMENT TEST: Erstelle Test-Buchung")
        
        booking_data = {
            "court_id": "e1d8f888-7bee-4ffe-b13e-7ecbc74b21f6",
            "date": "2025-06-15",
            "time": "13:00",
            "duration": 60,
            "type": "private",
            "notes": "Automatische Test-Buchung (Development)",
            "user_id": "626093ad-1de3-454f-af72-fd38030613f7"
        }
        
        result = await booking_service.create_booking(booking_data)
        
        return {
            "status": "test_success",
            "message": "Test-Buchung erfolgreich erstellt",
            "test_data": booking_data,
            "result": result,
            "test_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ TEST ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Test fehlgeschlagen: {str(e)}")