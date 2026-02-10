from fastapi import APIRouter

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

@router.get("/list")
async def get_clubs_list():
    """Temporärer clubs list endpoint für Frontend-Kompatibilität"""
    # Gibt die Default-Club-Info zurück
    return [
        {
            "id": "fab28464-e42a-4e6e-b314-37eea1e589e6",
            "name": "JKB Tennisclub",
            "address": "Beispielstraße 123, 12345 Beispielstadt",
            "phone": "+49 123 456789",
            "email": "info@jkb-tennis.de",
            "website": "https://jkb-tennis.de"
        }
    ]
