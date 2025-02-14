'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Suspense } from 'react';

function EventPaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <CheckCircle className='h-16 w-16 text-green-500 mb-4' />
          <p className='text-zinc-400 text-center mb-6'>
            Your event has been created successfully. You can now start managing
            your event and inviting artists.
          </p>
          <div className='flex gap-4'>
            <Button
              onClick={() => router.push('/dashboard/events')}
              className='bg-red-600 hover:bg-red-700'
            >
              View Events
            </Button>
            <Button variant='outline' onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventPaymentSuccess />
    </Suspense>
  );
};
