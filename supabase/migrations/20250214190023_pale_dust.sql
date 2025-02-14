-- Create function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity(
  event_id UUID,
  requested_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  max_attendees INTEGER;
  current_attendees INTEGER;
BEGIN
  -- Get event max attendees
  SELECT e.max_attendees INTO max_attendees
  FROM events e
  WHERE e.id = event_id;

  -- Get current confirmed attendees
  SELECT COALESCE(SUM(et.quantity), 0) INTO current_attendees
  FROM event_tickets et
  WHERE et.event_id = event_id
  AND et.status = 'confirmed';

  -- Check if adding requested quantity would exceed capacity
  RETURN (max_attendees IS NULL) OR (current_attendees + requested_quantity <= max_attendees);
END;
$$ LANGUAGE plpgsql;

-- Create function to get event statistics
CREATE OR REPLACE FUNCTION get_event_stats(
  event_id UUID
)
RETURNS TABLE (
  total_tickets_sold INTEGER,
  total_revenue DECIMAL,
  available_tickets INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.quantity END), 0)::INTEGER as total_tickets_sold,
    COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.total_price END), 0)::DECIMAL as total_revenue,
    CASE 
      WHEN e.max_attendees IS NULL THEN NULL
      ELSE e.max_attendees - COALESCE(SUM(CASE WHEN et.status = 'confirmed' THEN et.quantity END), 0)
    END::INTEGER as available_tickets
  FROM events e
  LEFT JOIN event_tickets et ON e.id = et.event_id
  WHERE e.id = event_id
  GROUP BY e.max_attendees;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle ticket refunds
CREATE OR REPLACE FUNCTION refund_ticket(
  ticket_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  ticket_record event_tickets%ROWTYPE;
BEGIN
  -- Get ticket record
  SELECT * INTO ticket_record
  FROM event_tickets
  WHERE id = ticket_id;

  -- Check if ticket exists and is confirmed
  IF NOT FOUND OR ticket_record.status != 'confirmed' THEN
    RETURN false;
  END IF;

  -- Update ticket status to refunded
  UPDATE event_tickets
  SET status = 'refunded',
      updated_at = NOW()
  WHERE id = ticket_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;