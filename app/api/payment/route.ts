import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_PUBLIC_IKHOKA_APP_ID?.trim();
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY?.trim();

function createPayloadToSign(urlPath: string, body = '') {
  try {
    const parsedUrl = url.parse(urlPath);
    const basePath = parsedUrl.path;
    if (!basePath) throw new Error('No basePath in URL');
    const payload = basePath + body;
    return jsStringEscape(payload);
  } catch (error) {
    console.error('Error in createPayloadToSign:', error);
    throw error;
  }
}

function jsStringEscape(str: string) {
  return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

export async function POST(request: Request) {
  try {
    if (!APPLICATION_ID || !APPLICATION_KEY) {
      throw new Error('Missing iKhokha API credentials');
    }

    const body = await request.json();
    console.log('Payment API request body:', body);

    let requestBody = JSON.stringify(body);
    if (requestBody.startsWith("'") && requestBody.endsWith("'")) {
      requestBody = requestBody.substring(1, requestBody.length - 1);
    }

    const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
    console.log('Payload to sign:', payloadToSign);

    const signature = crypto
      .HmacSHA256(payloadToSign, APPLICATION_KEY.trim())
      .toString(crypto.enc.Hex);

    console.log('Signature:', signature);

    const response = await axios.post(API_ENDPOINT, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'IK-APPID': APPLICATION_ID.trim(),
        'IK-SIGN': signature.trim(),
      },
    });

    console.log('Payment API response:', response.data);
    return NextResponse.json(response.data);
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
