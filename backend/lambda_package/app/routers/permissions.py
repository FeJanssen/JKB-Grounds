from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.connection import supabase

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

class PermissionToggleRequest(BaseModel):
    verein_id: str
    rolle_id: str
    recht_key: str
    ist_aktiv: bool

# ✅ NEU: Die Hauptfunktion für das Frontend Permission System
@router.get("/rechte/{verein_id}/{rolle_id}")
async def get_rechte(verein_id: str, rolle_id: str):
    """
    Lädt Rechte für eine Verein + Rolle Kombination - für Frontend Permission System
    """
    try:
        print(f"🔐 Permission API: Suche Rechte für Verein {verein_id}, Rolle {rolle_id}")
        
        # Suche in der "recht" Tabelle
        response = supabase.table("recht").select("*").eq("verein_id", verein_id).eq("rolle_id", rolle_id).execute()
        
        if not response.data or len(response.data) == 0:
            print(f"⚠️ Permission API: Keine Rechte gefunden für Verein {verein_id}, Rolle {rolle_id}")
            
            # Fallback: Standard-Rechte für alle
            return {
                "status": "success",
                "darf_buchen": True,                    # Jeder darf basic buchen
                "darf_oeffentlich_buchen": False,      # Aber nicht öffentlich
                "rolle_name": "Mitglied",
                "message": "Keine spezifischen Rechte gefunden - Standardrechte verwendet"
            }
        
        # Rechte gefunden
        rechte = response.data[0]  # Erstes (und einziges) Ergebnis
        
        # Boolean-Werte sicherstellen
        darf_buchen = bool(rechte.get("darf_buchen", True))
        darf_oeffentlich_buchen = bool(rechte.get("darf_oeffentlich_buchen", False))
        
        print(f"✅ Permission API: Rechte gefunden - darf_buchen: {darf_buchen}, darf_oeffentlich_buchen: {darf_oeffentlich_buchen}")
        
        # Rolle-Name basierend auf Rechten bestimmen
        rolle_name = "Admin" if darf_oeffentlich_buchen else "Mitglied"
        
        return {
            "status": "success",
            "darf_buchen": darf_buchen,
            "darf_oeffentlich_buchen": darf_oeffentlich_buchen,
            "rolle_name": rolle_name,
            "verein_id": verein_id,
            "rolle_id": rolle_id
        }
        
    except Exception as e:
        print(f"❌ Permission API Fehler: {str(e)}")
        
        # Bei Fehlern: Sichere Fallback-Rechte
        return {
            "status": "error",
            "darf_buchen": True,                    # Sicherheit: Jeder darf buchen
            "darf_oeffentlich_buchen": False,      # Sicherheit: Nicht öffentlich
            "rolle_name": "Fehler",
            "message": f"Fehler beim Laden der Rechte: {str(e)}"
        }

# ✅ NEU: Debug-Funktion für Tests
@router.get("/rechte/debug/{verein_id}")
async def debug_rechte_verein(verein_id: str):
    """
    Debug-Endpoint: Zeigt alle Rechte für einen Verein
    """
    try:
        print(f"🔍 Debug: Lade alle Rechte für Verein {verein_id}")
        
        response = supabase.table("recht").select("*").eq("verein_id", verein_id).execute()
        
        rechte_liste = response.data or []
        
        print(f"📊 Debug: {len(rechte_liste)} Rechte gefunden")
        
        return {
            "status": "success",
            "verein_id": verein_id,
            "rechte_anzahl": len(rechte_liste),
            "rechte": rechte_liste
        }
        
    except Exception as e:
        print(f"❌ Debug Rechte Fehler: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Debug-Rechte: {str(e)}")

# ✅ NEU: Rechte erstellen/aktualisieren
@router.post("/rechte/{verein_id}/{rolle_id}")
async def create_or_update_rechte(
    verein_id: str, 
    rolle_id: str,
    darf_buchen: bool = True,
    darf_oeffentlich_buchen: bool = False
):
    """
    Erstellt oder aktualisiert Rechte für eine Verein + Rolle Kombination
    """
    try:
        print(f"🔧 Erstelle/Update Rechte für Verein {verein_id}, Rolle {rolle_id}")
        
        # Prüfen ob bereits vorhanden
        existing = supabase.table("recht").select("*").eq("verein_id", verein_id).eq("rolle_id", rolle_id).execute()
        
        rechte_data = {
            "verein_id": verein_id,
            "rolle_id": rolle_id,
            "darf_buchen": darf_buchen,
            "darf_oeffentlich_buchen": darf_oeffentlich_buchen
        }
        
        if existing.data:
            # Update bestehende Rechte
            print("🔄 Update bestehende Rechte")
            response = supabase.table("recht").update(rechte_data).eq("verein_id", verein_id).eq("rolle_id", rolle_id).execute()
            action = "updated"
        else:
            # Neue Rechte erstellen
            print("➕ Erstelle neue Rechte")
            response = supabase.table("recht").insert(rechte_data).execute()
            action = "created"
        
        print(f"✅ Rechte erfolgreich {action}")
        
        return {
            "status": "success",
            "action": action,
            "verein_id": verein_id,
            "rolle_id": rolle_id,
            "darf_buchen": darf_buchen,
            "darf_oeffentlich_buchen": darf_oeffentlich_buchen
        }
        
    except Exception as e:
        print(f"❌ Create/Update Rechte Fehler: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen/Aktualisieren der Rechte: {str(e)}")

@router.get("/verein/{verein_id}")
async def get_verein_permissions(verein_id: str):
    """Berechtigungen eines Vereins laden"""
    try:
        print(f"🔐 Lade Berechtigungen für Verein: {verein_id}")
        
        response = supabase.table("recht").select("*").eq("verein_id", verein_id).execute()
        
        print(f"📊 Gefundene Berechtigungen: {len(response.data) if response.data else 0}")
        
        return response.data or []
        
    except Exception as e:
        print(f"❌ Fehler beim Laden der Berechtigungen: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Berechtigungen")

@router.post("/toggle")
async def toggle_permission(request: PermissionToggleRequest):
    """Berechtigung umschalten"""
    try:
        print(f"🔄 Toggle Berechtigung: {request.recht_key} für Rolle {request.rolle_id}")
        
        # Prüfen ob Berechtigung existiert
        existing = supabase.table("recht").select("*").eq("verein_id", request.verein_id).eq("rolle_id", request.rolle_id).execute()
        
        if existing.data:
            # Update bestehende Berechtigung
            print("🔄 Update bestehende Berechtigung")
            response = supabase.table("recht").update({
                request.recht_key: request.ist_aktiv
            }).eq("verein_id", request.verein_id).eq("rolle_id", request.rolle_id).execute()
        else:
            # Neue Berechtigung erstellen
            print("➕ Erstelle neue Berechtigung")
            response = supabase.table("recht").insert({
                "verein_id": request.verein_id,
                "rolle_id": request.rolle_id,
                request.recht_key: request.ist_aktiv
            }).execute()
        
        print("✅ Berechtigung erfolgreich aktualisiert")
        return {"status": "success", "message": "Berechtigung aktualisiert"}
        
    except Exception as e:
        print(f"❌ Fehler beim Toggle der Berechtigung: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Aktualisieren der Berechtigung")