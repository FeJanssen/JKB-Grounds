from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Dict, Any
import os

from app.database.connection import supabase

security = HTTPBearer()

class AuthMiddleware:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.algorithm = "HS256"

auth_middleware = AuthMiddleware()

# PRODUCTION-READY: Hole echte Verein-ID aus Datenbank
async def no_auth_required() -> Dict[str, Any]:
    """Admin-Zugriff für CRM - Production Ready"""
    try:
        # ECHTE VEREIN-ID aus der Datenbank holen
        verein_response = supabase.table('verein').select('id').limit(1).execute()
        
        if not verein_response.data:
            raise Exception("Kein Verein gefunden - bitte Verein in Datenbank erstellen")
        
        # ERSTE/STANDARD Verein verwenden (oder spezifischen Verein)
        verein_id = verein_response.data[0]['id']
        
        print(f"🏢 CRM: Verwende echte Verein-ID aus DB: {verein_id}")
        
        return {
            'id': 'crm-admin-system',
            'name': 'CRM System Admin',
            'email': 'crm@system.local',
            'rolle_id': 1,
            'verein_id': verein_id,  # ← ECHTE ID aus Datenbank
            'geschlecht': 'system',
            'ist_bestaetigt': True
        }
        
    except Exception as e:
        print(f"❌ CRM Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CRM System-Fehler: {str(e)}"
        )

# BESTEHENDE FUNKTION: Bleibt unverändert
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Aktuellen Benutzer aus JWT Token extrahieren"""
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token fehlt",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # JWT Token dekodieren
        payload = jwt.decode(
            credentials.credentials, 
            auth_middleware.secret_key, 
            algorithms=[auth_middleware.algorithm]
        )
        
        # Email aus Token extrahieren
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token ungültig - keine Email gefunden",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Benutzer aus Supabase laden
        result = supabase.table('nutzer').select('*').eq('email', email).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Benutzer nicht gefunden",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = result.data[0]
        
        # Prüfen ob Benutzer bestätigt ist
        if not user.get('ist_bestaetigt'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Benutzer ist noch nicht bestätigt",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'rolle_id': user['rolle_id'],
            'verein_id': user['verein_id'],
            'geschlecht': user.get('geschlecht'),
            'ist_bestaetigt': user['ist_bestaetigt']
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ungültig",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"AUTH DEBUG: Fehler beim Token-Parsing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Abrufen der Benutzerdaten: {str(e)}"
        )