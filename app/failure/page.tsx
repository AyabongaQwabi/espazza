'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function PaymentFailurePage() {
  const router = useRouter();

  return (
    <div className='container mx-auto py-12 px-4'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='flex items-center text-red-600'>
            <AlertTriangle className='h-6 w-6 mr-2' />
            Payment Failed
          </CardTitle>
          <CardDescription>We couldn't process your payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-4'>
            <p className='mb-2'>There was an issue processing your payment.</p>
            <p className='text-sm text-muted-foreground'>
              This could be due to insufficient funds, incorrect card details,
              or a temporary issue with the payment provider.
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-center gap-4'>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/releases')}
          >
            My Releases
          </Button>
          <Button onClick={() => router.push('/releases')}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
