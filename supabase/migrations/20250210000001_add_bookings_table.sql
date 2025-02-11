-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
  fee DECIMAL(10, 2) NOT NULL,
  payment_terms TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Artists can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Event organizers can view bookings for their events" ON bookings
  FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Artists can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = artist_id);

CREATE POLICY "Event organizers can update bookings for their events" ON bookings
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_bookings_modtime
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add index for faster queries
CREATE INDEX idx_bookings_artist_id ON bookings(artist_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_organizer_id ON bookings(organizer_id);

