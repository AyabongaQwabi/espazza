import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='max-w-lg mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl text-center text-yellow-600'>
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center mb-6'>
            Your payment has been cancelled. No charges have been made to your
            account.
          </p>
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
