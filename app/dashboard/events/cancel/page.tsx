'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function EventPaymentCancel() {
  const router = useRouter();

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <AlertCircle className='h-16 w-16 text-yellow-500 mb-4' />
          <p className='text-zinc-400 text-center mb-6'>
            You've cancelled the payment process. Your event hasn't been created yet.
          </p>
          <div className='flex gap-4'>
            <Button
              onClick={() => router.push('/dashboard/events')}
              className='bg-red-600 hover:bg-red-700'
            >
              Try Again
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}