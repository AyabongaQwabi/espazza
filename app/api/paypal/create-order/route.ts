import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('PayPal API request body:', body);

    const {
      totalPrice,
      currency,
      transactionId,
      artistPaypalClientId,
      artistPaypalSecret,
    } = body;

    if (!artistPaypalClientId || !artistPaypalSecret) {
      throw new Error('Missing PayPal API credentials for artist');
    }

    // Step 1: Get PayPal Access Token
    const authResponse = await axios.post(
      'https://api-m.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        auth: {
          username: artistPaypalClientId.trim(),
          password: artistPaypalSecret.trim(),
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = authResponse.data.access_token;
    console.log('PayPal Access Token:', accessToken);

    // Step 2: Create PayPal Order
    const orderResponse = await axios.post(
      'https://api-m.paypal.com/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: currency, value: totalPrice.toFixed(2) },
          },
        ],
        application_context: {
          return_url: `https://espazza.co.za/releases/success?transaction_id=${transactionId}`,
          cancel_url: 'https://espazza.co.za/cancel',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const approvalUrl = orderResponse.data.links.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      throw new Error('No PayPal approval URL received');
    }

    console.log('PayPal Order Created:', orderResponse.data);
    return NextResponse.json({ approvalUrl });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error Data:', error.response.data);
        return NextResponse.json(
          { error: 'PayPal API request failed', details: error.response.data },
          { status: error.response.status }
        );
      } else if (error.request) {
        return NextResponse.json(
          { error: 'No response from PayPal API' },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { error: 'Request setup error', message: error.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unexpected error', message: (error as Error).message },
        { status: 500 }
      );
    }
  }
}
