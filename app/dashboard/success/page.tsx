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
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!transactionId) return;

      const { data, error } = await supabase
        .from('video_promotion_queue')
        .select('*, profiles(artist_name)')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching Promo Vid details:', error);
      } else {
        setOrderDetails(data);

        // Update the order status to 'paid'
        const { error: updateError } = await supabase
          .from('video_promotion_queue')
          .update({ status: 'pending' })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error('Error updating Promo Vid status:', updateError);
        }
      }
      setLoading(false);
    }

    fetchOrderDetails();
  }, [transactionId, supabase]);

  if (loading) {
    return <div className='text-center mt-8'>Loading order details...</div>;
  }

  if (!orderDetails) {
    return <div className='text-center mt-8'>Order details not found.</div>;
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
            Thank you for your Promnotion. Your video has been added to the
            Queue, please wait 15 minutes.
          </p>
          <div className='space-y-2'>
            <p>
              <strong>Transaction ID:</strong> {transactionId}
            </p>
            <p>
              <strong>Youtube Link:</strong> #{orderDetails.youtube_link}
            </p>
            <p>
              <strong>Description:</strong> {orderDetails.promotional_text}
            </p>
            <p>
              <strong>username:</strong> {orderDetails.username}
            </p>
          </div>
          <div className='mt-6 text-center'>
            <Link href='/dashbaord'>
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPageWrapper() {
  return (
    <Suspense
      fallback={<Loader2 className='h-12 w-12 animate-spin mx-auto mt-8' />}
    >
      <SuccessPage />
    </Suspense>
  );
}
