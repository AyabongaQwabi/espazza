'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
      *,
      venues (name),
      south_african_towns (name)
    `
      )
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-4'>Loading events...</div>;
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-6'>Upcoming Events</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Town</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.name}</TableCell>
              <TableCell>
                <div className='flex items-center'>
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {format(new Date(event.date), 'PPP')}
                </div>
              </TableCell>
              <TableCell>{event.venues?.name || 'TBA'}</TableCell>
              <TableCell>
                <div className='flex items-center'>
                  <MapPinIcon className='mr-2 h-4 w-4' />
                  {event.south_african_towns?.name || 'TBA'}
                </div>
              </TableCell>
              <TableCell>
                <Button onClick={() => router.push(`/events/${event.id}`)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
