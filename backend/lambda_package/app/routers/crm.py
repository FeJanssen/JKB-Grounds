from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any
from pydantic import BaseModel
from supabase import Client

from app.services.crm_service import CRMService
from app.database.connection import supabase
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/crm", tags=["CRM"])
security = HTTPBearer()

# Pydantic Models für Request Bodies
class UserCreateRequest(BaseModel):
    vorname: str
    nachname: str
    email: str
    passwort: str
    geschlecht: str
    rolle: str

class UserUpdateRequest(BaseModel):
    vorname: str
    nachname: str
    email: str
    passwort: str = ""  # Optional
    geschlecht: str
    rolle: str = ""    # Optional

# MARKTREIFE LÖSUNG: Echte User-Verein-ID
async def get_user_verein(current_user: dict = Depends(get_current_user)) -> dict:
    """Hole Verein-ID des eingeloggten Nutzers"""
    try:
        print(f"🏢 CRM: User-Zugriff für {current_user['email']} | Verein-ID: {current_user.get('verein_id')}")
        
        if not current_user.get('verein_id'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nutzer hat keine Verein-Zugehörigkeit"
            )
        
        print(f"✅ CRM: Dynamische Verein-ID verwendet: {current_user['verein_id']}")
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ CRM User-Verein Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler bei User-Verein-Zugriff: {str(e)}"
        )

# 1. ALLE BESTÄTIGTEN NUTZER ABRUFEN
@router.get("/users")
async def get_users(current_user: dict = Depends(get_user_verein)):
    """Alle bestätigten Nutzer für CRM abrufen"""
    try:
        users = CRMService.get_confirmed_users(supabase, current_user['verein_id'])
        return {"success": True, "data": users}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Nutzer: {str(e)}"
        )

# 2. AUSSTEHENDE REGISTRIERUNGEN ABRUFEN
@router.get("/registrations/pending")
async def get_pending_registrations(current_user: dict = Depends(get_user_verein)):
    """Ausstehende Registrierungen abrufen"""
    try:
        registrations = CRMService.get_pending_registrations(supabase, current_user['verein_id'])
        return {"success": True, "data": registrations}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Registrierungen: {str(e)}"
        )

# 3. REGISTRIERUNG BESTÄTIGEN
@router.put("/registrations/{user_id}/approve")
async def approve_registration(
    user_id: str,  # ✅ GEÄNDERT: str statt int
    current_user: dict = Depends(get_user_verein)
):
    """Registrierung bestätigen"""
    try:
        print(f"🔧 DEBUG: Approve Registration für user_id: {user_id} (type: {type(user_id)})")
        
        approved_user = CRMService.approve_registration(supabase, user_id, current_user['verein_id'])
        return {
            "success": True,
            "message": "Registrierung bestätigt",
            "data": approved_user
        }
    except ValueError as e:
        print(f"❌ DEBUG: ValueError: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        print(f"❌ DEBUG: Exception: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Bestätigen der Registrierung: {str(e)}"
        )

# 4. REGISTRIERUNG ABLEHNEN
@router.delete("/registrations/{user_id}/reject")
async def reject_registration(
    user_id: str,  # ✅ GEÄNDERT: str statt int
    current_user: dict = Depends(get_user_verein)
):
    """Registrierung ablehnen und löschen"""
    try:
        print(f"🔧 DEBUG: Reject Registration für user_id: {user_id} (type: {type(user_id)})")
        
        CRMService.reject_registration(supabase, user_id, current_user['verein_id'])
        return {
            "success": True,
            "message": "Registrierung abgelehnt und gelöscht"
        }
    except ValueError as e:
        print(f"❌ DEBUG: ValueError: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        print(f"❌ DEBUG: Exception: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Ablehnen der Registrierung: {str(e)}"
        )

# 5. NEUEN NUTZER HINZUFÜGEN
@router.post("/users")
async def create_user(
    user_data: UserCreateRequest,
    current_user: dict = Depends(get_user_verein)
):
    """Neuen Nutzer direkt erstellen (bestätigt)"""
    try:
        if not all([user_data.vorname, user_data.nachname, user_data.email, user_data.passwort]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alle Pflichtfelder sind erforderlich"
            )
        
        new_user = CRMService.create_user(
            supabase, 
            user_data.dict(), 
            current_user['verein_id']
        )
        
        return {
            "success": True,
            "message": "Nutzer erfolgreich erstellt",
            "data": new_user
        }
    except ValueError as e:
        if "Email bereits registriert" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Erstellen des Nutzers: {str(e)}"
        )

# 6. STATISTIKEN ABRUFEN
@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_user_verein)):
    """CRM Statistiken abrufen"""
    try:
        stats = CRMService.get_stats(supabase, current_user['verein_id'])
        return {"success": True, "data": stats}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Statistiken: {str(e)}"
        )

# 7. ROLLEN ABRUFEN
@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_user_verein)):
    """Verfügbare Rollen abrufen"""
    try:
        roles = [
            {"id": 1, "name": "Admin", "beschreibung": "Vollzugriff auf alle Funktionen"},
            {"id": 2, "name": "Trainer", "beschreibung": "Kann Trainings verwalten"},
            {"id": 3, "name": "Mannschaftsführer", "beschreibung": "Kann Team-Funktionen nutzen"},
            {"id": 4, "name": "Mitglied", "beschreibung": "Standard Mitglied"},
            {"id": 5, "name": "Gast", "beschreibung": "Eingeschränkter Zugriff"}
        ]
        return {"success": True, "data": roles}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Rollen: {str(e)}"
        )

# 8. NUTZER BEARBEITEN
@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdateRequest,
    current_user: dict = Depends(get_user_verein)
):
    """Nutzer bearbeiten"""
    try:
        if not all([user_data.vorname, user_data.nachname, user_data.email]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vorname, Nachname und Email sind erforderlich"
            )
        
        updated_user = CRMService.update_user(
            supabase, 
            user_id,
            user_data.dict(), 
            current_user['verein_id']
        )
        
        return {
            "success": True,
            "message": "Nutzer erfolgreich bearbeitet",
            "data": updated_user
        }
    except ValueError as e:
        if "nicht gefunden" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Bearbeiten des Nutzers: {str(e)}"
        )

# 9. NUTZER LÖSCHEN
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_user_verein)
):
    """Nutzer löschen"""
    try:
        CRMService.delete_user(supabase, user_id, current_user['verein_id'])
        
        return {
            "success": True,
            "message": "Nutzer erfolgreich gelöscht"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Löschen des Nutzers: {str(e)}"
        )