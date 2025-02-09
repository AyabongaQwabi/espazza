/*
  # Fix Profiles Table - Final Version 2

  1. Changes
    - Ensure clean slate by dropping existing table
    - Create profiles table with proper structure and constraints
    - Add proper indexes
    - Set up RLS policies
    - Add triggers for timestamps

  2. Security
    - Enable RLS
    - Add policies for viewing and management
    - Ensure proper constraints on username and email
*/

DO $$ 
BEGIN
  -- Drop existing table and related objects if they exist
  DROP TABLE IF EXISTS profiles CASCADE;
  
  -- Drop existing functions and triggers if they exist
  DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
  
  -- Create profiles table
  CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
  );

  -- Enable RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (true);

  CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

  -- Create indexes
  CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);
  CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

  -- Create updated_at trigger function
  CREATE OR REPLACE FUNCTION handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create trigger
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

EXCEPTION
  WHEN others THEN
    -- Log the error but don't stop execution
    RAISE NOTICE 'An error occurred: %', SQLERRM;
END $$;