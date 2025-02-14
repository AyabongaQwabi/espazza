'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';

export default function TicketPurchaseCallback() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const transactionId = urlParams.get('transactionId');

        if (!transactionId) {
          throw new Error('No transaction ID found');
        }

        // Get ticket record
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('*, events(*)')
          .eq('transaction_id', transactionId)
          .single();

        if (!ticket) {
          throw new Error('No ticket found for this transaction');
        }

        if (status === 'success') {
          // Update ticket status to confirmed
          await supabase
            .from('event_tickets')
            .update({ status: 'confirmed' })
            .eq('transaction_id', transactionId);

          // Update event available tickets
          await supabase.rpc('decrease_available_tickets', {
            event_id: ticket.event_id,
            quantity: ticket.quantity
          });

          router.push('/events/ticket/success');
        } else {
          // Delete the ticket record on failure
          await supabase
            .from('event_tickets')
            .delete()
            .eq('transaction_id', transactionId);

          router.push('/events/ticket/failure');
        }
      } catch (error) {
        console.error('Error processing ticket callback:', error);
        toast({
          title: 'Error',
          description: 'Failed to process ticket purchase.',
          variant: 'destructive',
        });
        router.push('/events/ticket/failure');
      }
    };

    processCallback();
  }, [router]);

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Processing Purchase</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-red-600 mb-4' />
          <p className='text-zinc-400 text-center'>
            Please wait while we process your ticket purchase...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}