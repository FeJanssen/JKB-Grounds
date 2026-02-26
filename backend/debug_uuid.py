import os
from supabase import create_client

# Test INSERT ohne id Feld
def test_preis_insert():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key)
    
    print("🧪 Teste Preis Insert ohne id...")
    
    test_data = {
        "platz_id": "test-platz-id",
        "rolle_id": "test-rolle-id", 
        "preis": 99.99,
        "abrechnungsmodell": "test"
    }
    
    print(f"📤 Insert Data: {test_data}")
    
    try:
        response = supabase.table("preis").insert(test_data).execute()
        print(f"✅ Insert erfolgreich: {response.data}")
        
        # Lösche Test-Eintrag wieder
        if response.data:
            test_id = response.data[0]["id"]
            supabase.table("preis").delete().eq("id", test_id).execute()
            print(f"🗑️ Test-Eintrag gelöscht: {test_id}")
            
    except Exception as e:
        print(f"❌ Insert Fehler: {e}")

if __name__ == "__main__":
    test_preis_insert()
