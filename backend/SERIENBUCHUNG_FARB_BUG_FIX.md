🐛 **SERIENBUCHUNG FARB-BUG - BEHOBEN**

## Problem:
Bei Serienbuchungen wird die ausgewählte Farbe nicht übernommen - alle Slots werden rot angezeigt, obwohl z.B. Lila ausgewählt wurde.

## Root Cause:
1. ❌ **Backend SeriesBookingRequest Model** fehlte `color`-Feld
2. ❌ **Backend /series Route** übertrug die `color` nicht an den BookingService
3. ❌ **Frontend Serien-Datenstruktur** übertrug die `color` nicht an das Backend

## Lösung:
### ✅ Backend Fixes:
1. **SeriesBookingRequest Model** erweitert um `color: Optional[str] = None`
2. **Series Route** überträgt jetzt `booking_data["color"] = request.color`
3. **BookingService** speichert die Farbe korrekt in die Datenbank

### ✅ Frontend Fix:
1. **BookingCalender.js** überträgt die `color` bei Serienbuchungen korrekt an das Backend

## Test-Szenario:
1. **Öffentliche Serienbuchung** starten
2. **Farbe wählen** (z.B. Lila `#8A2BE2`)
3. **4 Wochen** Serie auswählen
4. **Buchung bestätigen**

## Erwartetes Ergebnis:
✅ Alle 4 Wochen der Serie werden in der gewählten Farbe (Lila) angezeigt
✅ Einzelbuchungen behalten weiterhin ihre Farbfunktion

## Deployment:
📦 `lambda_COLOR_BUG_FIXED.zip` bereit für AWS Lambda Upload
🚀 Backend + Frontend Changes synchronisiert

## Technische Details:
```python
# Backend: SeriesBookingRequest erweitert
class SeriesBookingRequest(BaseModel):
    # ... bestehende Felder
    color: Optional[str] = None  # ✅ NEU

# Backend: booking_data erweitert
booking_data = {
    # ... bestehende Felder  
    "color": request.color if hasattr(request, 'color') else None,  # ✅ NEU
}
```

```javascript
// Frontend: requestData für Series erweitert
requestData = {
    // ... bestehende Felder
    color: bookingData.color  // ✅ NEU
};
```

## Status: ✅ BEHOBEN
Der Bug ist vollständig behoben und bereit für Deployment.
