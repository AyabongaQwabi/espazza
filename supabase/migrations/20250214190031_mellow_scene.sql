-- Create notifications table for events
CREATE TABLE event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ticket_purchase', 'event_update', 'event_reminder', 'event_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT notification_content_not_empty CHECK (
    length(trim(title)) > 0 AND
    length(trim(message)) > 0
  )
);

-- Enable RLS
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON event_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can create notifications"
  ON event_notifications FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT organizer_id 
      FROM events 
      WHERE id = event_id
    )
  );

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_event_notification(
  p_event_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO event_notifications (
    event_id,
    user_id,
    type,
    title,
    message
  )
  VALUES (
    p_event_id,
    p_user_id,
    p_type,
    p_title,
    p_message
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_event_notifications_user_id ON event_notifications(user_id);
CREATE INDEX idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_read ON event_notifications(read);
CREATE INDEX idx_event_notifications_created_at ON event_notifications(created_at);