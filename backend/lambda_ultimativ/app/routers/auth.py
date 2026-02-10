from fastapi import APIRouter, HTTPException, status
from app.models.user import UserCreate, UserLogin, Token
from app.services.auth_service import auth_service

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Neuen Benutzer registrieren"""
    try:
        token = await auth_service.register_user(user_data)
        if token:
            return token
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registrierung fehlgeschlagen"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Interner Serverfehler"
        )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """Benutzer anmelden"""
    try:
        token = await auth_service.login_user(user_data)
        if token:
            return token
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Anmeldung fehlgeschlagen"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Interner Serverfehler"
        )

@router.get("/test")
async def test_endpoint():
    """Test-Endpoint um zu prüfen, ob der Router funktioniert"""
    return {"message": "Auth-Router funktioniert!"}




@router.get("/debug-supabase")
async def debug_supabase():
    """Debug-Endpoint um Supabase-Verbindung zu testen"""
    try:
        from app.database.connection import get_supabase_client
        
        # Teste alle Vereine
        supabase = get_supabase_client()
        result = supabase.table("verein").select("*").execute()
        return {
            "status": "success",
            "vereine_count": len(result.data) if result.data else 0,
            "vereine_data": result.data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
    



@router.get("/debug-users")
async def debug_users():
    """Debug-Endpoint um alle Benutzer zu sehen"""
    try:
        from app.database.connection import get_supabase_client
        
        supabase = get_supabase_client()
        result = supabase.table("nutzer").select("id, name, email, ist_bestaetigt, passwort").execute()
        return {
            "status": "success",
            "users_count": len(result.data) if result.data else 0,
            "users": result.data
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
    
@router.get("/user/{user_id}")
async def get_user_data(user_id: str):
    """MARKTREIF: Lade User-Daten inklusive verein_id"""  # ✅ RICHTIGE EINRÜCKUNG
    try:
        print(f"🔍 API: Lade User-Daten für {user_id}")
        
        from app.database.connection import get_supabase_client
        
        supabase = get_supabase_client()
        user_response = supabase.table("nutzer").select("*").eq("id", user_id).execute()
        
        if not user_response.data:
            print(f"❌ API: User {user_id} nicht gefunden")
            raise HTTPException(
                status_code=404, 
                detail="User nicht gefunden"
            )
            
        user = user_response.data[0]
        
        print(f"✅ API: User-Daten geladen: {user.get('email')}, Verein: {user.get('verein_id')}")
        
        return {
            "id": user["id"],
            "verein_id": user["verein_id"],
            "rolle_id": user["rolle_id"],
            "name": f"{user.get('vorname', '')} {user.get('nachname', '')}".strip(),
            "email": user["email"],
            "vorname": user.get("vorname"),
            "nachname": user.get("nachname"),
            "ist_bestaetigt": user.get("ist_bestaetigt", True),
            "geschlecht": user.get("geschlecht")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ API: Fehler beim Laden der User-Daten: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Server-Fehler: {str(e)}"
        )