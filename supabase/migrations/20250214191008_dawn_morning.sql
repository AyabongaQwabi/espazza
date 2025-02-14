-- Drop existing contacts table if it exists
DROP TABLE IF EXISTS contacts CASCADE;

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

-- Create policies for contacts
CREATE POLICY "Anyone can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all contacts"
  ON contacts FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Admins can update contacts"
  ON contacts FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION handle_contacts_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_email ON contacts(email);