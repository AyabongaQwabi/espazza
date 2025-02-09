/*
  # Initial Schema Setup for Artist Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `bio` (text)
      - `avatar_url` (text)
      - `website` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `songs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `artist_id` (uuid, references profiles)
      - `audio_url` (text)
      - `youtube_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create songs table
CREATE TABLE songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES profiles(id) NOT NULL,
  audio_url text,
  youtube_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Songs policies
CREATE POLICY "Songs are viewable by everyone"
  ON songs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = artist_id);

CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (auth.uid() = artist_id);