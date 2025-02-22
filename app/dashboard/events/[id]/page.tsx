'use client';

import type React from 'react';

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
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
  organizer_id: string;
};

type Artist = {
  id: string;
  username: string;
  artist_name: string;
};

type BookingDetails = {
  fee: string;
  payment_terms: string;
};

type Booking = {
  id: string;
  artist_id: string;
  event_id: string;
  organizer_id: string;
  status: string;
  fee: number;
  payment_terms: string;
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
  const router = useRouter();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    fee: '',
    payment_terms: '',
  });
  const [invitedArtists, setInvitedArtists] = useState<Booking[]>([]);

  useEffect(() => {
    fetchEvent();
    fetchVenues();
    fetchTowns();
    fetchInvitedArtists();
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

  async function fetchInvitedArtists() {
    console.log('Fetting invited artists for event', params.id, event);

    const { data, error } = await supabase
      .from('bookings')
      .select('*, profile: profiles(artist_name)')
      .eq('event_id', params.id);
    console.log('GOT Invited artists:', data);
    if (error) {
      console.error('Error fetching invited artists:', error);
    } else {
      setInvitedArtists(
        data.map((booking) => ({
          ...booking,
          artist_name: booking.profile.artist_name,
        }))
      );
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

  async function createBooking() {
    if (!selectedArtist || !event) return;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        artist_id: selectedArtist.id,
        event_id: event.id,
        status: 'Pending',
        fee: Number(bookingDetails.fee),
        payment_terms: bookingDetails.payment_terms,
      })
      .select();

    if (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } else {
      setInvitedArtists([
        ...invitedArtists,
        { ...data[0], artist_name: selectedArtist.artist_name },
      ]);
      setIsBookingModalOpen(false);
      setSelectedArtist(null);
      setBookingDetails({ fee: '', payment_terms: '' });
      setSearchArtist('');
      setArtists([]);
      toast({
        title: 'Success',
        description: `Booking request sent to ${selectedArtist.artist_name}!`,
      });
    }
  }

  async function cancelBooking(bookingId: string) {
    console.log('Cancelling booking:', bookingId);
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled' })
      .eq('id', bookingId);
    console.log(data, error);
    if (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    } else {
      setInvitedArtists(
        invitedArtists.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'Cancelled' }
            : booking
        )
      );
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully.',
      });
    }
  }

  if (loading) {
    return <div className='p-4'>Loading event details...</div>;
  }

  if (!event) {
    return <div className='p-4'>Event not found.</div>;
  }

  console.log('Event:', event);
  console.log('invitedArtists:', invitedArtists);

  return (
    <div className='p-4 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>Edit Event: {event.name}</h1>

      <form
        onSubmit={handleUpdateEvent}
        className='grid grid-cols-1 md:grid-cols-2 gap-6'
      >
        <div className='space-y-4'>
          <Input
            placeholder='Event Name'
            value={event.name}
            onChange={(e) => setEvent({ ...event, name: e.target.value })}
            required
          />
          <Textarea
            placeholder='Description'
            value={event.description}
            onChange={(e) =>
              setEvent({ ...event, description: e.target.value })
            }
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
        </div>
        <div className='space-y-4'>
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
        </div>
        <div className='md:col-span-2'>
          <Button type='submit'>Update Event</Button>
        </div>
      </form>

      <div className='mt-8'>
        <h2 className='text-xl font-bold mb-4'>Invite Artists</h2>
        <div className='flex space-x-2 mb-4'>
          <div className='relative flex-grow'>
            <Input
              placeholder='Search artists...'
              value={searchArtist}
              onChange={(e) => setSearchArtist(e.target.value)}
              className='pr-10'
            />
            {searchArtist && (
              <button
                onClick={() => setSearchArtist('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2'
              >
                <X className='h-4 w-4 text-gray-500' />
              </button>
            )}
          </div>
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
                <Button
                  onClick={() => {
                    setSelectedArtist(artist);
                    setIsBookingModalOpen(true);
                  }}
                >
                  Select
                </Button>
              </li>
            ))}
          </ul>
        )}

        <h3 className='text-lg font-bold mt-6 mb-2'>Invited Artists</h3>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-950'>
                <th className='text-left p-2'>Artist Name</th>
                <th className='text-left p-2'>Status</th>
                <th className='text-left p-2'>Fee</th>
                <th className='text-left p-2'>Payment Terms</th>
                <th className='text-left p-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitedArtists.map((booking) => (
                <tr key={booking.id} className='border-b bg-black'>
                  <td className='p-2'>{booking.artist_name}</td>
                  <td className='p-2'>{booking.status}</td>
                  <td className='p-2'>{booking.fee}</td>
                  <td className='p-2'>{booking.payment_terms}</td>
                  <td className='p-2'>
                    {booking.status !== 'Cancelled' && (
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={(e) => {
                          e.preventDefault();
                          cancelBooking(booking.id);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Booking Details for {selectedArtist?.artist_name}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='fee'
                className='block text-sm font-medium text-gray-700'
              >
                Proposed Fee
              </label>
              <Input
                type='number'
                id='fee'
                value={bookingDetails.fee}
                onChange={(e) =>
                  setBookingDetails({ ...bookingDetails, fee: e.target.value })
                }
                placeholder='Enter proposed fee'
              />
            </div>
            <div>
              <label
                htmlFor='payment_terms'
                className='block text-sm font-medium text-gray-700'
              >
                Payment Terms
              </label>
              <Textarea
                id='payment_terms'
                value={bookingDetails.payment_terms}
                onChange={(e) =>
                  setBookingDetails({
                    ...bookingDetails,
                    payment_terms: e.target.value,
                  })
                }
                placeholder='Enter payment terms'
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
            <Button onClick={createBooking}>Create Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
