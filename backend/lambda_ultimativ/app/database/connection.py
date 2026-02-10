import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")  # Der Variablenname, nicht der Wert!
supabase_key = os.getenv("SUPABASE_KEY")  # Der Variablenname, nicht der Wert!

# Debug-Ausgabe
print("SUPABASE_URL:", supabase_url)
print("SUPABASE_KEY:", supabase_key)

supabase: Client = create_client(supabase_url, supabase_key)

# Funktion für Dependency Injection
def get_supabase_client() -> Client:
    return supabase