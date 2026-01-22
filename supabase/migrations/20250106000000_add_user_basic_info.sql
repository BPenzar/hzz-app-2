-- Add basic user information fields to user_profiles table
-- These fields will be used to pre-fill intake forms for new applications

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS ime TEXT,
ADD COLUMN IF NOT EXISTS prezime TEXT,
ADD COLUMN IF NOT EXISTS oib TEXT,
ADD COLUMN IF NOT EXISTS kontakt_email TEXT,
ADD COLUMN IF NOT EXISTS kontakt_tel TEXT;

-- Add index on OIB for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_oib ON user_profiles(oib);

COMMENT ON COLUMN user_profiles.ime IS 'User first name';
COMMENT ON COLUMN user_profiles.prezime IS 'User last name';
COMMENT ON COLUMN user_profiles.oib IS 'Croatian personal identification number (OIB)';
COMMENT ON COLUMN user_profiles.kontakt_email IS 'Contact email';
COMMENT ON COLUMN user_profiles.kontakt_tel IS 'Contact phone number';

-- Update sections table to allow 'intake' as a valid code
-- First, drop the existing constraint
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_code_check;

-- Add new constraint with 'intake' included
-- Note: Adding ALL possible codes to avoid constraint violations
ALTER TABLE sections ADD CONSTRAINT sections_code_check
  CHECK (code IN ('basic_info', 'business_idea', 'costs', 'revenue_plan', 'final', 'intake', '1', '2', '3.1', '3.2', '4', '5', '6', '7', '8', '9', '10'));
