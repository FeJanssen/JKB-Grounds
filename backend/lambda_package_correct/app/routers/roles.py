from fastapi import APIRouter, HTTPException
from app.database.connection import supabase

router = APIRouter(prefix="/api/roles", tags=["roles"])

@router.get("/list")
async def get_all_roles():
    """Alle Rollen laden"""
    try:
        print("👥 Lade alle Rollen aus der Datenbank...")
        
        response = supabase.table("rolle").select("*").execute()
        
        print(f"📊 Gefundene Rollen: {len(response.data) if response.data else 0}")
        
        return response.data or []
        
    except Exception as e:
        print(f"❌ Fehler beim Laden der Rollen: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Rollen")

@router.get("/{role_id}")
async def get_role_by_id(role_id: str):
    """Einzelne Rolle laden"""
    try:
        print(f"🔍 Lade Rolle mit ID: {role_id}")
        
        response = supabase.table("rolle").select("*").eq("id", role_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        role = response.data[0]
        print(f"✅ Rolle gefunden: {role['name']}")
        
        return role
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Laden der Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Rolle")

@router.get("/{role_id}/permissions")
async def get_role_permissions(role_id: str, verein_id: str):
    """Berechtigungen einer Rolle laden"""
    try:
        print(f"🔐 Lade Berechtigungen für Rolle: {role_id} in Verein: {verein_id}")
        
        # Prüfen ob Rolle existiert
        role_response = supabase.table("rolle").select("*").eq("id", role_id).execute()
        
        if not role_response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        # Berechtigungen laden
        permissions_response = supabase.table("recht").select("*").eq("rolle_id", role_id).eq("verein_id", verein_id).execute()
        
        return {
            "role": role_response.data[0],
            "permissions": permissions_response.data or []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Laden der Rollen-Berechtigungen: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Berechtigungen")

@router.post("/")
async def create_role(role_data: dict):
    """Neue Rolle erstellen"""
    try:
        print(f"➕ Erstelle neue Rolle: {role_data.get('name')}")
        
        # Prüfen ob Rolle bereits existiert
        existing_response = supabase.table("rolle").select("*").eq("name", role_data.get("name")).execute()
        
        if existing_response.data:
            raise HTTPException(status_code=400, detail="Rolle mit diesem Namen existiert bereits")
        
        # Neue Rolle erstellen
        response = supabase.table("rolle").insert(role_data).execute()
        
        if response.data:
            print(f"✅ Rolle erstellt: {response.data[0]['name']}")
            return {
                "status": "success",
                "message": "Rolle erfolgreich erstellt",
                "role": response.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Rolle konnte nicht erstellt werden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Erstellen der Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Erstellen der Rolle")

@router.put("/{role_id}")
async def update_role(role_id: str, role_data: dict):
    """Rolle aktualisieren"""
    try:
        print(f"✏️ Aktualisiere Rolle: {role_id}")
        
        # Prüfen ob Rolle existiert
        check_response = supabase.table("rolle").select("*").eq("id", role_id).execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        # Rolle aktualisieren
        response = supabase.table("rolle").update(role_data).eq("id", role_id).execute()
        
        if response.data:
            print(f"✅ Rolle aktualisiert: {response.data[0]['name']}")
            return {
                "status": "success",
                "message": "Rolle erfolgreich aktualisiert",
                "role": response.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Rolle konnte nicht aktualisiert werden")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren der Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Aktualisieren der Rolle")

@router.delete("/{role_id}")
async def delete_role(role_id: str):
    """Rolle löschen"""
    try:
        print(f"🗑️ Lösche Rolle: {role_id}")
        
        # Prüfen ob Rolle existiert
        check_response = supabase.table("rolle").select("*").eq("id", role_id).execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        # Prüfen ob Rolle noch verwendet wird
        users_response = supabase.table("nutzer").select("id").eq("rolle_id", role_id).execute()
        
        if users_response.data:
            raise HTTPException(status_code=400, detail=f"Rolle wird noch von {len(users_response.data)} Benutzern verwendet und kann nicht gelöscht werden")
        
        # Rolle löschen
        response = supabase.table("rolle").delete().eq("id", role_id).execute()
        
        print(f"✅ Rolle gelöscht: {role_id}")
        return {
            "status": "success",
            "message": "Rolle erfolgreich gelöscht"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Löschen der Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Löschen der Rolle")

@router.get("/{role_id}/users")
async def get_users_by_role(role_id: str):
    """Alle Benutzer einer Rolle laden"""
    try:
        print(f"👥 Lade Benutzer für Rolle: {role_id}")
        
        # Prüfen ob Rolle existiert
        role_response = supabase.table("rolle").select("*").eq("id", role_id).execute()
        
        if not role_response.data:
            raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
        
        # Benutzer mit dieser Rolle laden
        users_response = supabase.table("nutzer").select("""
            id,
            name,
            email,
            geschlecht,
            ist_bestaetigt,
            erstellt_am,
            verein_id
        """).eq("rolle_id", role_id).execute()
        
        return {
            "role": role_response.data[0],
            "users": users_response.data or [],
            "count": len(users_response.data) if users_response.data else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Laden der Benutzer für Rolle: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Benutzer")