import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Updated to use the new Checkout API
const API_ENDPOINT = 'https://payments.yoco.com/api/checkouts';
const SECRET_KEY = process.env.YOCO_SECRET_KEY?.trim();

export async function POST(request: Request) {
  try {
    if (!SECRET_KEY) {
      throw new Error('Missing Yoco API credentials');
    }
    console.log('Yoco API credentials available');

    const body = await request.json();
    console.log('Payment API request body:', body);

    // Validate required fields
    if (!body.amountInCents || !body.currency) {
      throw new Error('Missing required fields: amountInCents or currency');
    }

    // Get the base URL for success/failure/cancel redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://espazza.co.za';

    // Create the checkout session payload
    const payload = {
      amount: body.amountInCents,
      currency: body.currency,
      cancelUrl: `${baseUrl}/cancel?transaction_id=${body.transactionId}`,
      successUrl: `${baseUrl}/releases/success?transaction_id=${body.transactionId}`,
      failureUrl: `${baseUrl}/failure?transaction_id=${body.transactionId}`,
      metadata: {
        releaseId: body.releaseId || '',
        userId: body.userId || '',
        transactionId: body.transactionId || '',
        description: body.description || 'Release listing payment',
      },
    };

    // Create the checkout session
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });

    console.log('Yoco Checkout API response:', response.data);

    // Create a pending purchase record in the database
    if (body.releaseId && body.userId && body.transactionId) {
      const supabase = createClientComponentClient();
      const { error } = await supabase.from('purchases').insert([
        {
          release_id: body.releaseId,
          user_id: body.userId,
          amount: body.amountInCents / 100, // Convert cents to currency units
          transaction_id: body.transactionId,
          purchase_date: new Date(),
          status: 'pending',
          purchase_type: 'release',
          payment_method: 'yoco',
          checkout_id: response.data.id,
        },
      ]);

      if (error) {
        console.error('Error creating purchase record:', error);
      }
    }

    return NextResponse.json({
      redirectUrl: response.data.redirectUrl,
      checkoutId: response.data.id,
      status: response.data.status,
    });
  } catch (error) {
    console.error('Payment API error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);

        return NextResponse.json(
          {
            error: 'Payment API request failed',
            details: error.response.data,
            status: error.response.status,
          },
          { status: error.response.status }
        );
      } else if (error.request) {
        console.error('No response received:', error.request);
        return NextResponse.json(
          { error: 'No response received from Payment API' },
          { status: 503 }
        );
      } else {
        console.error('Error message:', error.message);
        return NextResponse.json(
          { error: 'Error setting up the request', message: error.message },
          { status: 500 }
        );
      }
    } else {
      console.error('Non-Axios error:', error);
      return NextResponse.json(
        {
          error: 'An unexpected error occurred',
          message: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
}
