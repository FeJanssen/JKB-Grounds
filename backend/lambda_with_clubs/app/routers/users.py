from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.connection import supabase

router = APIRouter(prefix="/api/users", tags=["users"])

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    geschlecht: Optional[str] = None
    password: Optional[str] = None

@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    """Benutzer-Profil abrufen"""
    try:
        response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
        
        user = response.data[0]
        return {
            "status": "success",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "geschlecht": user.get("geschlecht"),
                "ist_bestaetigt": user["ist_bestaetigt"],
                "verein_id": user["verein_id"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR beim Laden des Benutzers: {e}")
        raise HTTPException(status_code=500, detail="Interner Server-Fehler")

@router.put("/{user_id}")
async def update_user_profile(user_id: str, update_data: UserUpdateRequest):
    """Benutzer-Profil aktualisieren"""
    try:
        # Prüfen ob Benutzer existiert
        check_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
        
        # Update-Daten vorbereiten
        update_fields = {}
        
        if update_data.name is not None:
            update_fields["name"] = update_data.name.strip()
        
        if update_data.email is not None:
            # Prüfen ob E-Mail bereits verwendet wird
            email_check = supabase.table("nutzer").select("id").eq("email", update_data.email.strip()).neq("id", user_id).execute()
            if email_check.data:
                raise HTTPException(status_code=400, detail="E-Mail wird bereits verwendet")
            update_fields["email"] = update_data.email.strip()
        
        if update_data.geschlecht is not None:
            update_fields["geschlecht"] = update_data.geschlecht
        
        if update_data.password is not None:
            # Passwort einfach speichern (später hashen)
            update_fields["passwort"] = update_data.password
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Keine Änderungen angegeben")
        
        # Update durchführen
        response = supabase.table("nutzer").update(update_fields).eq("id", user_id).execute()
        
        if response.data:
            updated_user = response.data[0]
            return {
                "status": "success",
                "message": "Profil erfolgreich aktualisiert",
                "user": {
                    "id": updated_user["id"],
                    "name": updated_user["name"],
                    "email": updated_user["email"],
                    "geschlecht": updated_user.get("geschlecht")
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Update fehlgeschlagen")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR beim Update des Benutzers: {e}")
        raise HTTPException(status_code=500, detail="Interner Server-Fehler")

@router.get("/{user_id}/bookings")
async def get_user_bookings(user_id: str, from_date: Optional[str] = None):
    """Buchungen eines Benutzers abrufen - KORRIGIERT"""
    try:
        print(f"🔍 Lade Buchungen für User: {user_id}")
        
        # SCHRITT 1: Prüfe alle Buchungen in der Datenbank
        all_bookings_response = supabase.table("buchung").select("*").execute()
        print(f"📊 Total Buchungen in DB: {len(all_bookings_response.data) if all_bookings_response.data else 0}")
        
        if all_bookings_response.data:
            print("📋 Alle nutzer_id in Buchungen:")
            for booking in all_bookings_response.data:
                print(f"   Buchung {booking['id']}: nutzer_id={booking.get('nutzer_id')} Status={booking.get('status')}")
        
        # SCHRITT 2: Query mit korrektem Join auf platz Tabelle
        query = supabase.table("buchung").select("""
            id,
            datum,
            uhrzeit_von,
            uhrzeit_bis,
            status,
            nutzer_id,
            platz_id,
            platz:platz_id (
                id,
                name,
                platztyp
            )
        """).eq("nutzer_id", user_id)
        
        print(f"🎯 Suche nach nutzer_id: {user_id}")
        
        # Nur aktive Buchungen
        query = query.eq("status", "aktiv")
        
        # Ab bestimmtem Datum filtern
        if from_date:
            query = query.gte("datum", from_date)
            print(f"🗓️ Filter ab Datum: {from_date}")
        
        # Nach Datum und Zeit sortieren
        query = query.order("datum", desc=False).order("uhrzeit_von", desc=False)
        
        response = query.execute()
        
        print(f"📊 Gefundene Buchungen für User: {len(response.data) if response.data else 0}")
        
        if response.data:
            for booking in response.data:
                print(f"   📅 {booking['datum']} {booking['uhrzeit_von']}-{booking['uhrzeit_bis']} Platz: {booking.get('platz', {}).get('name', 'N/A')}")
        else:
            print(f"❌ Keine Buchungen gefunden für nutzer_id: {user_id}")
        
        return {
            "status": "success",
            "bookings": response.data or [],
            "count": len(response.data) if response.data else 0
        }
        
    except Exception as e:
        print(f"❌ ERROR beim Laden der Benutzer-Buchungen: {e}")
        raise HTTPException(status_code=500, detail="Buchungen konnten nicht geladen werden")

@router.get("/{user_id}/role")
async def get_user_role(user_id: str):
    """Rolle eines Users laden - MARKTREIFE VERSION"""
    try:
        print(f"🔍 Lade Rolle für User: {user_id}")
        
        # User mit Rolle laden
        user_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not user_response.data:
            print(f"❌ User nicht gefunden: {user_id}")
            raise HTTPException(status_code=404, detail="User nicht gefunden")
        
        user = user_response.data[0]
        print(f"👤 User gefunden: {user['name']} (rolle_id: {user.get('rolle_id')})")
        
        # Rolle laden
        if not user.get('rolle_id'):
            print(f"❌ Keine rolle_id für User: {user_id}")
            raise HTTPException(status_code=404, detail="Keine Rolle zugewiesen")
        
        rolle_response = supabase.table("rolle").select("*").eq("id", user['rolle_id']).execute()
        
        if not rolle_response.data:
            print(f"❌ Rolle nicht gefunden: {user['rolle_id']}")
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        rolle = rolle_response.data[0]
        print(f"🎭 Rolle gefunden: {rolle['name']}")
        
        result = {
            "user_id": str(user["id"]),
            "user_name": user["name"],
            "rolle_id": str(user["rolle_id"]),
            "rolle_name": rolle["name"],
            "verein_id": str(user["verein_id"]) if user.get("verein_id") else None,
            "email": user["email"],
            "geschlecht": user.get("geschlecht")
        }
        
        print(f"✅ Rolle-Response: {result}")
        return result
        
    except HTTPException:
        raise  # HTTPException weiterleiten
    except Exception as e:
        print(f"❌ Fehler beim Laden der User-Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Rolle")

@router.get("/{user_id}/permissions")
async def get_user_permissions(user_id: str):
    """Berechtigungen eines Users laden"""
    try:
        print(f"🔐 Lade Berechtigungen für User: {user_id}")
        
        # User laden
        user_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User nicht gefunden")
        
        user = user_response.data[0]
        
        # Berechtigungen über Rolle laden
        permissions_response = supabase.table("recht").select("*").eq("rolle_id", user["rolle_id"]).eq("verein_id", user["verein_id"]).execute()
        
        return {
            "user_id": str(user["id"]),
            "rolle_id": str(user["rolle_id"]),
            "verein_id": str(user["verein_id"]),
            "permissions": permissions_response.data or []
        }
        
    except Exception as e:
        print(f"❌ Fehler beim Laden der Berechtigungen: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Berechtigungen")

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Benutzer löschen"""
    try:
        print(f"🗑️ Lösche User: {user_id}")
        
        # Prüfen ob User existiert
        check_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
        
        # User löschen
        response = supabase.table("nutzer").delete().eq("id", user_id).execute()
        
        if response.data:
            print(f"✅ User gelöscht: {user_id}")
            return {
                "status": "success",
                "message": "Benutzer erfolgreich gelöscht"
            }
        else:
            raise HTTPException(status_code=500, detail="Löschen fehlgeschlagen")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Löschen des Users: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Löschen")

@router.post("/{user_id}/change-role")
async def change_user_role(user_id: str, new_role_id: str):
    """Rolle eines Users ändern"""
    try:
        print(f"🔄 Ändere Rolle für User: {user_id} zu Rolle: {new_role_id}")
        
        # Prüfen ob User existiert
        user_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
        
        # Prüfen ob Rolle existiert
        rolle_response = supabase.table("rolle").select("*").eq("id", new_role_id).execute()
        
        if not rolle_response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        # Rolle ändern
        response = supabase.table("nutzer").update({"rolle_id": new_role_id}).eq("id", user_id).execute()
        
        if response.data:
            print(f"✅ Rolle geändert für User: {user_id}")
            return {
                "status": "success",
                "message": "Rolle erfolgreich geändert",
                "user": response.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Rolle konnte nicht geändert werden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Ändern der Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Ändern der Rolle")

# CRM ENDPOINTS - NEU HINZUGEFÜGT
@router.get("/")
async def get_all_users(verein_id: Optional[str] = None):
    """Alle bestätigten Benutzer für CRM laden"""
    try:
        print(f"👥 CRM API: Lade alle Users für Verein: {verein_id}")
        
        query = supabase.table("nutzer").select("""
            id,
            name,
            email,
            geschlecht,
            ist_bestaetigt,
            erstellt_am,
            rolle_id,
            verein_id,
            rolle:rolle_id (
                id,
                name
            )
        """).eq("ist_bestaetigt", True)  # Nur bestätigte Nutzer für CRM
        
        if verein_id:
            query = query.eq("verein_id", verein_id)
        
        response = query.execute()
        
        # CRM-Format für Frontend
        users = []
        for user in response.data or []:
            users.append({
                "id": user["id"],
                "vorname": user.get("name", "").split(" ")[0] if user.get("name") else "",
                "nachname": " ".join(user.get("name", "").split(" ")[1:]) if user.get("name") and len(user.get("name", "").split(" ")) > 1 else "",
                "email": user["email"],
                "geschlecht": user.get("geschlecht", ""),
                "status": "aktiv",
                "rolle_id": user.get("rolle_id"),
                "rolle_name": user["rolle"]["name"] if user.get("rolle") else "Mitglied",
                "erstellt_am": user.get("erstellt_am", "")
            })
        
        print(f"✅ CRM API: {len(users)} bestätigte Nutzer geladen")
        return users
        
    except Exception as e:
        print(f"❌ CRM API: Fehler beim Laden der Users: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Benutzer")

@router.get("/pending")
async def get_pending_users():
    """Ausstehende Registrierungen für CRM laden"""
    try:
        print("📢 CRM API: Lade ausstehende Registrierungen...")
        
        response = supabase.table("nutzer").select("""
            id,
            name,
            email,
            geschlecht,
            erstellt_am,
            rolle_id,
            verein_id,
            rolle:rolle_id (
                name
            )
        """).eq("ist_bestaetigt", False).execute()
        
        pending_users = []
        for user in response.data or []:
            pending_users.append({
                "id": user["id"],
                "vorname": user.get("name", "").split(" ")[0] if user.get("name") else "",
                "nachname": " ".join(user.get("name", "").split(" ")[1:]) if user.get("name") and len(user.get("name", "").split(" ")) > 1 else "",
                "email": user["email"],
                "geschlecht": user.get("geschlecht", ""),
                "status": "ausstehend",
                "rolle_name": user["rolle"]["name"] if user.get("rolle") else "Mitglied",
                "erstellt_am": user.get("erstellt_am", "")
            })
        
        print(f"✅ CRM API: {len(pending_users)} ausstehende Registrierungen")
        return pending_users
        
    except Exception as e:
        print(f"❌ CRM API: Fehler beim Laden ausstehender Registrierungen: {e}")
        raise HTTPException(status_code=500, detail="Ausstehende Registrierungen konnten nicht geladen werden")

@router.post("/{user_id}/approve")
async def approve_user(user_id: str):
    """Nutzer bestätigen für CRM"""
    try:
        print(f"✅ CRM API: Bestätige Nutzer {user_id}")
        
        response = supabase.table("nutzer").update({
            "ist_bestaetigt": True
        }).eq("id", user_id).execute()
        
        if response.data:
            print(f"✅ CRM API: Nutzer {user_id} erfolgreich bestätigt")
            return {"status": "success", "message": "Nutzer wurde bestätigt"}
        else:
            raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ CRM API: Fehler beim Bestätigen: {e}")
        raise HTTPException(status_code=500, detail="Nutzer konnte nicht bestätigt werden")

@router.post("/{user_id}/reject")
async def reject_user(user_id: str):
    """Nutzer ablehnen für CRM"""
    try:
        print(f"❌ CRM API: Lehne Nutzer {user_id} ab")
        
        # Nutzer löschen
        response = supabase.table("nutzer").delete().eq("id", user_id).execute()
        
        print(f"✅ CRM API: Nutzer {user_id} erfolgreich abgelehnt")
        return {"status": "success", "message": "Nutzer wurde abgelehnt"}
            
    except Exception as e:
        print(f"❌ CRM API: Fehler beim Ablehnen: {e}")
        raise HTTPException(status_code=500, detail="Nutzer konnte nicht abgelehnt werden")