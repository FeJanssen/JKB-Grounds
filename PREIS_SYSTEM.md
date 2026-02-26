# 📊 Preis-Management System

## 🎯 Überblick
Das neue Preis-Management System ermöglicht **individuelle Abrechnungsmodelle pro Rolle** für jeden Platz.

## 📋 Features
- ✅ **Pro-Rolle Abrechnungsmodell**: Jede Rolle kann eigenes Abrechnungsmodell haben
- ✅ **4 Abrechnungsmodelle**: Stunde, Tag, Woche, Monat  
- ✅ **Separate Preis-Tabelle**: Saubere Datentrennung
- ✅ **Backend-Integration**: Automatisches Laden/Speichern
- ✅ **Frontend-UI**: Intuitive Karten-basierte Eingabe

## 🗄️ Database Schema

### preis Tabelle
```sql
CREATE TABLE preis (
    id UUID PRIMARY KEY,
    platz_id UUID REFERENCES platz(id),
    rolle_id UUID REFERENCES rolle(id),
    preis DECIMAL(10,2) NOT NULL,
    abrechnungsmodell VARCHAR(20) DEFAULT 'stunde',
    erstellt_am TIMESTAMP DEFAULT NOW(),
    UNIQUE(platz_id, rolle_id)
);
```

## 🔧 Backend API

### Court Create/Update
```python
class CourtCreateRequest:
    preise: Dict[str, float]  # rolle_id -> preis
    abrechnungsmodelle: Dict[str, str]  # rolle_id -> abrechnungsmodell
```

### Endpoints
- `POST /api/courts` - Erstellt Platz + Preise
- `PUT /api/courts/{id}` - Update Platz + Preise  
- `GET /api/courts/{id}` - Lädt Platz mit Preisen
- `GET /api/courts/verein/{id}` - Lädt alle Plätze mit Preisen

## 🎨 Frontend

### Preis-Rolle-Karten
```jsx
<View style={styles.priceRoleCard}>
  <Text>{role.name}</Text>
  <TextInput value={preis} />
  <AbrechnungsmodellPicker />
</View>
```

### State Management
```javascript
courtForm: {
  preise: {}, // rolle_id -> preis
  abrechnungsmodelle: {} // rolle_id -> abrechnungsmodell
}
```

## 🚀 Beispiel Daten

### Tennisclub Setup:
- **Mitglieder**: €15/Stunde
- **Gäste**: €25/Stunde  
- **Trainer**: €10/Stunde

### Coworking Setup:
- **Standard**: €5/Stunde
- **Premium**: €8/Stunde
- **Wochenticket**: €200/Woche
- **Monatsabo**: €600/Monat

## ✅ Validation
- Abrechnungsmodell: `stunde|tag|woche|monat`
- Preis: Nur positive Zahlen
- Unique: Ein Preis pro Platz-Rolle-Kombination

## 🔄 Migration
1. SQL aus `add_abrechnungsmodell_column.sql` ausführen
2. Existierende Preise über API migrieren
3. Lambda Package deployen
