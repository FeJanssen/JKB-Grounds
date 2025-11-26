from app.database.connection import supabase
import logging

logger = logging.getLogger(__name__)

def check_user_permissions(user_id: str, required_permission: str) -> bool:
    """
    MARKTREIFE Berechtigungsprüfung - Enterprise Level
    """
    try:
        print(f"🔍 ENTERPRISE: Prüfe Berechtigung für User {user_id}: {required_permission}")
        
        # 1. User-Rolle UND VEREIN ermitteln
        user_response = supabase.table("nutzer").select("rolle_id, verein_id").eq("id", user_id).execute()  # ✅ KORRIGIERT
        print(f"🔍 DEBUG: User Response: {user_response.data}")
        
        if not user_response.data:
            print(f"❌ SECURITY: User {user_id} nicht gefunden - Zugriff verweigert")
            return False
        
        user_data = user_response.data[0]
        rolle_id = user_data["rolle_id"]
        verein_id = user_data["verein_id"]  # ✅ HINZUGEFÜGT
        print(f"🔍 DEBUG: Rolle ID: {rolle_id} | Verein ID: {verein_id}")
        
        # 2. Rolle laden - NUR NAME SPALTE
        role_response = supabase.table("rolle").select("name").eq("id", rolle_id).execute()
        print(f"🔍 DEBUG: Role Response: {role_response.data}")
        
        if not role_response.data:
            print(f"❌ SECURITY: Rolle {rolle_id} nicht gefunden - Zugriff verweigert")
            return False
        
        role_name = role_response.data[0]["name"]
        print(f"🔍 ENTERPRISE: Role Name: {role_name}")
        
        # 3. ENTERPRISE ADMIN-BYPASS (Marktstandard)
        admin_roles = ['admin', 'administrator', 'superadmin', 'systemadmin']
        if role_name.lower() in admin_roles:
            print(f"✅ ENTERPRISE ADMIN-BYPASS: {role_name} {user_id} hat universelle Berechtigung für '{required_permission}'")
            return True
        
        # 4. ✅ KORRIGIERT: Spezifische Rollenberechtigungen für DIESEN VEREIN prüfen
        permission_response = supabase.table("recht").select("*").eq("rolle_id", rolle_id).eq("verein_id", verein_id).execute()
        print(f"🔍 DEBUG: Permission Response (Verein {verein_id}): {permission_response.data}")
        
        if not permission_response.data:
            print(f"❌ BERECHTIGUNG VERWEIGERT: Keine Rechte für Rolle {rolle_id} in Verein {verein_id}")
            return False
        
        recht_data = permission_response.data[0]
        has_permission = recht_data.get(required_permission, False)
        
        print(f"🔍 DEBUG: Alle Rechte: {recht_data}")
        print(f"🔍 DEBUG: Spezifische Berechtigung '{required_permission}': {has_permission}")
        
        if has_permission:
            print(f"✅ BERECHTIGUNG GEWÄHRT: User {user_id} ({role_name}) hat Berechtigung: {required_permission}")
            return True
        else:
            print(f"❌ BERECHTIGUNG VERWEIGERT: User {user_id} ({role_name}) hat KEINE Berechtigung: {required_permission}")
            return False
        
    except Exception as e:
        print(f"❌ SECURITY ERROR: Berechtigungsprüfung fehlgeschlagen: {e}")
        return False

def get_user_role(user_id: str) -> dict:
    """User-Rolle laden"""
    try:
        user_response = supabase.table("nutzer").select("rolle_id, verein_id").eq("id", user_id).execute()  # ✅ KORRIGIERT
        
        if not user_response.data:
            return None
        
        user_data = user_response.data[0]
        rolle_id = user_data["rolle_id"]
        
        # Rollendetails laden - NUR NAME SPALTE
        role_response = supabase.table("rolle").select("name").eq("id", rolle_id).execute()
        
        if role_response.data:
            return role_response.data[0]
        
        return None
        
    except Exception as e:
        print(f"❌ Fehler beim Laden der User-Rolle: {e}")
        return None