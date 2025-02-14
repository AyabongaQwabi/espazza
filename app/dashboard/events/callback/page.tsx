'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EventPaymentCallback() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get payment status from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const transactionId = urlParams.get('transactionId');

        if (status === 'success') {
          toast({
            title: 'Payment Successful',
            description: 'Your event has been created successfully.',
          });
          router.push('/dashboard/events/success');
        } else {
          toast({
            title: 'Payment Failed',
            description: 'There was an issue with your payment.',
            variant: 'destructive',
          });
          router.push('/dashboard/events/failure');
        }
      } catch (error) {
        console.error('Error processing payment callback:', error);
        router.push('/dashboard/events/failure');
      }
    };

    processCallback();
  }, [router]);

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Processing Payment</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-red-600 mb-4' />
          <p className='text-zinc-400 text-center'>
            Please wait while we process your payment...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}