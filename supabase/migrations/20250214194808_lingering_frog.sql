-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON event_tickets;
DROP POLICY IF EXISTS "Users can purchase tickets" ON event_tickets;
DROP POLICY IF EXISTS "Users can update their own pending tickets" ON event_tickets;

-- Recreate policies with updated conditions
CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (
    auth.uid() = buyer_id OR
    auth.uid() IN (
      SELECT organizer_id FROM events WHERE id = event_id
    )
  );

CREATE POLICY "Users can purchase tickets"
    ON event_tickets FOR INSERT
    WITH CHECK (
        auth.uid() = buyer_id AND
        check_event_capacity(event_id, quantity)
    );

CREATE POLICY "Users can update their own pending tickets"
    ON event_tickets FOR UPDATE
    WITH CHECK (
        auth.uid() = buyer_id AND
        status = 'pending'
    );

-- Add additional policy for event organizers
CREATE POLICY "Event organizers can manage tickets"
    ON event_tickets FOR ALL
    USING (
        auth.uid() IN (
            SELECT organizer_id FROM events WHERE id = event_id
        )
    );