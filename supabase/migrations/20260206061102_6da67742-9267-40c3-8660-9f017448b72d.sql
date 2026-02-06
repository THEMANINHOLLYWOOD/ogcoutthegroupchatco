-- Add share_code column to trips table
ALTER TABLE trips ADD COLUMN share_code TEXT;

-- Create a function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate codes for existing trips
UPDATE trips SET share_code = generate_share_code() WHERE share_code IS NULL;

-- Ensure uniqueness for any collisions
DO $$
DECLARE
  trip_record RECORD;
BEGIN
  FOR trip_record IN 
    SELECT id FROM trips t1 
    WHERE EXISTS (
      SELECT 1 FROM trips t2 
      WHERE t2.share_code = t1.share_code AND t2.id != t1.id
    )
  LOOP
    UPDATE trips SET share_code = generate_share_code() WHERE id = trip_record.id;
  END LOOP;
END $$;

-- Now make the column not null and add unique constraint
ALTER TABLE trips ALTER COLUMN share_code SET NOT NULL;
ALTER TABLE trips ALTER COLUMN share_code SET DEFAULT generate_share_code();
CREATE UNIQUE INDEX trips_share_code_unique_idx ON trips(share_code);