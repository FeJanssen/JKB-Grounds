-- Migration: Add buchungszeiten column to platz table
-- Date: 2026-02-22
-- Description: Adds JSON column for storing custom booking time durations per court

-- Add buchungszeiten column to platz table
ALTER TABLE platz 
ADD COLUMN IF NOT EXISTS buchungszeiten JSONB DEFAULT '[30, 60, 90, 120]';

-- Update existing courts with default booking times if they don't have any
UPDATE platz 
SET buchungszeiten = '[30, 60, 90, 120]'
WHERE buchungszeiten IS NULL OR buchungszeiten = 'null';

-- Add index for better performance on booking time queries
CREATE INDEX IF NOT EXISTS idx_platz_buchungszeiten ON platz USING GIN (buchungszeiten);

-- Verify the migration
SELECT id, name, buchungszeiten 
FROM platz 
LIMIT 5;
