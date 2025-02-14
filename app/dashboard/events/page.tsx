'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Edit, Search } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import short from 'short-uuid';
import { format } from 'date-fns';

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [towns, setTowns] = useState([]);
  const [newVenue, setNewVenue] = useState('');
  const [newTown, setNewTown] = useState({ name: '', province: '' });
  const [searchVenue, setSearchVenue] = useState('');
  const [searchTown, setSearchTown] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    venue: '',
    town_id: '',
    date: new Date(),
    budget: '',
    status: 'unpaid',
    ticketPrice: '',
    maxAttendees: '',
    coverImage: '',
  });

  const router = useRouter();

  const fetchEvents = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('events')
      .select('*, south_african_towns(name)')
      .eq('organizer_id', user.id)
      .order('date', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, [router, search]);

  const fetchVenues = useCallback(async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching venues:', error);
    } else {
      setVenues(data || []);
    }
  }, []);

  const fetchTowns = useCallback(async () => {
    const { data, error } = await supabase
      .from('south_african_towns')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching towns:', error);
    } else {
      setTowns(data || []);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchVenues();
    fetchTowns();
  }, [fetchEvents, fetchVenues, fetchTowns]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const eventId = short.generate();
    const transactionId = short.generate();

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            ...newEvent,
            id: eventId,
            organizer_id: user.id,
          },
        ])
        .select();

      if (error) throw error;

      setEvents([...events, data[0]]);
      setNewEvent({
        name: '',
        description: '',
        venue: '',
        town_id: '',
        date: new Date(),
        budget: '',
        status: 'unpaid',
        ticketPrice: '',
        maxAttendees: '',
        coverImage: '',
      });
      setIsDialogOpen(false);

      // Redirect to payment page
      router.push(
        `/dashboard/events/payment?eventId=${eventId}&transactionId=${transactionId}`
      );

      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddVenue = async () => {
    if (!newVenue.trim()) return;

    const { data, error } = await supabase
      .from('venues')
      .insert([{ name: newVenue }])
      .select();

    if (error) {
      console.error('Error adding venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to add venue. Please try again.',
        variant: 'destructive',
      });
    } else {
      setVenues([...venues, data[0]]);
      setNewVenue('');
      toast({
        title: 'Success',
        description: 'Venue added successfully!',
      });
    }
  };

  const handleAddTown = async () => {
    if (!newTown.name.trim() || !newTown.province.trim()) return;

    const { data, error } = await supabase
      .from('south_african_towns')
      .insert([newTown])
      .select();

    if (error) {
      console.error('Error adding town:', error);
      toast({
        title: 'Error',
        description: 'Failed to add town. Please try again.',
        variant: 'destructive',
      });
    } else {
      setTowns([...towns, data[0]]);
      setNewTown({ name: '', province: '' });
      toast({
        title: 'Success',
        description: 'Town added successfully!',
      });
    }
  };

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(searchVenue.toLowerCase())
  );

  const filteredTowns = towns.filter((town) =>
    town.name.toLowerCase().includes(searchTown.toLowerCase())
  );

  if (loading) {
    return <div className='p-4'>Loading events...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Events Management</h1>

      <div className='flex justify-between items-center mb-6'>
        <div className='relative w-64'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search events...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10'
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
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
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Venue</label>
                <div className='flex space-x-2'>
                  <Select
                    value={newEvent.venue}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, venue: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Venue' />
                    </SelectTrigger>
                    <SelectContent>
                      <div className='flex items-center px-2 pb-2'>
                        <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                        <Input
                          placeholder='Search venue...'
                          value={searchVenue}
                          onChange={(e) => setSearchVenue(e.target.value)}
                          className='h-8 w-full'
                        />
                      </div>
                      {filteredVenues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id.toString()}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type='button'>Add New Venue</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Venue</DialogTitle>
                      </DialogHeader>
                      <Input
                        placeholder='Venue Name'
                        value={newVenue}
                        onChange={(e) => setNewVenue(e.target.value)}
                      />
                      <Button onClick={handleAddVenue}>Add Venue</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Town</label>
                <div className='flex space-x-2'>
                  <Select
                    value={newEvent.town_id}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, town_id: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Town' />
                    </SelectTrigger>
                    <SelectContent>
                      <div className='flex items-center px-2 pb-2'>
                        <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                        <Input
                          placeholder='Search town...'
                          value={searchTown}
                          onChange={(e) => setSearchTown(e.target.value)}
                          className='h-8 w-full'
                        />
                      </div>
                      {filteredTowns.map((town) => (
                        <SelectItem key={town.id} value={town.id.toString()}>
                          {town.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type='button'>Add New Town</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Town</DialogTitle>
                      </DialogHeader>
                      <Input
                        placeholder='Town Name'
                        value={newTown.name}
                        onChange={(e) =>
                          setNewTown({ ...newTown, name: e.target.value })
                        }
                      />
                      <Select
                        value={newTown.province}
                        onValueChange={(value) =>
                          setNewTown({ ...newTown, province: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select Province' />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Eastern Cape',
                            'Free State',
                            'Gauteng',
                            'KwaZulu-Natal',
                            'Limpopo',
                            'Mpumalanga',
                            'Northern Cape',
                            'North West',
                            'Western Cape',
                          ].map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddTown}>Add Town</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
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
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Cover Image</label>
                <ImageUploader
                  onUploadComplete={(urls) =>
                    setNewEvent({ ...newEvent, coverImage: urls[0] })
                  }
                  maxSizeInMB={5}
                />
              </div>
              <Button type='submit'>Create Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Town</TableHead>
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
              <TableCell>{event.south_african_towns?.name}</TableCell>
              <TableCell>
                {event.ticketPrice ? `$${event.ticketPrice}` : 'Free'}
              </TableCell>
              <TableCell>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => router.push(`/dashboard/events/${event.id}`)}
                >
                  <Edit className='h-4 w-4 mr-1' /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
