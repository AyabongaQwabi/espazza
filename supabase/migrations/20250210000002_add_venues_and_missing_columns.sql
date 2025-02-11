-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  town_id UUID REFERENCES south_african_towns(id),
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create venues"
  ON venues FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update venues they created"
  ON venues FOR UPDATE
  USING (auth.uid() = created_by);

-- Add town_id to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS town_id UUID REFERENCES south_african_towns(id);

-- Add organizer_name to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_name TEXT;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps on venues
CREATE TRIGGER update_venues_modtime
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_town_id ON venues(town_id);
CREATE INDEX IF NOT EXISTS idx_events_town_id ON events(town_id);

-- Update events table to use venue_id instead of venue name
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

-- Create a function to migrate existing venue names to venue_id
CREATE OR REPLACE FUNCTION migrate_venue_names_to_ids() RETURNS void AS $$
DECLARE
  event_record RECORD;
  venue_id UUID;
BEGIN
  FOR event_record IN SELECT id, venue FROM events WHERE venue IS NOT NULL AND events.venue_id IS NULL LOOP
    -- Check if the venue exists, if not, create it
    SELECT id INTO venue_id FROM venues WHERE name = event_record.venue;
    IF venue_id IS NULL THEN
      INSERT INTO venues (name) VALUES (event_record.venue) RETURNING id INTO venue_id;
    END IF;

    -- Update the event with the venue_id
    UPDATE events SET venue_id = venue_id WHERE events.id = event_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_venue_names_to_ids();

-- After migration, we can drop the venue column, but let's keep it for now and just mark it as deprecated
COMMENT ON COLUMN events.venue IS 'DEPRECATED: Use events.venue_id instead';

