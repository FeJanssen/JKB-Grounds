import os
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from app.database.connection import supabase
from app.models.user import UserCreate, UserLogin, UserResponse, Token

class AuthService:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30

    def hash_password(self, password: str) -> str:
        """Passwort hashen"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Passwort verifizieren"""
        try:
            # Konvertiere $2a$ zu $2b$ für Kompatibilität
            if hashed_password.startswith('$2a$'):
                hashed_password = hashed_password.replace('$2a$', '$2b$', 1)
            
            print(f"DEBUG: Vergleiche '{plain_password}' mit Hash '{hashed_password}'")
            result = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
            print(f"DEBUG: Verifikation erfolgreich: {result}")
            return result
        except Exception as e:
            print(f"DEBUG: Passwort-Verifikation Fehler: {e}")
            return False

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """JWT-Token erstellen"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt





    async def register_user(self, user_data: UserCreate) -> Optional[Token]:
        """Neuen Benutzer registrieren"""
        try:
            # Verein ID durch Namen nachschlagen
            verein_result = supabase.table("verein").select("id").eq("name", user_data.vereinsname).execute()
            if not verein_result.data:
                raise ValueError(f"Verein '{user_data.vereinsname}' nicht gefunden")
            
            verein_id = verein_result.data[0]["id"]
            print(f"DEBUG: Verein '{user_data.vereinsname}' gefunden mit ID: {verein_id}")

            # Passwort hashen
            hashed_password = self.hash_password(user_data.password)

            # Standard-Rolle "Mitglied" holen
            rolle_result = supabase.table("rolle").select("id").eq("name", "Mitglied").execute()
            if not rolle_result.data:
                raise ValueError("Standard-Rolle 'Mitglied' nicht gefunden")
            
            rolle_id = rolle_result.data[0]["id"]

            # Benutzer in DB erstellen
            user_insert = {
                "name": user_data.name,
                "email": user_data.email,
                "passwort": hashed_password,
                "ist_bestaetigt": False,  # Benötigt Admin-Freigabe
                "rolle_id": rolle_id,
                "verein_id": verein_id,
                "geschlecht": user_data.geschlecht
            }

            result = supabase.table("nutzer").insert(user_insert).execute()
            
            if result.data:
                user_data_result = result.data[0]
                user_response = UserResponse(
                    id=user_data_result["id"],
                    name=user_data_result["name"],
                    email=user_data_result["email"],
                    ist_bestaetigt=user_data_result["ist_bestaetigt"],
                    rolle_id=user_data_result["rolle_id"],
                    verein_id=user_data_result["verein_id"],
                    geschlecht=user_data_result.get("geschlecht")
                )

                # Token erstellen
                access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
                access_token = self.create_access_token(
                    data={"sub": user_data_result["email"]}, expires_delta=access_token_expires
                )

                return Token(
                    access_token=access_token,
                    token_type="bearer",
                    user=user_response
                )
            
            return None

        except Exception as e:
            print(f"Registrierungsfehler: {e}")
            raise e


    async def login_user(self, user_data: UserLogin) -> Optional[Token]:
        """Benutzer anmelden"""
        try:
            print(f"DEBUG LOGIN: Suche Benutzer mit Email: {user_data.email}")
            
            # Benutzer aus DB holen
            result = supabase.table("nutzer").select("*").eq("email", user_data.email).execute()
            print(f"DEBUG LOGIN: Gefundene Benutzer: {len(result.data) if result.data else 0}")
            
            if not result.data:
                raise ValueError("Benutzer nicht gefunden")
            
            user = result.data[0]
            print(f"DEBUG LOGIN: Benutzer gefunden - ID: {user['id']}")
            print(f"DEBUG LOGIN: Eingegebenes Passwort: {user_data.password}")
            print(f"DEBUG LOGIN: Gespeichertes gehashtes Passwort: {user['passwort']}")
            
            # Passwort überprüfen
            password_valid = self.verify_password(user_data.password, user["passwort"])
            print(f"DEBUG LOGIN: Passwort gültig: {password_valid}")
            
            if not password_valid:
                raise ValueError("Ungültiges Passwort")
            
            # Prüfen ob Benutzer bestätigt ist
            if not user["ist_bestaetigt"]:
                raise ValueError("Benutzer ist noch nicht bestätigt. Warten Sie auf Admin-Freigabe.")

            print(f"DEBUG LOGIN: Login erfolgreich für Benutzer: {user['email']}")

            user_response = UserResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                ist_bestaetigt=user["ist_bestaetigt"],
                rolle_id=user["rolle_id"],
                verein_id=user["verein_id"],
                geschlecht=user.get("geschlecht")
            )

            # Token erstellen
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self.create_access_token(
                data={"sub": user["email"]}, expires_delta=access_token_expires
            )

            return Token(
                access_token=access_token,
                token_type="bearer",
                user=user_response
            )

        except Exception as e:
            print(f"Login-Fehler: {e}")
            raise e


# Service-Instanz erstellen
auth_service = AuthService()