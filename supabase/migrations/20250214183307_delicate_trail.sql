-- Drop existing artist_likes table if it exists
DROP TABLE IF EXISTS artist_likes CASCADE;

-- Create artist_likes table with correct structure
CREATE TABLE artist_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, user_id)
);

-- Enable RLS
ALTER TABLE artist_likes ENABLE ROW LEVEL SECURITY;

-- Policies for artist_likes
CREATE POLICY "Anyone can view artist likes"
  ON artist_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like artists"
  ON artist_likes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike artists"
  ON artist_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_artist_likes_artist_id ON artist_likes(artist_id);
CREATE INDEX idx_artist_likes_user_id ON artist_likes(user_id);

-- Create function to count artist likes
CREATE OR REPLACE FUNCTION get_artist_likes_count(artist_username TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM artist_likes
    WHERE artist_id = artist_username
  );
END;
$$ LANGUAGE plpgsql;