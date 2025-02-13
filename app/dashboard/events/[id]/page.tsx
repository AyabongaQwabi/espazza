'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from '@/hooks/use-toast';
import { Search, Plus } from 'lucide-react';

type Event = {
  id: string;
  name: string;
  description: string;
  venue_id: string;
  town_id: string;
  date: string;
  budget: number;
  ticket_price: number;
  max_attendees: number;
  cover_image: string;
  organizer_id: string; // Added organizer_id
};

type Artist = {
  id: string;
  username: string;
  artist_name: string;
};

export default function EventEditPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [venues, setVenues] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchArtist, setSearchArtist] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [proposedFee, setProposedFee] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchEvent();
    fetchVenues();
    fetchTowns();
  }, []);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch event details. Please try again.',
        variant: 'destructive',
      });
    } else {
      setEvent(data);
    }
    setLoading(false);
  }

  async function fetchVenues() {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching venues:', error);
    } else {
      setVenues(data || []);
    }
  }

  async function fetchTowns() {
    const { data, error } = await supabase
      .from('south_african_towns')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching towns:', error);
    } else {
      setTowns(data || []);
    }
  }

  async function handleUpdateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    const { error } = await supabase
      .from('events')
      .update(event)
      .eq('id', event.id);

    if (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Event updated successfully!',
      });
    }
  }

  async function searchArtists() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, artist_name')
      .ilike('artist_name', `%${searchArtist}%`)
      .limit(5);

    if (error) {
      console.error('Error searching artists:', error);
    } else {
      setArtists(data || []);
    }
  }

  async function inviteArtist() {
    if (!selectedArtist || !event) return;

    const { error } = await supabase.from('bookings').insert({
      artist_id: selectedArtist.id,
      event_id: event.id,
      organizer_id: event.organizer_id, // Added organizer_id
      status: 'Pending',
      fee: Number.parseFloat(proposedFee),
      payment_terms: 'To be discussed',
    });

    if (error) {
      console.error('Error inviting artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to invite artist. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Invitation sent to ${selectedArtist.artist_name}!`,
      });
      setSelectedArtist(null);
      setProposedFee('');
    }
  }

  if (loading) {
    return <div className='p-4'>Loading event details...</div>;
  }

  if (!event) {
    return <div className='p-4'>Event not found.</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Edit Event: {event.name}</h1>

      <form onSubmit={handleUpdateEvent} className='space-y-4'>
        <Input
          placeholder='Event Name'
          value={event.name}
          onChange={(e) => setEvent({ ...event, name: e.target.value })}
          required
        />
        <Textarea
          placeholder='Description'
          value={event.description}
          onChange={(e) => setEvent({ ...event, description: e.target.value })}
          required
        />
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Venue</label>
          <Select
            value={event.venue_id}
            onValueChange={(value) => setEvent({ ...event, venue_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select Venue' />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Town</label>
          <Select
            value={event.town_id}
            onValueChange={(value) => setEvent({ ...event, town_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select Town' />
            </SelectTrigger>
            <SelectContent>
              {towns.map((town) => (
                <SelectItem key={town.id} value={town.id}>
                  {town.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Date</label>
          <Calendar
            mode='single'
            selected={new Date(event.date)}
            onSelect={(date) =>
              date && setEvent({ ...event, date: date.toISOString() })
            }
            className='rounded-md border'
          />
        </div>
        <Input
          type='number'
          placeholder='Budget'
          value={event.budget}
          onChange={(e) =>
            setEvent({ ...event, budget: Number.parseFloat(e.target.value) })
          }
          required
        />
        <Input
          type='number'
          placeholder='Ticket Price'
          value={event.ticket_price}
          onChange={(e) =>
            setEvent({
              ...event,
              ticket_price: Number.parseFloat(e.target.value),
            })
          }
          required
        />
        <Input
          type='number'
          placeholder='Maximum Attendees'
          value={event.max_attendees}
          onChange={(e) =>
            setEvent({
              ...event,
              max_attendees: Number.parseInt(e.target.value),
            })
          }
          required
        />
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Cover Image</label>
          <ImageUploader
            onUploadComplete={(urls) =>
              setEvent({ ...event, cover_image: urls[0] })
            }
            maxSizeInMB={5}
            defaultImage={event.cover_image}
          />
        </div>
        <Button type='submit'>Update Event</Button>
      </form>

      <div className='mt-8'>
        <h2 className='text-xl font-bold mb-4'>Invite Artists</h2>
        <div className='flex space-x-2 mb-4'>
          <Input
            placeholder='Search artists...'
            value={searchArtist}
            onChange={(e) => setSearchArtist(e.target.value)}
          />
          <Button onClick={searchArtists}>
            <Search className='mr-2 h-4 w-4' />
            Search
          </Button>
        </div>
        {artists.length > 0 && (
          <ul className='space-y-2 mb-4'>
            {artists.map((artist) => (
              <li
                key={artist.id}
                className='flex items-center justify-between p-2 border rounded'
              >
                <span>{artist.artist_name}</span>
                <Button onClick={() => setSelectedArtist(artist)}>
                  Select
                </Button>
              </li>
            ))}
          </ul>
        )}
        {selectedArtist && (
          <div className='p-4 border rounded'>
            <h3 className='font-bold mb-2'>
              Invite {selectedArtist.artist_name}
            </h3>
            <Input
              type='number'
              placeholder='Proposed Fee'
              value={proposedFee}
              onChange={(e) => setProposedFee(e.target.value)}
              className='mb-2'
            />
            <Button onClick={inviteArtist}>
              <Plus className='mr-2 h-4 w-4' />
              Send Invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
