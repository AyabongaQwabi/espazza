/*
  # Add onboarding fields to profiles table
  
  1. Changes
    - Add basic_info_complete flag
    - Add profile_image_url field
    - Add gallery_images array
    - Add demo_songs array
    - Add youtube_links array
    - Add artist_bio text field
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS basic_info_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS gallery_images text[],
ADD COLUMN IF NOT EXISTS demo_songs text[],
ADD COLUMN IF NOT EXISTS youtube_links text[],
ADD COLUMN IF NOT EXISTS artist_bio text;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name)
VALUES 
  ('profile-images', 'profile-images'),
  ('gallery-images', 'gallery-images'),
  ('demo-songs', 'demo-songs')
ON CONFLICT (id) DO NOTHING;

-- Set storage policies
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

CREATE POLICY "Users can upload their own gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Demo songs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-songs');

CREATE POLICY "Users can upload their own demo songs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'demo-songs'
  AND auth.role() = 'authenticated'
);