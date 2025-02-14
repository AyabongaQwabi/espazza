-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  admin_notes TEXT,
  CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0)
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Admins can view all contacts"
  ON contacts FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Anyone can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update contacts"
  ON contacts FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Create policies for admin_users
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_email ON contacts(email);