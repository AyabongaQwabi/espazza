'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Share2 } from 'lucide-react';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import ShortUniqueId from 'short-unique-id';
import {
  OrderDetailsModal,
  type OrderDetails,
} from '@/components/OrderDetailsModal';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;

export default function MerchItemClient({ initialProduct }) {
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const uid = new ShortUniqueId({ length: 10 });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  function createPayloadToSign(urlPath: string, body = '') {
    try {
      const parsedUrl = url.parse(urlPath);
      const basePath = parsedUrl.path;
      if (!basePath) throw new Error('No basePath in url');
      const payload = basePath + body;
      return jsStringEscape(payload);
    } catch (error) {
      console.error('Error on createPayloadToSign:', error);
      return '';
    }
  }

  function jsStringEscape(str: string) {
    return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }

  async function processOrder(orderDetails: OrderDetails) {
    setPurchaseLoading(true);
    setIsOrderModalOpen(false);
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You need to be logged in to make a purchase.',
        variant: 'destructive',
      });
      setPurchaseLoading(false);
      return;
    }

    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = product.price * orderDetails.quantity * 100; // Convert to cents
      const request = {
        entityID: product.id,
        externalEntityID: product.id,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/merch',
        description: `Purchase of ${orderDetails.quantity}x ${product.name}`,
        paymentReference: `${currentUser.id}-${product.id}`,
        mode: 'live',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/api/payment/callback',
          successPageUrl: `https://espazza.co.za/merch/success?transaction_id=${transactionId}`,
          failurePageUrl: 'https://espazza.co.za/failure',
          cancelUrl: 'https://espazza.co.za/cancel',
        },
      };

      const requestBody = JSON.stringify(request);
      const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
      const signature = crypto
        .HmacSHA256(payloadToSign, APPLICATION_KEY.trim())
        .toString(crypto.enc.Hex);

      const response = await axios.post('/api/payment', request);

      if (response.data?.paylinkUrl) {
        // Create purchase record
        const { error: purchaseError } = await supabase
          .from('product_purchases')
          .insert([
            {
              product_id: product.id,
              user_id: currentUser.id,
              amount: totalPrice,
              transaction_id: transactionId,
              purchase_date: new Date(),
              status: 'pending',
            },
          ]);

        if (purchaseError) throw purchaseError;

        // Create order record
        const sixCharOrderCode = uid.rnd(8);
        const { error: orderError } = await supabase.from('orders').insert([
          {
            user_id: currentUser.id,
            product_id: product.id,
            status: 'not-paid',
            total_amount: totalPrice,
            code: sixCharOrderCode,
            transaction_id: transactionId,
            delivery_address: orderDetails.delivery_address,
            delivery_person: orderDetails.delivery_person,
            delivery_notes: orderDetails.delivery_notes,
            delivery_contact_number: orderDetails.delivery_contact_number,
            quantity: orderDetails.quantity,
          },
        ]);

        if (orderError) throw orderError;

        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchaseLoading(false);
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} on eSpazza Merchandise!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: 'Link Copied',
        description: 'The product link has been copied to your clipboard.',
      });
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div>
              <Image
                src={product.images[0] || '/placeholder.svg'}
                alt={product.name}
                width={500}
                height={500}
                className='w-full object-cover rounded-lg'
              />
            </div>
            <div>
              <p className='text-lg mb-4'>{product.description}</p>
              <p className='text-xl font-bold mb-4'>R{product.price}</p>
              <p className='text-sm text-zinc-500 mb-4'>
                Category: {product.product_categories.name}
              </p>
              <div className='flex items-center gap-4 mb-4'>
                <label htmlFor='quantity' className='text-sm font-medium'>
                  Quantity:
                </label>
                <Input
                  id='quantity'
                  type='number'
                  min='1'
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Number.parseInt(e.target.value, 10))
                  }
                  className='w-20'
                />
              </div>
              <div className='flex gap-4'>
                <Button
                  onClick={() => setIsOrderModalOpen(true)}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? 'Processing...' : 'Buy Now'}
                </Button>
                <Button onClick={handleShare} variant='outline'>
                  <Share2 className='h-4 w-4 mr-2' />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <OrderDetailsModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={processOrder}
          productName={product?.name || ''}
          productPrice={product?.price || 0}
        />
      </Card>
    </div>
  );
}
