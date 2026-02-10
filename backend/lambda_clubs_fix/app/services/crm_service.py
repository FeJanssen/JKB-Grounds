from typing import List, Optional, Dict, Any
from supabase import Client
import bcrypt
from datetime import datetime

class CRMService:
    
    @staticmethod
    def get_confirmed_users(supabase: Client, verein_id: str) -> List[Dict[str, Any]]:
        """Alle bestätigten Nutzer für CRM abrufen"""
        try:
            print(f"🔍 DEBUG: CRM sucht bestätigte Nutzer für verein_id: {verein_id}")
            
            # ZEIGE ALLE NUTZER IN DER DB
            all_users = supabase.table('nutzer').select('id, name, email, verein_id, ist_bestaetigt').execute()
            print(f"🔍 DEBUG: ALLE NUTZER in der Datenbank:")
            for user in all_users.data:
                status = "✅ Bestätigt" if user['ist_bestaetigt'] else "❌ Unbestätigt"
                print(f"  - {user['name']} | {user['email']} | Verein-ID: {user['verein_id']} | {status}")
            
            response = supabase.table('nutzer').select('*').eq('ist_bestaetigt', True).eq('verein_id', verein_id).execute()
            print(f"🔍 DEBUG: Gefunden {len(response.data)} bestätigte Nutzer für CRM verein_id {verein_id}")
            
            result = []
            for user in response.data:
                name_parts = (user.get('name') or '').split(' ', 1)
                vorname = name_parts[0] if name_parts else ''
                nachname = name_parts[1] if len(name_parts) > 1 else ''
                
                result.append({
                    'id': user['id'],
                    'vorname': vorname,
                    'nachname': nachname,
                    'email': user.get('email') or '',
                    'geschlecht': user.get('geschlecht') or '',
                    'rolle': CRMService.get_role_name(supabase, user.get('rolle_id')),
                    'rolle_id': user.get('rolle_id'),
                    'passwort': '',
                    'created_at': None
                })
            
            return result
            
        except Exception as e:
            print(f"Fehler beim Abrufen der Nutzer: {e}")
            raise e
    
    @staticmethod
    def get_pending_registrations(supabase: Client, verein_id: str) -> List[Dict[str, Any]]:
        """Ausstehende Registrierungen abrufen"""
        try:
            print(f"🔍 DEBUG: CRM sucht ausstehende Registrierungen für verein_id: {verein_id}")
            
            # ZEIGE ALLE UNBESTÄTIGTEN NUTZER
            all_pending = supabase.table('nutzer').select('id, name, email, verein_id, ist_bestaetigt').eq('ist_bestaetigt', False).execute()
            print(f"🔍 DEBUG: ALLE UNBESTÄTIGTEN NUTZER in der Datenbank:")
            for user in all_pending.data:
                print(f"  - {user['name']} | {user['email']} | Verein-ID: {user['verein_id']}")
            
            response = supabase.table('nutzer').select('*').eq('ist_bestaetigt', False).eq('verein_id', verein_id).execute()
            
            print(f"📊 CRM: {len(response.data)} ausstehende Registrierungen gefunden für CRM verein_id {verein_id}")
            
            result = []
            for user in response.data:
                name_parts = (user.get('name') or '').split(' ', 1)
                vorname = name_parts[0] if name_parts else ''
                nachname = name_parts[1] if len(name_parts) > 1 else ''
                
                result.append({
                    'id': user['id'],
                    'vorname': vorname,
                    'nachname': nachname,
                    'email': user.get('email') or '',
                    'geschlecht': user.get('geschlecht') or '',
                    'rolle': CRMService.get_role_name(supabase, user.get('rolle_id')),
                    'rolle_id': user.get('rolle_id'),
                    'zeittext': 'Unbekannt',
                    'created_at': None
                })
            
            return result
            
        except Exception as e:
            print(f"Fehler beim Abrufen der Registrierungen: {e}")
            raise e
    
    @staticmethod
    def approve_registration(supabase: Client, user_id: str, admin_verein_id: str) -> Dict[str, Any]:  # GEAENDERT: str statt int
        """Registrierung bestätigen"""
        try:
            user_response = supabase.table('nutzer').select('*').eq('id', user_id).eq('verein_id', admin_verein_id).eq('ist_bestaetigt', False).execute()
            
            if not user_response.data:
                raise ValueError("Registrierung nicht gefunden")
            
            user = user_response.data[0]
            
            response = supabase.table('nutzer').update({'ist_bestaetigt': True}).eq('id', user_id).execute()
            
            if not response.data:
                raise ValueError("Fehler beim Bestätigen")
            
            name_parts = (user.get('name') or '').split(' ', 1)
            vorname = name_parts[0] if name_parts else ''
            nachname = name_parts[1] if len(name_parts) > 1 else ''
            
            return {
                'id': user['id'],
                'vorname': vorname,
                'nachname': nachname,
                'email': user.get('email') or '',
                'geschlecht': user.get('geschlecht') or '',
                'rolle': CRMService.get_role_name(supabase, user.get('rolle_id'))
            }
            
        except Exception as e:
            print(f"Fehler beim Bestätigen der Registrierung: {e}")
            raise e
    
    @staticmethod
    def reject_registration(supabase: Client, user_id: str, admin_verein_id: str) -> bool:  # GEAENDERT: str statt int
        """Registrierung ablehnen und löschen"""
        try:
            user_response = supabase.table('nutzer').select('id').eq('id', user_id).eq('verein_id', admin_verein_id).eq('ist_bestaetigt', False).execute()
            
            if not user_response.data:
                raise ValueError("Registrierung nicht gefunden")
            
            response = supabase.table('nutzer').delete().eq('id', user_id).execute()
            
            return True
            
        except Exception as e:
            print(f"Fehler beim Ablehnen der Registrierung: {e}")
            raise e
    
    @staticmethod
    def create_user(supabase: Client, user_data: Dict[str, Any], admin_verein_id: str) -> Dict[str, Any]:
        """Neuen Nutzer direkt erstellen (bestätigt)"""
        try:
            existing_response = supabase.table('nutzer').select('id').eq('email', user_data['email']).execute()
            if existing_response.data:
                raise ValueError("Email bereits registriert")
            
            vollname = f"{user_data['vorname']} {user_data['nachname']}"
            
            hashed_password = bcrypt.hashpw(
                user_data['passwort'].encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            rolle_id = CRMService.get_role_id(supabase, user_data['rolle'])
            
            user_insert_data = {
                'name': vollname,
                'email': user_data['email'],
                'passwort': hashed_password,
                'geschlecht': user_data['geschlecht'],
                'rolle_id': rolle_id,
                'verein_id': admin_verein_id,
                'ist_bestaetigt': True
            }
            
            response = supabase.table('nutzer').insert(user_insert_data).execute()
            
            if not response.data:
                raise ValueError("Fehler beim Erstellen des Nutzers")
            
            new_user = response.data[0]
            
            return {
                'id': new_user['id'],
                'vorname': user_data['vorname'],
                'nachname': user_data['nachname'],
                'email': user_data['email'],
                'geschlecht': user_data['geschlecht'],
                'rolle': user_data['rolle'],
                'rolle_id': rolle_id
            }
            
        except Exception as e:
            print(f"Fehler beim Erstellen des Nutzers: {e}")
            raise e
    
    @staticmethod
    def update_user(supabase: Client, user_id: str, user_data: Dict[str, Any], admin_verein_id: str) -> Dict[str, Any]:
        """Nutzer bearbeiten"""
        try:
            print(f"🔧 DEBUG: Update User {user_id}")
            print(f"🔧 DEBUG: User Data: {user_data}")
            print(f"🔧 DEBUG: Admin Verein ID: {admin_verein_id}")
            
            user_response = supabase.table('nutzer').select('*').eq('id', user_id).eq('verein_id', admin_verein_id).execute()
            print(f"🔧 DEBUG: User exists check: {len(user_response.data)} users found")
            
            if not user_response.data:
                print(f"❌ DEBUG: Nutzer nicht gefunden! user_id={user_id}, verein_id={admin_verein_id}")
                raise ValueError("Nutzer nicht gefunden")
            
            existing_user = user_response.data[0]
            vollname = f"{user_data['vorname']} {user_data['nachname']}"
            
            update_data = {
                'name': vollname,
                'email': user_data['email'],
                'geschlecht': user_data['geschlecht']
            }
            
            # ✅ ROLLE HINZUFÜGEN - wenn vorhanden
            neue_rolle_id = existing_user.get('rolle_id')  # Default: alte Rolle
            if user_data.get('rolle') and user_data['rolle'].strip():
                neue_rolle_id = CRMService.get_role_id(supabase, user_data['rolle'])
                update_data['rolle_id'] = neue_rolle_id
                print(f"🔧 DEBUG: Rolle wird aktualisiert: {user_data['rolle']} -> {neue_rolle_id}")
            
            # Passwort nur wenn angegeben
            if user_data.get('passwort') and user_data['passwort'].strip():
                hashed_password = bcrypt.hashpw(
                    user_data['passwort'].encode('utf-8'),
                    bcrypt.gensalt()
                ).decode('utf-8')
                update_data['passwort'] = hashed_password
                print("🔧 DEBUG: Passwort wird aktualisiert")
            
            print(f"🔧 DEBUG: Final update_data: {update_data}")
            
            response = supabase.table('nutzer').update(update_data).eq('id', user_id).execute()
            
            if not response.data:
                raise ValueError("Fehler beim Aktualisieren")
            
            updated_user = response.data[0]
            print(f"🔧 DEBUG: User updated successfully: {updated_user}")
            
            return {
                'id': updated_user['id'],
                'vorname': user_data['vorname'],
                'nachname': user_data['nachname'],
                'email': user_data['email'],
                'geschlecht': user_data['geschlecht'],
                'rolle': user_data.get('rolle', 'Mitglied'),
                'rolle_id': neue_rolle_id  # ✅ GEÄNDERT: Neue rolle_id!
            }
            
        except Exception as e:
            print(f"❌ DEBUG: Exception in update_user: {e}")
            raise e
    
    @staticmethod
    def delete_user(supabase: Client, user_id: str, admin_verein_id: str) -> bool:
        """Nutzer löschen"""
        try:
            user_response = supabase.table('nutzer').select('id').eq('id', user_id).eq('verein_id', admin_verein_id).execute()
            
            if not user_response.data:
                raise ValueError("Nutzer nicht gefunden")
            
            response = supabase.table('nutzer').delete().eq('id', user_id).execute()
            
            return True
            
        except Exception as e:
            print(f"Fehler beim Löschen des Nutzers: {e}")
            raise e
    
    @staticmethod
    def get_stats(supabase: Client, verein_id: str) -> Dict[str, Any]:
        """CRM Statistiken abrufen"""
        try:
            total_response = supabase.table('nutzer').select('id', count='exact').eq('ist_bestaetigt', True).eq('verein_id', verein_id).execute()
            total = total_response.count if total_response.count else 0
            
            pending_response = supabase.table('nutzer').select('id', count='exact').eq('ist_bestaetigt', False).eq('verein_id', verein_id).execute()
            pending = pending_response.count if pending_response.count else 0
            
            return {
                'total': total,
                'pending': pending
            }
            
        except Exception as e:
            print(f"Fehler beim Abrufen der Statistiken: {e}")
            raise e
    
    @staticmethod
    def get_role_name(supabase: Client, rolle_id: Optional[str]) -> str:  # GEAENDERT: Optional[str]
        """Hole echten Rollennamen aus der Datenbank"""
        try:
            if not rolle_id:
                return 'Mitglied'
                
            tables_to_try = ['rollen', 'rolle', 'roles', 'user_roles']
            
            for table_name in tables_to_try:
                try:
                    response = supabase.table(table_name).select('name').eq('id', rolle_id).execute()
                    if response.data:
                        return response.data[0]['name']
                except Exception:
                    continue
            
            return 'Mitglied'
            
        except Exception as e:
            print(f"❌ Fehler beim Abrufen des Rollennamens: {e}")
            return 'Mitglied'
    
    @staticmethod  
    def get_role_id(supabase: Client, role_name: str) -> str:
        """Hole echte Rollen-UUID aus der Datenbank"""
        try:
            print(f"🔍 Suche Rolle: {role_name}")
            
            tables_to_try = ['rollen', 'rolle', 'roles', 'user_roles']
            
            for table_name in tables_to_try:
                try:
                    response = supabase.table(table_name).select('id').eq('name', role_name).execute()
                    if response.data:
                        rolle_id = response.data[0]['id']
                        print(f"✅ Rolle gefunden in {table_name}: {rolle_id}")
                        return rolle_id
                except Exception:
                    continue
            
            # Fallback: Lade erste verfügbare Rolle
            for table_name in tables_to_try:
                try:
                    response = supabase.table(table_name).select('id').limit(1).execute()
                    if response.data:
                        rolle_id = response.data[0]['id']
                        print(f"⚠️ Fallback Rolle aus {table_name}: {rolle_id}")
                        return rolle_id
                except Exception:
                    continue
            
            # Letzter Fallback: Standard-UUID
            print("⚠️ Keine Rollen-Tabelle gefunden, verwende Standard-UUID")
            return '550e8400-e29b-41d4-a716-446655440000'
            
        except Exception as e:
            print(f"❌ Fehler beim Abrufen der Rollen-ID: {e}")
            return '550e8400-e29b-41d4-a716-446655440000'