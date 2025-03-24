'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import short from 'short-uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Tag, Check, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  releaseId: string;
  onPaymentComplete: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  releaseId,
  onPaymentComplete,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validCoupon, setValidCoupon] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState('card');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Load Yoco SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YocoSDK) {
      const script = document.createElement('script');
      script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  // Add this useEffect to add a style to ensure proper z-index for Yoco modal
  useEffect(() => {
    // Add a style to ensure Yoco modal appears on top
    if (open) {
      const style = document.createElement('style');
      style.id = 'yoco-modal-fix';
      style.innerHTML = `
      .yoco-payment-container {
        z-index: 100000 !important;
      }
      
      /* Lower the z-index of our own dialog when Yoco is active */
      [data-radix-popper-content-wrapper] {
        z-index: 50 !important;
      }
      
      /* Ensure the Yoco overlay is above our dialog */
      .yoco-payment-overlay {
        z-index: 99999 !important;
      }
    `;
      document.head.appendChild(style);
    } else {
      // Reset loading state when dialog is closed
      setLoading(false);
    }

    return () => {
      const existingStyle = document.getElementById('yoco-modal-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [open]);

  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const response = await axios.post('/api/coupons/validate', {
        couponCode: couponCode.trim(),
      });

      if (response.data.valid) {
        setValidCoupon(response.data);
        setCouponSuccess(response.data.message);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
        setValidCoupon(null);
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      setCouponError(
        error.response?.data?.error || 'Failed to validate coupon'
      );
      setValidCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCouponPayment = async () => {
    if (!validCoupon) {
      setCouponError('Please enter a valid coupon code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/coupons/redeem', {
        couponId: validCoupon.couponId,
        releaseId,
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Your release has been paid for with the coupon code',
        });
        onPaymentComplete();
        onOpenChange(false);
      } else {
        setCouponError(response.data.error || 'Failed to apply coupon');
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      setCouponError(error.response?.data?.error || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!window.YocoSDK) {
      toast({
        title: 'Error',
        description: 'Payment system is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    // Validate that we have a public key
    const publicKey = process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY;
    if (!publicKey) {
      toast({
        title: 'Configuration Error',
        description:
          'Payment system is not properly configured. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    // Reset loading state first to ensure we're starting fresh
    setLoading(true);
    const transactionId = short().toUUID(short.generate());

    try {
      // Create a new instance each time to ensure it works on reopening
      const yoco = new window.YocoSDK({
        publicKey: publicKey,
      });

      // Temporarily hide our dialog when showing Yoco popup
      const dialogElement = document.querySelector('[role="dialog"]');
      if (dialogElement) {
        dialogElement.setAttribute('data-yoco-active', 'true');
        dialogElement.style.opacity = '0.3';
        dialogElement.style.pointerEvents = 'none';
      }

      // Add a small delay to ensure our modal has fully rendered
      setTimeout(() => {
        yoco.showPopup({
          amountInCents: 2000, // R20.00
          currency: 'ZAR',
          name: 'eSpazza',
          description: 'Release Listing Fee',
          callback: async (result: any) => {
            // Restore our dialog visibility
            if (dialogElement) {
              dialogElement.removeAttribute('data-yoco-active');
              dialogElement.style.opacity = '1';
              dialogElement.style.pointerEvents = 'auto';
            }

            if (result.error) {
              toast({
                title: 'Payment Failed',
                description: result.error.message,
                variant: 'destructive',
              });
              setLoading(false);
              return;
            }

            // Card tokenized successfully
            try {
              // Process payment with our backend
              const response = await axios.post('/api/yoco-payment', {
                token: result.id,
                amountInCents: 2000, // R20.00
                currency: 'ZAR',
                releaseId,
                userId: currentUser?.id,
                transactionId,
                description: 'Release Listing Fee',
              });

              if (response.data.status === 'successful') {
                // Update release payment status in database
                const { error } = await supabase
                  .from('releases')
                  .update({
                    is_paid: true,
                    payment_method: 'yoco',
                    payment_date: new Date().toISOString(),
                    transaction_id: transactionId,
                  })
                  .eq('id', releaseId);

                if (error) {
                  console.error(
                    'Error updating release payment status:',
                    error
                  );
                  toast({
                    title: 'Error',
                    description:
                      'Payment was successful but we could not update your release. Please contact support.',
                    variant: 'destructive',
                  });
                } else {
                  toast({
                    title: 'Payment Successful',
                    description:
                      'Your release has been paid for and is now live!',
                  });
                  onPaymentComplete();
                  onOpenChange(false);
                }
              } else {
                toast({
                  title: 'Payment Failed',
                  description:
                    response.data.displayMessage ||
                    'Payment could not be processed',
                  variant: 'destructive',
                });
              }
            } catch (error: any) {
              console.error('Error processing payment:', error);
              toast({
                title: 'Payment Error',
                description:
                  error.response?.data?.error || 'Failed to process payment',
                variant: 'destructive',
              });
            } finally {
              setLoading(false);
            }
          },
        });
      }, 100);
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Could not initialize payment system',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Release Listing Payment</DialogTitle>
          <DialogDescription>
            Pay R20.00 to list your release on our platform or use a coupon
            code.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue='card'
          value={paymentTab}
          onValueChange={setPaymentTab}
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='card' disabled={loading}>
              <CreditCard className='mr-2 h-4 w-4' />
              Card Payment
            </TabsTrigger>
            <TabsTrigger value='coupon' disabled={loading}>
              <Tag className='mr-2 h-4 w-4' />
              Coupon Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value='card' className='space-y-4 py-4'>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>
                You will be charged R20.00 for listing your release on our
                platform. Click the button below to proceed with the payment.
              </p>

              <div className='rounded-md bg-secondary p-4'>
                <div className='flex justify-between'>
                  <span>Release Listing Fee</span>
                  <span className='font-medium'>R20.00</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleCardPayment}
                disabled={loading}
                className='w-full'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>Pay R20.00</>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value='coupon' className='space-y-4 py-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='couponCode'>Enter Coupon Code</Label>
                <div className='flex space-x-2'>
                  <Input
                    id='couponCode'
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder='RELEASE20'
                    disabled={loading || !!validCoupon}
                  />
                  {!validCoupon && (
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={handleCouponValidation}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  )}
                </div>

                {couponError && (
                  <p className='text-sm text-destructive'>{couponError}</p>
                )}

                {validCoupon && (
                  <div className='rounded-md bg-green-50 dark:bg-green-900/20 p-3 flex items-start'>
                    <Check className='h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-green-800 dark:text-green-300'>
                        {couponSuccess}
                      </p>
                      <p className='text-sm text-green-700 dark:text-green-400'>
                        {validCoupon.discountType === 'percentage'
                          ? `${validCoupon.discount}% off`
                          : `R${validCoupon.discount.toFixed(2)} off`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className='rounded-md bg-secondary p-4'>
                <div className='flex justify-between'>
                  <span>Original Price</span>
                  <span>R20.00</span>
                </div>

                {validCoupon && (
                  <div className='flex justify-between mt-2 text-green-600 dark:text-green-400'>
                    <span>Discount</span>
                    <span>
                      {validCoupon.discountType === 'percentage'
                        ? `-R${((validCoupon.discount / 100) * 20).toFixed(2)}`
                        : `-R${Math.min(validCoupon.discount, 20).toFixed(2)}`}
                    </span>
                  </div>
                )}

                <div className='flex justify-between mt-2 font-bold border-t pt-2'>
                  <span>Total</span>
                  <span>
                    {validCoupon
                      ? validCoupon.discountType === 'percentage'
                        ? `R${(20 - (validCoupon.discount / 100) * 20).toFixed(
                            2
                          )}`
                        : `R${Math.max(0, 20 - validCoupon.discount).toFixed(
                            2
                          )}`
                      : 'R20.00'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleCouponPayment}
                disabled={loading || !validCoupon}
                className='w-full'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>Apply Coupon</>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Add this to the global.d.ts file or declare it here
declare global {
  interface Window {
    YocoSDK: any;
  }
}
