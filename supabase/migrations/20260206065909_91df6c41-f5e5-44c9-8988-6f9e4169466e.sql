-- Add link tracking columns for trip claiming
ALTER TABLE trips ADD COLUMN IF NOT EXISTS link_created_at timestamptz;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS link_expires_at timestamptz;