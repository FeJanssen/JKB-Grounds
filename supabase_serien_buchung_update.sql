-- SUPABASE DATENBANKUPDATE FÜR SERIEN-BUCHUNGEN
-- Diese SQL-Befehle in der Supabase SQL Editor ausführen

-- 1. Neue Spalten zur buchung Tabelle hinzufügen
ALTER TABLE buchung ADD COLUMN serien_name VARCHAR(255);
ALTER TABLE buchung ADD COLUMN serien_woche INTEGER;
ALTER TABLE buchung ADD COLUMN serien_gesamt INTEGER;

-- 2. Indizes für bessere Performance erstellen
CREATE INDEX idx_buchung_serien_name ON buchung(serien_name) WHERE serien_name IS NOT NULL;
CREATE INDEX idx_buchung_serien_woche ON buchung(serien_woche) WHERE serien_woche IS NOT NULL;

-- 3. Kommentare für Dokumentation hinzufügen
COMMENT ON COLUMN buchung.serien_name IS 'Name der Buchungsserie (z.B. "Tennis Training Gruppe A")';
COMMENT ON COLUMN buchung.serien_woche IS 'Woche innerhalb der Serie (1, 2, 3, etc.)';
COMMENT ON COLUMN buchung.serien_gesamt IS 'Gesamtanzahl der Wochen in dieser Serie (4, 8, 12, 16)';

-- 4. Beispiel-Query zum Testen nach dem Update
-- SELECT * FROM buchung WHERE serien_name IS NOT NULL ORDER BY serien_name, serien_woche;
