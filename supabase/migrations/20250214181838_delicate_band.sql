/*
  # Add Blog Likes and Comments

  1. New Tables
    - blog_likes
      - id (uuid, primary key)
      - post_id (uuid, references blog_posts)
      - user_id (uuid, references profiles)
      - created_at (timestamptz)
    
    - blog_comments
      - id (uuid, primary key)
      - post_id (uuid, references blog_posts)
      - user_id (uuid, references profiles)
      - content (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Changes to blog_posts
    - Add youtube_url column
    - Add audio_url column

  3. Security
    - Enable RLS on new tables
    - Add policies for likes and comments
*/

-- Add media columns to blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create blog_likes table
CREATE TABLE blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create blog_comments table
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Policies for blog_likes
CREATE POLICY "Anyone can view blog likes"
  ON blog_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON blog_likes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike their own likes"
  ON blog_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for blog_comments
CREATE POLICY "Anyone can view blog comments"
  ON blog_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON blog_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON blog_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON blog_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger for comments
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX idx_blog_likes_user_id ON blog_likes(user_id);
CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);