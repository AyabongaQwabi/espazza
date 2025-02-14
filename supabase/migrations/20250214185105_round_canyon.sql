-- Add status column to event_tickets table
ALTER TABLE event_tickets 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE;

-- Create function to decrease available tickets
CREATE OR REPLACE FUNCTION decrease_available_tickets(
  event_id UUID,
  quantity INTEGER
)
RETURNS void AS $$
DECLARE
  available_tickets INTEGER;
BEGIN
  -- Get current available tickets
  SELECT (max_attendees - COALESCE(
    (SELECT SUM(et.quantity)
     FROM event_tickets et
     WHERE et.event_id = $1
     AND et.status = 'confirmed'),
    0
  ))
  INTO available_tickets
  FROM events
  WHERE id = $1;

  -- Check if enough tickets are available
  IF available_tickets < quantity THEN
    RAISE EXCEPTION 'Not enough tickets available';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check ticket availability before insert
CREATE OR REPLACE FUNCTION check_ticket_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for confirmed tickets
  IF NEW.status = 'confirmed' THEN
    PERFORM decrease_available_tickets(NEW.event_id, NEW.quantity);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_tickets_before_insert
  BEFORE INSERT ON event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION check_ticket_availability();

CREATE TRIGGER check_tickets_before_update
  BEFORE UPDATE ON event_tickets
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION check_ticket_availability();

-- Add RLS policies for event_tickets
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can purchase tickets"
  ON event_tickets FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own pending tickets"
  ON event_tickets FOR UPDATE
  USING (
    auth.uid() = buyer_id
    AND status = 'pending'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_buyer_id ON event_tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_status ON event_tickets(status);
CREATE INDEX IF NOT EXISTS idx_event_tickets_transaction_id ON event_tickets(transaction_id);

-- Create view for event ticket stats
CREATE OR REPLACE VIEW event_ticket_stats AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.max_attendees,
  COUNT(CASE WHEN et.status = 'confirmed' THEN 1 END) as tickets_sold,
  COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.quantity END), 0) as total_attendees,
  e.max_attendees - COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.quantity END), 0) as available_tickets,
  COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.total_price END), 0) as total_revenue
FROM events e
LEFT JOIN event_tickets et ON e.id = et.event_id
GROUP BY e.id, e.name, e.max_attendees;