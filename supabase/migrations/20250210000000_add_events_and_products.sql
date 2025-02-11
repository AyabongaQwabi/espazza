-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  budget DECIMAL(10, 2),
  ticket_price DECIMAL(10, 2),
  max_attendees INTEGER,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_artists table for artist invitations
CREATE TABLE event_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  fee DECIMAL(10, 2),
  payment_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_tickets table for tracking ticket sales
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Users can create their own events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Users can update their own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Users can delete their own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Products policies
CREATE POLICY "Users can view all products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can create their own products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = seller_id);

-- Event artists policies
CREATE POLICY "Users can view event artists" ON event_artists FOR SELECT USING (true);
CREATE POLICY "Event organizers can create event artists" ON event_artists FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_artists.event_id)
);
CREATE POLICY "Event organizers and invited artists can update event artists" ON event_artists FOR UPDATE USING (
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_artists.event_id)
  OR auth.uid() = event_artists.artist_id
);

-- Event tickets policies
CREATE POLICY "Users can view their own tickets" ON event_tickets FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can create their own tickets" ON event_tickets FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_event_artists_modtime
BEFORE UPDATE ON event_artists
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

