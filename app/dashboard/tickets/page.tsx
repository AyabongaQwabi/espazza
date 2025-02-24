'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Calendar, QrCode } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import QRCode from 'qrcode.react';
import Image from 'next/image';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tickets, error } = await supabase
      .from('event_tickets')
      .select(
        `
        *,
        events (
          name,
          date,
          venue,
          cover_image,
          organizer_id,
          profiles:organizer_id (username, artist_name)
        )
      `
      )
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

  function createPayloadToSign(urlPath: string, body = '') {
    try {
      const parsedUrl = url.parse(urlPath);
      const basePath = parsedUrl.path;
      if (!basePath) throw new Error('No basePath in url');
      const payload = basePath + body;
      return jsStringEscape(payload);
    } catch (error) {
      console.error('Error on createPayloadToSign:', error);
      return '';
    }
  }

  function jsStringEscape(str: string) {
    return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }

  async function handleCompletePayment(ticket) {
    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = ticket.total_price * 100; // Convert to cents

      const request = {
        entityID: ticket.event_id,
        externalEntityID: ticket.id,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/tickets',
        description: `Payment for ticket to ${ticket.events.name}`,
        paymentReference: `${ticket.buyer_id}-${ticket.id}`,
        mode: 'sandbox',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/api/payment/callback',
          successPageUrl: `https://espazza.co.za/tickets/success?transaction_id=${transactionId}`,
          failurePageUrl: 'https://espazza.co.za/tickets/failure',
          cancelUrl: 'https://espazza.co.za/tickets',
        },
      };

      const requestBody = JSON.stringify(request);
      const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
      const signature = crypto
        .HmacSHA256(payloadToSign, APPLICATION_KEY.trim())
        .toString(crypto.enc.Hex);

      const response = await axios.post('/api/payment', request);

      if (response.data?.paylinkUrl) {
        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    }
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
                      Organized by:{' '}
                      {ticket.events.profiles.artist_name ||
                        ticket.events.profiles.username}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Quantity: {ticket.quantity}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Total: R{ticket.total_price}
                    </p>
                  </div>
                </div>
                <div className='flex justify-between items-center mt-4'>
                  {ticket.status === 'pending' && (
                    <Button onClick={() => handleCompletePayment(ticket)}>
                      Pay Now
                    </Button>
                  )}
                  {ticket.status === 'confirmed' && (
                    <Button onClick={() => setSelectedTicket(ticket)}>
                      <QrCode className='mr-2 h-4 w-4' />
                      View QR Code
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket QR Code</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className='flex flex-col items-center'>
              <div className='relative'>
                <QRCode
                  value={`${process.env.NEXT_PUBLIC_BASE_URL}/verify-ticket/${selectedTicket.id}`}
                  size={256}
                  level='H'
                  includeMargin={true}
                />
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <Image
                    src='/logo.png'
                    alt='Logo'
                    width={64}
                    height={64}
                    className='opacity-50'
                  />
                </div>
              </div>
              <p className='mt-4 text-center'>
                Event: {selectedTicket.events.name}
                <br />
                Date: {format(new Date(selectedTicket.events.date), 'PPP')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
