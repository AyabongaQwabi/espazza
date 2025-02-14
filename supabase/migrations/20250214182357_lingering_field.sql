/*
  # Add Artist Likes

  1. New Tables
    - artist_likes
      - id (uuid, primary key)
      - artist_id (uuid, references profiles)
      - user_id (uuid, references profiles)
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for likes
*/

-- Create artist_likes table
CREATE TABLE artist_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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