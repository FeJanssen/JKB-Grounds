-- Migration: Add booking time columns to platz table
-- Date: 2026-02-23
-- Description: Adds boolean columns for each booking time duration

-- Add boolean columns for each booking time option
ALTER TABLE platz 
ADD COLUMN IF NOT EXISTS booking_15min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_30min BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_45min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_60min BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_75min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_90min BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_105min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_120min BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_135min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_150min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_165min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_180min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_195min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_210min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_225min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_240min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_300min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_360min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_480min BOOLEAN DEFAULT false;

-- Set default booking times for existing courts (30, 60, 90, 120 minutes)
UPDATE platz 
SET booking_30min = true,
    booking_60min = true,
    booking_90min = true,
    booking_120min = true
WHERE id IS NOT NULL;

-- Verify the migration
SELECT id, name, booking_15min, booking_30min, booking_60min, booking_90min, booking_120min 
FROM platz 
LIMIT 5;
