import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_PUBLIC_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;

function createPayloadToSign(urlPath: string, body = '') {
  try {
    const parsedUrl = url.parse(urlPath);
    const basePath = parsedUrl.path;
    if (!basePath) throw new Error('No basePath in URL');
    const payload = basePath + body;
    return jsStringEscape(payload);
  } catch (error) {
    console.error('Error in createPayloadToSign:', error);
    return '';
  }
}

function jsStringEscape(str: string) {
  try {
    return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  } catch (error) {
    console.error('Error in jsStringEscape:', error);
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('\n\nPayment API request body:', body);

    const requestBody = JSON.stringify(body);
    const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
    const signature = crypto
      .HmacSHA256(payloadToSign, APPLICATION_KEY)
      .toString(crypto.enc.Hex);

    console.log('\n\nPayload to sign:', payloadToSign);
    console.log('\n\nSignature:', signature);

    const response = await axios.post(API_ENDPOINT, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json', // ✅ Ensure proper Content-Type
        'IK-APPID': APPLICATION_ID,
        'IK-SIGN': signature,
      },
    });

    console.log('Payment API response:', response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Payment API error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
}
