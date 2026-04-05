import os
import bcrypt
import secrets
import uuid
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


    async def verify_club_password(self, verein_id: str, vereinspasswort: str) -> bool:
        """Vereinspasswort überprüfen"""
        try:
            print(f"DEBUG: Überprüfe Verein ID: {verein_id}")
            print(f"DEBUG: Eingegebenes Passwort: {vereinspasswort}")
            
            result = supabase.table("verein").select("vereinspasswort").eq("id", verein_id).execute()
            print(f"DEBUG: Supabase Result: {result.data}")
            
            if result.data:
                db_password = result.data[0]["vereinspasswort"]
                print(f"DEBUG: Passwort aus DB: {db_password}")
                is_match = db_password == vereinspasswort
                print(f"DEBUG: Passwort stimmt überein: {is_match}")
                return is_match
            else:
                print(f"DEBUG: Kein Verein mit ID {verein_id} gefunden")
                return False
        except Exception as e:
            print(f"Fehler bei Vereinspasswort-Verifikation: {e}")
            return False


    async def register_user(self, user_data: UserCreate) -> Optional[Token]:
        """Neuen Benutzer registrieren"""
        try:
            # Verein anhand des Namens finden
            verein_result = supabase.table("verein").select("id").eq("name", user_data.vereinsname).execute()
            if not verein_result.data:
                raise ValueError(f"Verein '{user_data.vereinsname}' nicht gefunden")
            
            verein_id = verein_result.data[0]["id"]

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

    async def request_password_reset(self, email: str) -> bool:
        """Passwort-Reset anfordern"""
        try:
            print(f"DEBUG RESET: Passwort-Reset angefordert für: {email}")
            
            # Prüfen ob Benutzer existiert
            result = supabase.table("nutzer").select("*").eq("email", email).execute()
            
            if not result.data:
                print(f"DEBUG RESET: Benutzer nicht gefunden")
                # Aus Sicherheitsgründen trotzdem true zurückgeben
                return True
            
            user = result.data[0]
            user_id = user["id"]
            
            # Reset-Token generieren
            reset_token = str(uuid.uuid4())
            
            # Zeitzone-bewusste Zeitstempel-Erstellung
            from datetime import timezone
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # 1 Stunde gültig
            
            print(f"DEBUG RESET: Token generiert: {reset_token}")
            print(f"DEBUG RESET: Expires at: {expires_at}")
            
            # Token in DB speichern (oder updaten)
            # Erst prüfen ob bereits ein Token existiert
            existing_token = supabase.table("password_reset_tokens").select("*").eq("user_id", user_id).execute()
            
            if existing_token.data:
                # Update existierender Token
                supabase.table("password_reset_tokens").update({
                    "token": reset_token,
                    "expires_at": expires_at.isoformat(),
                    "used": False
                }).eq("user_id", user_id).execute()
            else:
                # Neuer Token
                supabase.table("password_reset_tokens").insert({
                    "user_id": user_id,
                    "token": reset_token,
                    "expires_at": expires_at.isoformat(),
                    "used": False
                }).execute()
            
            # Email senden
            from app.services.gmail_service import gmail_service
            await gmail_service.send_password_reset_email(email, user["name"], reset_token)
            
            print(f"DEBUG RESET: Reset-Email gesendet an {email}")
            return True
            
        except Exception as e:
            print(f"Passwort-Reset Fehler: {e}")
            raise e

    async def verify_reset_token(self, token: str) -> Optional[dict]:
        """Reset-Token verifizieren"""
        try:
            print(f"DEBUG RESET: Verifiziere Token: {token}")
            
            # Token aus DB holen
            result = supabase.table("password_reset_tokens").select("*").eq("token", token).execute()
            
            if not result.data:
                print(f"DEBUG RESET: Token nicht gefunden")
                return None
            
            token_data = result.data[0]
            
            # Prüfen ob Token bereits verwendet wurde
            if token_data["used"]:
                print(f"DEBUG RESET: Token bereits verwendet")
                return None
            
            # Prüfen ob Token noch gültig ist
            expires_at_str = token_data["expires_at"]
            print(f"DEBUG RESET: expires_at string: {expires_at_str}")
            
            # Zeitzone-bewusste Datumsvergleichung
            from datetime import timezone
            
            if expires_at_str.endswith('Z'):
                expires_at_str = expires_at_str.rstrip('Z') + '+00:00'
            
            expires_at = datetime.fromisoformat(expires_at_str)
            current_time = datetime.now(timezone.utc)
            
            print(f"DEBUG RESET: expires_at: {expires_at}")
            print(f"DEBUG RESET: current_time: {current_time}")
            
            if current_time > expires_at:
                print(f"DEBUG RESET: Token abgelaufen")
                return None
            
            # Benutzer-Daten holen
            user_result = supabase.table("nutzer").select("*").eq("id", token_data["user_id"]).execute()
            
            if not user_result.data:
                print(f"DEBUG RESET: Benutzer nicht gefunden")
                return None
            
            user = user_result.data[0]
            print(f"DEBUG RESET: Token gültig für Benutzer: {user['email']}")
            
            return {
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"]
            }
            
        except Exception as e:
            print(f"Token-Verifikation Fehler: {e}")
            return None

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Passwort mit Token zurücksetzen"""
        try:
            print(f"DEBUG RESET: Setze Passwort zurück mit Token: {token}")
            
            # Token verifizieren
            user_data = await self.verify_reset_token(token)
            if not user_data:
                print(f"DEBUG RESET: Token ungültig")
                return False
            
            # Neues Passwort hashen
            hashed_password = self.hash_password(new_password)
            
            # Passwort in DB aktualisieren
            supabase.table("nutzer").update({
                "passwort": hashed_password
            }).eq("id", user_data["user_id"]).execute()
            
            # Token als verwendet markieren
            supabase.table("password_reset_tokens").update({
                "used": True
            }).eq("token", token).execute()
            
            print(f"DEBUG RESET: Passwort erfolgreich zurückgesetzt für: {user_data['email']}")
            return True
            
        except Exception as e:
            print(f"Passwort-Reset Fehler: {e}")
            return False


# Service-Instanz erstellen
auth_service = AuthService()