-- Drop existing view if it exists
DROP VIEW IF EXISTS event_comments_with_users;

-- Recreate the view with proper security
CREATE VIEW event_comments_with_users AS
SELECT 
  c.*,
  p.username,
  p.artist_name,
  p.profile_image_url as profile_image_url
FROM event_comments c
JOIN profiles p ON c.user_id = p.id;

-- Grant appropriate permissions
GRANT SELECT ON event_comments_with_users TO authenticated;
GRANT SELECT ON event_comments_with_users TO anon;

-- Add comment for documentation
COMMENT ON VIEW event_comments_with_users IS 'View for event comments with user information';

-- Create RLS policies on the underlying tables to handle security
CREATE POLICY "Anyone can view event comments with user info"
  ON event_comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view commenter profiles"
  ON profiles FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON event_comments(created_at);

-- Drop existing event_comments table
DROP TABLE IF EXISTS event_comments CASCADE;

-- Recreate event_comments table with proper relationships
CREATE TABLE event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Enable RLS
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view event comments"
  ON event_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment on events"
  ON event_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON event_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON event_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_event_comments_updated_at
  BEFORE UPDATE ON event_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes
CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX idx_event_comments_created_at ON event_comments(created_at);

-- Create view for comments with user info
CREATE OR REPLACE VIEW event_comments_with_users AS
SELECT 
  c.*,
  p.username,
  p.artist_name,
  p.profile_image_url as profile_image_url
FROM event_comments c
JOIN profiles p ON c.user_id = p.id;

-- -- Create policy for the view
-- CREATE POLICY "Anyone can view event comments with users"
--   ON event_comments_with_users FOR SELECT
--   USING (true);