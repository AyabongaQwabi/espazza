'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function TicketPurchaseCancel() {
  const router = useRouter();

  return (
    <div className='container mx-auto p-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>Purchase Cancelled</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <AlertCircle className='h-16 w-16 text-yellow-500 mb-4' />
          <p className='text-zinc-400 text-center mb-6'>
            You've cancelled the ticket purchase process. No payment has been processed.
          </p>
          <div className='flex gap-4'>
            <Button
              onClick={() => window.history.back()}
              className='bg-red-600 hover:bg-red-700'
            >
              Try Again
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push('/events')}
            >
              Browse Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}