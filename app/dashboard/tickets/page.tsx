'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tickets, error } = await supabase
      .from('event_tickets')
      .select(`
        *,
        events (
          name,
          date,
          venue,
          cover_image,
          organizer_id,
          profiles:organizer_id (username, artist_name)
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tickets',
        variant: 'destructive',
      });
    } else {
      setTickets(tickets || []);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-8'>Loading tickets...</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-8'>My Tickets</h1>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Ticket className='h-12 w-12 text-zinc-400 mb-4' />
            <p className='text-zinc-400 text-lg mb-4'>No tickets yet</p>
            <Button asChild>
              <a href='/events'>Browse Events</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>{ticket.events.name}</span>
                  <Badge
                    variant={
                      ticket.status === 'confirmed'
                        ? 'default'
                        : ticket.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-24 h-24 relative'>
                    <img
                      src={ticket.events.cover_image || '/placeholder.svg'}
                      alt={ticket.events.name}
                      className='w-full h-full object-cover rounded'
                    />
                  </div>
                  <div>
                    <div className='flex items-center text-sm text-zinc-400 mb-2'>
                      <Calendar className='w-4 h-4 mr-2' />
                      {format(new Date(ticket.events.date), 'PPP')}
                    </div>
                    <p className='text-sm text-zinc-400'>
                      Organized by: {ticket.events.profiles.artist_name || ticket.events.profiles.username}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Quantity: {ticket.quantity}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Total: R{ticket.total_price}
                    </p>
                  </div>
                </div>
                {ticket.status === 'confirmed' && (
                  <div className='mt-4'>
                    <Button className='w-full'>
                      Download Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}