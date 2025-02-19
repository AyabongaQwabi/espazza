'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function FailurePage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error') || 'An unknown error occurred';

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='max-w-lg mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl text-center text-red-600'>
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center mb-4'>
            We're sorry, but your payment could not be processed.
          </p>
          <p className='text-center mb-6'>Error: {errorMessage}</p>
          <div className='flex justify-center space-x-4'>
            <Link href='/releases'>
              <Button variant='outline'>Back to Releases</Button>
            </Link>
            <Button>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default () => {
  return (
    <Suspense fallback={<Loader2 className='h-12 w-12 text-white' />}>
      <FailurePage />
    </Suspense>
  );
};
