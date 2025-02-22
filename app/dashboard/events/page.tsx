'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  SearchIcon,
  InfoIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EVENTS_PER_PAGE = 12;

export default function EventsPage({
  searchParams,
}: {
  searchParams: { page?: string; province?: string; town?: string };
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [provinces, setProvinces] = useState([]);
  const [towns, setTowns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const currentPage = Number(searchParams.page) || 1;
  const selectedProvince = searchParams.province || '';
  const selectedTown = searchParams.town || '';

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    const end = start + EVENTS_PER_PAGE - 1;

    let query = supabase.from('events').select(
      `
        *,
        venues(*),
        south_african_towns!inner(*),
        profiles!organizer_id(*)
      `,
      { count: 'exact' }
    );

    if (selectedProvince) {
      query = query.eq('south_african_towns.province', selectedProvince);
    }

    if (selectedTown) {
      query = query.eq('town_id', selectedTown);
    }

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const {
      data: events,
      count,
      error,
    } = await query.order('date', { ascending: true }).range(start, end);

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(events || []);
      setTotalPages(Math.ceil((count || 0) / EVENTS_PER_PAGE));
    }
    setLoading(false);
  }, [currentPage, selectedProvince, selectedTown, searchTerm, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function fetchLocations() {
    const { data: townsData } = await supabase
      .from('south_african_towns')
      .select('*')
      .order('name');

    if (townsData) {
      const uniqueProvinces = [
        ...new Set(townsData.map((town) => town.province)),
      ];
      setProvinces(uniqueProvinces);
      setTowns(townsData);
    }
  }

  if (loading) {
    return <div className='p-4'>Loading events...</div>;
  }

  return (
    <div className='min-h-screen bg-black pt-24'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Iziganeko
          </h1>
          <p className='text-zinc-400 text-lg'>Discover Upcoming Events</p>
        </div>

        <Alert className='mb-8'>
          <InfoIcon className='h-4 w-4' />
          <AlertTitle>Ticket Verification</AlertTitle>
          <AlertDescription>
            Organizers can verify tickets at the door by scanning the QR code on
            each ticket. The QR code will lead to a verification page showing
            ticket details.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <div className='flex flex-col md:flex-row gap-4 mb-8'>
          <div className='flex-1'>
            <div className='relative'>
              <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search events...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          <Select
            value={selectedProvince}
            onValueChange={(value) => {
              const url = new URL(window.location.href);
              url.searchParams.set('province', value);
              url.searchParams.delete('town');
              url.searchParams.set('page', '1');
              window.history.pushState({}, '', url);
              window.location.reload();
            }}
          >
            <SelectTrigger className='w-full md:w-[200px]'>
              <SelectValue placeholder='Filter by Province' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Provinces</SelectItem>
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedTown}
            onValueChange={(value) => {
              const url = new URL(window.location.href);
              url.searchParams.set('town', value);
              url.searchParams.set('page', '1');
              window.history.pushState({}, '', url);
              window.location.reload();
            }}
          >
            <SelectTrigger className='w-full md:w-[200px]'>
              <SelectValue placeholder='Filter by Town' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Towns</SelectItem>
              {towns
                .filter(
                  (town) =>
                    !selectedProvince || town.province === selectedProvince
                )
                .map((town) => (
                  <SelectItem key={town.id} value={town.id}>
                    {town.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/events/${event.id}`}>
                <div className='bg-zinc-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300'>
                  {event.cover_image && (
                    <div className='relative h-48'>
                      <img
                        src={event.cover_image || '/placeholder.svg'}
                        alt={event.name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <div className='p-6'>
                    <h2 className='text-xl font-bold text-white mb-2'>
                      {event.name}
                    </h2>
                    <div className='space-y-2 text-zinc-400'>
                      <div className='flex items-center'>
                        <CalendarIcon className='w-4 h-4 mr-2' />
                        {format(new Date(event.date), 'PPP')}
                      </div>
                      <div className='flex items-center'>
                        <MapPinIcon className='w-4 h-4 mr-2' />
                        {event.venues?.name}, {event.south_african_towns?.name}
                      </div>
                      <div className='flex items-center'>
                        <TicketIcon className='w-4 h-4 mr-2' />
                        {event.ticket_price ? `R${event.ticket_price}` : 'Free'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-12'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/events?page=${currentPage - 1}${
                      selectedProvince ? `&province=${selectedProvince}` : ''
                    }${selectedTown ? `&town=${selectedTown}` : ''}`}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`/events?page=${page}${
                          selectedProvince
                            ? `&province=${selectedProvince}`
                            : ''
                        }${selectedTown ? `&town=${selectedTown}` : ''}`}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={`/events?page=${currentPage + 1}${
                      selectedProvince ? `&province=${selectedProvince}` : ''
                    }${selectedTown ? `&town=${selectedTown}` : ''}`}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
