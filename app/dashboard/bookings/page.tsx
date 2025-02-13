'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  MessageSquareIcon,
} from 'lucide-react';

type Booking = {
  id: string;
  event_name: string;
  organizer_name: string;
  event_date: string;
  venue: string;
  fee: number;
  payment_terms: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  created_at: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        events (name, date, venue),
        profiles!organizer_id (username)
      `
      )
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(
        data.map((booking: any) => ({
          id: booking.id,
          event_name: booking.events.name,
          organizer_name: booking.profiles.username,
          event_date: booking.events.date,
          venue: booking.events.venue,
          fee: booking.fee,
          payment_terms: booking.payment_terms,
          status: booking.status,
          created_at: booking.created_at,
        }))
      );
    }
    setLoading(false);
  }

  async function handleStatusChange(
    bookingId: string,
    newStatus: 'Approved' | 'Rejected'
  ) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status. Please try again.',
        variant: 'destructive',
      });
    } else {
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
      toast({
        title: 'Success',
        description: `Booking ${newStatus.toLowerCase()} successfully.`,
      });
    }
  }

  async function handleSendMessage() {
    if (!selectedBooking || !message.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedBooking.organizer_id,
        content: message,
        booking_id: selectedBooking.id,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });
      setMessage('');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div className='p-4'>Loading bookings...</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Bookings Dashboard</h1>

      <Tabs defaultValue='pending' className='w-full'>
        <TabsList>
          <TabsTrigger value='pending'>Pending Requests</TabsTrigger>
          <TabsTrigger value='approved'>Approved Bookings</TabsTrigger>
          <TabsTrigger value='past'>Past Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value='pending'>
          <BookingsList
            bookings={bookings.filter((b) => b.status === 'Pending')}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>
        <TabsContent value='approved'>
          <BookingsList
            bookings={bookings.filter((b) => b.status === 'Approved')}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>
        <TabsContent value='past'>
          <BookingsList
            bookings={bookings.filter((b) => b.status === 'Completed')}
            onStatusChange={handleStatusChange}
            onSelectBooking={setSelectedBooking}
          />
        </TabsContent>
      </Tabs>

      <Dialog>
        <DialogTrigger asChild>
          <Button className='mt-4'>View Earnings Analytics</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Earnings Analytics</DialogTitle>
            <DialogDescription>
              Here's a summary of your bookings and earnings.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Bookings
                </CardTitle>
                <CalendarIcon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{bookings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Earnings
                </CardTitle>
                <DollarSignIcon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  $
                  {bookings
                    .reduce((sum, booking) => sum + booking.fee, 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Pending Payments
                </CardTitle>
                <DollarSignIcon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  $
                  {bookings
                    .filter((b) => b.status === 'Approved')
                    .reduce((sum, booking) => sum + booking.fee, 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message Organizer</DialogTitle>
              <DialogDescription>
                Send a message to {selectedBooking.organizer_name} about the
                event "{selectedBooking.event_name}".
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Type your message here...'
              className='min-h-[100px]'
            />
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BookingsList({
  bookings,
  onStatusChange,
  onSelectBooking,
}: {
  bookings: Booking[];
  onStatusChange: (id: string, status: 'Approved' | 'Rejected') => void;
  onSelectBooking: (booking: Booking) => void;
}) {
  return (
    <div className='space-y-4'>
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader>
            <CardTitle>{booking.event_name}</CardTitle>
            <CardDescription>
              Organized by {booking.organizer_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-2'>
              <div className='flex items-center'>
                <CalendarIcon className='mr-2 h-4 w-4' />
                {format(new Date(booking.event_date), 'PPP')}
              </div>
              <div className='flex items-center'>
                <MapPinIcon className='mr-2 h-4 w-4' />
                {booking.venue}
              </div>
              <div className='flex items-center'>
                <DollarSignIcon className='mr-2 h-4 w-4' />
                Fee: ${booking.fee} ({booking.payment_terms})
              </div>
              <div className='flex items-center'>
                <Badge
                  variant={booking.status === 'Pending' ? 'outline' : 'default'}
                >
                  {booking.status}
                </Badge>
              </div>
            </div>
          </CardContent>
          <div className='flex justify-end p-4 space-x-2'>
            <Button variant='outline' onClick={() => onSelectBooking(booking)}>
              <MessageSquareIcon className='mr-2 h-4 w-4' />
              Message Organizer
            </Button>
            {booking.status === 'Pending' && (
              <>
                <Button onClick={() => onStatusChange(booking.id, 'Approved')}>
                  Approve
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => onStatusChange(booking.id, 'Rejected')}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
