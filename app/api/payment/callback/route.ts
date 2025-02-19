import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const body = await request.json();
  const searchParams = new URL(request.url).searchParams;

  // Combine body and search params
  const paymentData = {
    body,
    params: Object.fromEntries(searchParams),
  };

  // Save the payment data to Supabase
  const { data, error } = await supabase
    .from('payment_callbacks')
    .insert([paymentData]);

  if (error) {
    console.error('Error saving payment callback data:', error);
    return NextResponse.json(
      { error: 'Failed to save payment data' },
      { status: 500 }
    );
  }

  //   // Update the purchase status
  //   const { error: updateError } = await supabase
  //     .from('purchases')
  //     .update({ status: paymentData.status })
  //     .eq('transaction_id', paymentData.externalTransactionID);

  //   if (updateError) {
  //     console.error('Error updating purchase status:', updateError);
  //     return NextResponse.json(
  //       { error: 'Failed to update purchase status' },
  //       { status: 500 }
  //     );
  //   }

  return NextResponse.json({ success: true });
}
