'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function VerifyTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    verifyTicket();
  }, []);

  async function verifyTicket() {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select(
          `
          *,
          events (
            name,
            date,
            venues(*),
            profiles:organizer_id (username, artist_name)
          ),
          profiles:buyer_id (username, full_name)
        `
        )
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data) {
        setTicket(data);
      } else {
        setError('Ticket not found');
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setError('Failed to verify ticket');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-red-500'>{error}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isValid = ticket.status === 'confirmed';

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-200'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-2xl'
      >
        <Card className='shadow-lg'>
          <CardHeader className='relative'>
            <Image
              src='/logo.png'
              alt='Logo'
              width={100}
              height={100}
              className='absolute top-4 left-4'
            />
            <CardTitle className='text-center text-3xl mb-2 pt-16'>
              Ticket Verification
            </CardTitle>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              className='flex justify-center mb-4'
            >
              {isValid ? (
                <CheckCircle2 className='text-green-500 w-24 h-24' />
              ) : (
                <XCircle className='text-red-500 w-24 h-24' />
              )}
            </motion.div>
            <Badge
              variant={isValid ? 'info' : 'destructive'}
              className={`mx-auto text-lg py-1 px-3 ${
                isValid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isValid ? 'VALID TICKET' : 'INVALID TICKET'}
            </Badge>
          </CardHeader>
          <CardContent className='text-center'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className='text-2xl font-bold mb-4'>{ticket.events.name}</h2>
              <div className='space-y-2'>
                <p className='text-xl'>
                  <strong>Buyer:</strong> @
                  {ticket.profiles.full_name || ticket.profiles.username}
                </p>
                <p className='text-xl'>
                  <strong>Number of Seats:</strong> {ticket.quantity}
                </p>
                <p className='text-xl'>
                  <strong>Purchase Date:</strong>{' '}
                  {format(new Date(ticket.created_at), 'PPP')}
                </p>
                <p className='text-xl'>
                  <strong>Event Date:</strong>{' '}
                  {format(new Date(ticket.events.date), 'PPP')}
                </p>
                <p className='text-xl'>
                  <strong>Venue:</strong> {ticket.events.venues.name}
                </p>
                <p className='text-xl'>
                  <strong>Organizer:</strong>{' '}
                  {ticket.events.profiles.artist_name ||
                    ticket.events.profiles.username}
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
