'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

export default function TicketPurchaseSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const updateTicketStatus = async () => {
      try {
        const transactionId = searchParams.get('transaction_id');

        if (!transactionId) {
          toast({
            title: 'Error',
            description: 'Invalid transaction ID',
            variant: 'destructive',
          });
          router.push('/events');
          return;
        }

        // Get ticket record
        const { data: ticket, error: ticketError } = await supabase
          .from('event_tickets')
          .select('*, events(*)')
          .eq('transaction_id', transactionId)
          .single();

        if (ticketError || !ticket) {
          throw new Error('No ticket found for this transaction');
        }

        // Update ticket status to confirmed
        const { error: updateError } = await supabase
          .from('event_tickets')
          .update({ status: 'confirmed' })
          .eq('transaction_id', transactionId);

        if (updateError) throw updateError;

        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Show success message
        toast({
          title: 'Success',
          description: 'Your ticket has been confirmed!',
        });
      } catch (error) {
        console.error('Error updating ticket status:', error);
        toast({
          title: 'Error',
          description: 'Failed to confirm ticket. Please contact support.',
          variant: 'destructive',
        });
      }
    };

    updateTicketStatus();
  }, [searchParams, router]);

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>
            Ticket Purchase Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <CheckCircle className='h-16 w-16 text-green-500 mb-4' />
          <p className='text-zinc-400 text-center mb-6'>
            Your ticket has been confirmed. You will receive a confirmation
            email shortly.
          </p>
          <div className='flex gap-4'>
            <Button
              onClick={() => router.push('/dashboard/tickets')}
              className='bg-red-600 hover:bg-red-700'
            >
              View My Tickets
            </Button>
            <Button variant='outline' onClick={() => router.push('/events')}>
              Browse More Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
