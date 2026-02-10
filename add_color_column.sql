-- Add color column to buchung table for booking color customization
ALTER TABLE buchung 
ADD COLUMN color VARCHAR(7) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN buchung.color IS 'Hex color code for visual distinction of public bookings (e.g., #FF0000)';

-- Optional: Add check constraint to ensure valid hex color format
ALTER TABLE buchung 
ADD CONSTRAINT color_format_check 
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
