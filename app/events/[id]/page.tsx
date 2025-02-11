'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
  UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Image from 'next/image';

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
      *,
      venues (name, address),
      south_african_towns (name)
    `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      router.push('/events');
    } else {
      setEvent(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-4'>Loading event details...</div>;
  }

  if (!event) {
    return <div className='p-4'>Event not found</div>;
  }

  return (
    <div className='container mx-auto p-4'>
      <Button onClick={() => router.push('/events')} className='mb-4'>
        Back to Events
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            <div className='flex items-center'>
              <CalendarIcon className='mr-2 h-4 w-4' />
              {format(new Date(event.date), 'PPP')}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <Image
                src={event.cover_image || '/placeholder.svg'}
                alt={event.name}
                width={500}
                height={300}
                className='rounded-lg object-cover w-full h-64'
              />
              <div className='mt-4 space-y-2'>
                <div className='flex items-center'>
                  <MapPinIcon className='mr-2 h-4 w-4' />
                  {event.venues?.name}, {event.venues?.address},{' '}
                  {event.south_african_towns?.name}
                </div>
                <div className='flex items-center'>
                  <TicketIcon className='mr-2 h-4 w-4' />
                  Ticket Price:{' '}
                  {event.ticket_price ? `R${event.ticket_price}` : 'Free'}
                </div>
                <div className='flex items-center'>
                  <UsersIcon className='mr-2 h-4 w-4' />
                  Max Attendees: {event.max_attendees || 'Unlimited'}
                </div>
                {event.organizer_name && (
                  <div className='flex items-center'>
                    <UserIcon className='mr-2 h-4 w-4' />
                    Organizer: {event.organizer_name}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className='text-xl font-semibold mb-2'>Event Description</h3>
              <p>{event.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
