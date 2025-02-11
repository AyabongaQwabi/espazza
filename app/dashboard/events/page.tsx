'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    venue: '',
    date: new Date(),
    budget: '',
    ticketPrice: '',
    maxAttendees: '',
    coverImage: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          ...newEvent,
          organizer_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating event:', error);
    } else {
      setEvents([...events, data[0]]);
      setNewEvent({
        name: '',
        description: '',
        venue: '',
        date: new Date(),
        budget: '',
        ticketPrice: '',
        maxAttendees: '',
        coverImage: '',
      });
    }
  }

  if (loading) {
    return <div className='p-4'>Loading events...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Events Management</h1>

      <Dialog>
        <DialogTrigger asChild>
          <Button className='mb-4'>
            <Plus className='mr-2 h-4 w-4' /> Create New Event
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className='space-y-4'>
            <Input
              placeholder='Event Name'
              value={newEvent.name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, name: e.target.value })
              }
              required
            />
            <Textarea
              placeholder='Description'
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              required
            />
            <Input
              placeholder='Venue'
              value={newEvent.venue}
              onChange={(e) =>
                setNewEvent({ ...newEvent, venue: e.target.value })
              }
              required
            />
            <Calendar
              mode='single'
              selected={newEvent.date}
              onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
              className='rounded-md border'
            />
            <Input
              type='number'
              placeholder='Budget'
              value={newEvent.budget}
              onChange={(e) =>
                setNewEvent({ ...newEvent, budget: e.target.value })
              }
              required
            />
            <Input
              type='number'
              placeholder='Ticket Price'
              value={newEvent.ticketPrice}
              onChange={(e) =>
                setNewEvent({ ...newEvent, ticketPrice: e.target.value })
              }
              required
            />
            <Input
              type='number'
              placeholder='Maximum Attendees'
              value={newEvent.maxAttendees}
              onChange={(e) =>
                setNewEvent({ ...newEvent, maxAttendees: e.target.value })
              }
              required
            />
            <Input
              placeholder='Cover Image URL'
              value={newEvent.coverImage}
              onChange={(e) =>
                setNewEvent({ ...newEvent, coverImage: e.target.value })
              }
            />
            <Button type='submit'>Create Event</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Ticket Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.name}</TableCell>
              <TableCell>{format(new Date(event.date), 'PPP')}</TableCell>
              <TableCell>{event.venue}</TableCell>
              <TableCell>
                {event.ticketPrice ? `$${event.ticketPrice}` : 'Free'}
              </TableCell>
              <TableCell>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => router.push(`/dashboard/events/${event.id}`)}
                >
                  Manage
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
