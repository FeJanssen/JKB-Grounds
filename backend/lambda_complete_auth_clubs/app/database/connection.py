import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = "https://rmxlrvokczqtlljwqhvo.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteGxydm9rY3pxdGxsandxaHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODEzODQsImV4cCI6MjA1MDI1NzM4NH0.rOUYoN7OMYGUJgFgacWht_or9fYgCuNZZIU2c0xNbqw"

# Debug-Ausgabe
print("SUPABASE_URL:", supabase_url)
print("SUPABASE_KEY:", supabase_key)

def get_supabase_client() -> Client:
    """Neuen Supabase Client für jeden Request erstellen"""
    return create_client(supabase_url, supabase_key)