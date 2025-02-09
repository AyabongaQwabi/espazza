/*
  # Artist Details Schema

  1. New Tables
    - `south_african_towns`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `province` (text)
      - `created_at` (timestamp)
    
    - `record_labels`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

    - `distributors`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Profile Extensions
    - Add new columns to profiles table for artist details

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create enum for provinces
DO $$ BEGIN
  CREATE TYPE south_african_province AS ENUM (
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create towns table
CREATE TABLE IF NOT EXISTS south_african_towns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province south_african_province NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, province)
);

-- Create record labels table
CREATE TABLE IF NOT EXISTS record_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create distributors table
CREATE TABLE IF NOT EXISTS distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS government_name text,
ADD COLUMN IF NOT EXISTS artist_name text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS sa_id_number text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS street_address text,
ADD COLUMN IF NOT EXISTS suburb text,
ADD COLUMN IF NOT EXISTS town_id uuid REFERENCES south_african_towns(id),
ADD COLUMN IF NOT EXISTS province south_african_province,
ADD COLUMN IF NOT EXISTS record_label_id uuid REFERENCES record_labels(id),
ADD COLUMN IF NOT EXISTS has_manager boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS distributor_id uuid REFERENCES distributors(id),
ADD COLUMN IF NOT EXISTS samro_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS samro_id text,
ADD COLUMN IF NOT EXISTS cappasso_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cappasso_id text,
ADD COLUMN IF NOT EXISTS risa_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS risa_id text,
ADD COLUMN IF NOT EXISTS sampra_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sampra_id text,
ADD COLUMN IF NOT EXISTS registration_complete boolean DEFAULT false;

-- Enable RLS
ALTER TABLE south_african_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

-- Policies for towns
CREATE POLICY "Towns are viewable by everyone"
  ON south_african_towns FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create towns"
  ON south_african_towns FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for record labels
CREATE POLICY "Record labels are viewable by everyone"
  ON record_labels FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create record labels"
  ON record_labels FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for distributors
CREATE POLICY "Distributors are viewable by everyone"
  ON distributors FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create distributors"
  ON distributors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default distributors
INSERT INTO distributors (name) VALUES
('TuneCore'),
('DistroKid'),
('CD Baby'),
('LANDR'),
('Ditto Music'),
('UnitedMasters'),
('Amuse'),
('RouteNote')
ON CONFLICT (name) DO NOTHING;