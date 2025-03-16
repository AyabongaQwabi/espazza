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
        .from('orders')
        .select('*, product:products (*)')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
      } else {
        setOrderDetails(data);

        // Update the order status to 'paid'
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error('Error updating order status:', updateError);
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
            Thank you for your purchase. Your order has been confirmed and paid.
          </p>
          <div className='space-y-2'>
            <p>
              <strong>Transaction ID:</strong> {transactionId}
            </p>
            <p>
              <strong>Order Code:</strong> #{orderDetails.code?.toUpperCase()}
            </p>
            <p>
              <strong>Product:</strong> {orderDetails.product.name}
            </p>
            <p>
              <strong>Quantity:</strong> {orderDetails.quantity}
            </p>
            <p>
              <strong>Total Amount:</strong> R
              {(orderDetails.total_amount / 100).toFixed(2)}
            </p>
            <p>
              <strong>Order Date:</strong>{' '}
              {new Date(orderDetails.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Delivery Address:</strong> {orderDetails.delivery_address}
            </p>
            <p>
              <strong>Recipient:</strong> {orderDetails.delivery_person}
            </p>
            <p>
              <strong>Contact Number:</strong>{' '}
              {orderDetails.delivery_contact_number}
            </p>
          </div>
          <div className='mt-6 text-center'>
            <Link href='/merch'>
              <Button>Back to Merchandise</Button>
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
