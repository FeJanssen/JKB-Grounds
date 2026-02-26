-- SQL Script zum Erweitern der existierenden preis Tabelle

-- Option 1: Existierende Tabelle erweitern (EMPFOHLEN)
ALTER TABLE preis 
ADD COLUMN abrechnungsmodell VARCHAR(20) DEFAULT 'stunde' 
CHECK (abrechnungsmodell IN ('stunde', 'tag', 'woche', 'monat'));

-- Kommentar hinzufügen
COMMENT ON COLUMN preis.abrechnungsmodell IS 'Abrechnungsmodell: stunde, tag, woche oder monat';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_preis_abrechnungsmodell ON preis(abrechnungsmodell);

-- Alle existierenden Preise auf 'stunde' setzen
UPDATE preis 
SET abrechnungsmodell = 'stunde' 
WHERE abrechnungsmodell IS NULL;

-- Alternative: Falls du die Tabelle neu erstellen willst (VORSICHT: Daten gehen verloren!)
/*
DROP TABLE IF EXISTS preis;

CREATE TABLE preis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platz_id UUID NOT NULL REFERENCES platz(id) ON DELETE CASCADE,
    rolle_id UUID NOT NULL REFERENCES rolle(id) ON DELETE CASCADE,  
    preis DECIMAL(10,2) NOT NULL CHECK (preis >= 0),
    abrechnungsmodell VARCHAR(20) NOT NULL DEFAULT 'stunde' CHECK (abrechnungsmodell IN ('stunde', 'tag', 'woche', 'monat')),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platz_id, rolle_id)
);

-- RLS aktivieren
ALTER TABLE preis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON preis
    FOR ALL USING (auth.role() = 'authenticated');
*/
