'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import short from 'short-uuid';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const EVENT_CREATION_FEE = 100; // R100 in ZAR

export default function EventPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const eventId = searchParams.get('eventId');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  async function fetchEventDetails() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch event details. Please try again.',
        variant: 'destructive',
      });
    } else {
      setEvent(data);
    }
  }

  async function handlePayment() {
    if (!event) return;

    setLoading(true);

    try {
      const newTransactionId =
        transactionId || short().toUUID(short.generate());
      const totalPrice = EVENT_CREATION_FEE * 100; // Convert to cents
      const request = {
        entityID: event.id,
        externalEntityID: event.id,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: 'https://espazza.xyz/dashboard/events',
        description: `Event creation fee for ${event.name}`,
        paymentReference: `${event.organizer_id}-${event.id}`,
        mode: 'live',
        externalTransactionID: newTransactionId,
        urls: {
          callbackUrl: 'https://espazza.xyz/api/payment/callback',
          successPageUrl: `https://espazza.xyz/dashboard/events/payment/success?transaction_id=${newTransactionId}`,
          failurePageUrl:
            'https://espazza.xyz/dashboard/events/payment/failure',
          cancelUrl: 'https://espazza.xyz/dashboard/events',
        },
      };

      const response = await axios.post('/api/payment', request);

      if (response.data?.paylinkUrl) {
        // Create payment record
        const { error: purchaseError } = await supabase
          .from('event_purchases')
          .insert([
            {
              event_id: event.id,
              user_id: event.organizer_id,
              amount: totalPrice,
              transaction_id: transactionId,
              purchase_date: new Date(),
              status: 'pending',
              purchase_type: 'event-creation',
            },
          ]);

        if (purchaseError) throw purchaseError;

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
    } finally {
      setLoading(false);
    }
  }

  if (!event) {
    return <div className='p-4'>Loading event details...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Event Creation Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4'>Event Name: {event.name}</p>
          <p className='mb-4'>Creation Fee: R{EVENT_CREATION_FEE.toFixed(2)}</p>
          <p className='text-sm text-gray-500'>
            This fee is required to create your event on our platform.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePayment} disabled={loading} className='w-full'>
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
