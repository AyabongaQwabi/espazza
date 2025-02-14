-- Drop existing blog_comments table if it exists
DROP TABLE IF EXISTS blog_comments CASCADE;

-- Recreate blog_comments table with proper relationships
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Enable RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view blog comments"
  ON blog_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment on posts"
  ON blog_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON blog_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON blog_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes
CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at);

-- Create view for comments with user info
CREATE OR REPLACE VIEW blog_comments_with_users AS
SELECT 
  c.*,
  p.username,
  p.artist_name,
  p.profile_image_url as profile_image_url
FROM blog_comments c
JOIN profiles p ON c.user_id = p.id;

-- -- Create policy for the view
-- CREATE POLICY "Anyone can view blog comments with users"
--   ON blog_comments_with_users FOR SELECT
--   USING (true);