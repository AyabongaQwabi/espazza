'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function SuccessPage() {
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPurchaseDetails() {
      if (!transactionId) return;

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching purchase details:', error);
      } else {
        setPurchaseDetails(data);
      }
      setLoading(false);
    }

    fetchPurchaseDetails();
  }, [transactionId, supabase]);

  if (loading) {
    return <div className='text-center mt-8'>Loading purchase details...</div>;
  }

  if (!purchaseDetails) {
    return <div className='text-center mt-8'>Purchase details not found.</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='max-w-lg mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl text-center text-green-600'>
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center mb-4'>
            Thank you for your purchase. Your transaction has been completed
            successfully.
          </p>
          <div className='space-y-2'>
            <p>
              <strong>Transaction ID:</strong> {transactionId}
            </p>
            <p>
              <strong>Release:</strong> {purchaseDetails.release.title}
            </p>
            <p>
              <strong>Amount:</strong> R{purchaseDetails.amount.toFixed(2)}
            </p>
            <p>
              <strong>Purchase Date:</strong>{' '}
              {new Date(purchaseDetails.created_at).toLocaleString()}
            </p>
          </div>
          <div className='mt-6 text-center'>
            <Link href='/releases'>
              <Button>Back to Releases</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default () => {
  return (
    <Suspense fallback={<Loader2 className='h-12 w-12 text-white' />}>
      <SuccessPage />
    </Suspense>
  );
};
