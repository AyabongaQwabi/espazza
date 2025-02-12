-- Add user_type column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Add columns for bloggers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_url TEXT;

-- Add columns for events managers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add columns for merchandisers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS product_types TEXT;

-- Add columns for fans
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_genres TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_artists TEXT;



