-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create conversations view for easier querying
CREATE VIEW conversations AS
WITH latest_messages AS (
  SELECT DISTINCT ON (
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id)
  )
    id,
    sender_id,
    recipient_id,
    content,
    created_at,
    read
  FROM messages
  ORDER BY
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at DESC
)
SELECT
  m.*,
  s.username as sender_username,
  s.artist_name as sender_artist_name,
  s.profile_image_url as sender_avatar,
  r.username as recipient_username,
  r.artist_name as recipient_artist_name,
  r.profile_image_url as recipient_avatar
FROM latest_messages m
JOIN profiles s ON m.sender_id = s.id
JOIN profiles r ON m.recipient_id = r.id;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR
  auth.uid() = recipient_id
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Add function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_booking_id ON messages(booking_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

