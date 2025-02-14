import EventClient from './EventClient';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventClient eventId={params.id} />;
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient();
  const { data: events } = await supabase.from('events').select('id');

  console.log('events', events);

  return events.map((event: { id: string }) => ({
    id: event.id,
  }));
}
