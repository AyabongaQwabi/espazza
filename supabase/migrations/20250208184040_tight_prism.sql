/*
  # Add Blog Functionality

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `author_id` (uuid, references profiles)
      - `slug` (text, unique)
      - `published` (boolean)
      - `featured_image` (text)
      - `excerpt` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `blog_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)

    - `post_categories`
      - Junction table for posts and categories
      - `post_id` (uuid, references blog_posts)
      - `category_id` (uuid, references blog_categories)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own posts
    - Allow public read access to published posts
*/

-- Create blog_posts table
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) NOT NULL,
  slug text UNIQUE NOT NULL,
  published boolean DEFAULT false,
  featured_image text,
  excerpt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_categories table
CREATE TABLE blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create junction table for posts and categories
CREATE TABLE post_categories (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

-- Blog posts policies
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Users can view their own unpublished posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Blog categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can create categories"
  ON blog_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Post categories policies
CREATE POLICY "Post categories are viewable by everyone"
  ON post_categories FOR SELECT
  USING (true);

CREATE POLICY "Users can manage categories for their own posts"
  ON post_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );