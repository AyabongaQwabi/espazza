'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Plus, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import axios from 'axios';
import short from 'short-uuid';

export default function PaymentDashboard() {
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [appId, setAppId] = useState('');
  const [appKey, setAppKey] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        setUser(userData.user);

        // Check if user has already paid
        const { data: paymentData } = await supabase
          .from('ikhoka_payments')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('status', 'paid')
          .single();

        if (paymentData) {
          setHasPaid(true);
        }

        // Load existing payment details if any
        const { data: detailsData } = await supabase
          .from('ikhoka_credentials')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();

        if (detailsData) {
          setPaymentDetails(detailsData);
          setAppId(detailsData.app_id || '');
          setAppKey(detailsData.app_key || '');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePayment = async () => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      const transactionId = short().toUUID(short.generate());
      const totalPrice = 150 * 100; // Convert to cents (R150)

      const request = {
        entityID: transactionId,
        externalEntityID: transactionId,
        amount: totalPrice,
        currency: 'ZAR',
        requesterUrl: window.location.origin + '/dashboard-payment',
        description: 'iKhoka Integration Setup Fee',
        paymentReference: `${user.id}-ikhoka-setup-${transactionId}`,
        mode: 'live',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: `${window.location.origin}/api/payment/callback`,
          successPageUrl: `${window.location.origin}/ikhoka?transaction_id=${transactionId}&status=success`,
          failurePageUrl: `${window.location.origin}/ikhoka?status=failure`,
          cancelUrl: `${window.location.origin}/ikhoka?status=cancelled`,
        },
      };

      // Insert payment record
      await supabase.from('ikhoka_payments').insert({
        user_id: user.id,
        transaction_id: transactionId,
        amount: 150,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Call your payment API endpoint
      const response = await axios.post('/api/payment', request);

      if (response.data?.paylinkUrl) {
        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCredentials = async () => {
    try {
      setSavingCredentials(true);

      if (!appId || !appKey) {
        toast({
          title: 'Error',
          description: 'Please provide both App ID and App Key',
          variant: 'destructive',
        });
        return;
      }

      if (!user) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      // Check if record exists
      const { data: existingData } = await supabase
        .from('ikhoka_credentials')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('ikhoka_credentials')
          .update({
            app_id: appId,
            app_key: appKey,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from('ikhoka_credentials').insert({
          user_id: user.id,
          app_id: appId,
          app_key: appKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Update local state
      setPaymentDetails({
        app_id: appId,
        app_key: appKey,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'iKhoka credentials saved successfully',
      });

      setOpenCredentialsDialog(false);
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to save credentials',
        variant: 'destructive',
      });
    } finally {
      setSavingCredentials(false);
    }
  };

  // Check for transaction status in URL params
  useEffect(() => {
    const checkTransactionStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get('transaction_id');
      const status = urlParams.get('status');

      if (transactionId && status === 'success' && user) {
        // Update payment status in database
        await supabase
          .from('ikhoka_payments')
          .update({ status: 'paid' })
          .eq('transaction_id', transactionId)
          .eq('user_id', user.id);

        setHasPaid(true);

        toast({
          title: 'Payment Successful',
          description: 'You can now add your iKhoka credentials',
        });

        // Remove query params from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    if (user) {
      checkTransactionStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className='p-8 w-full h-screen flex items-center justify-center'>
        <p className='text-zinc-400'>Loading...</p>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-8'
      >
        <h1 className='text-3xl font-bold text-white mb-2'>
          iKhoka Payment Gateway
        </h1>
        <p className='text-zinc-400'>Manage your payment gateway integration</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='grid grid-cols-1 gap-6 mb-8'
      >
        {!hasPaid && (
          <Card className='bg-zinc-900 border-zinc-800'>
            <CardHeader>
              <CardTitle className='text-white'>
                Setup iKhoka Integration
              </CardTitle>
              <CardDescription>
                One-time setup fee to integrate with iKhoka payment gateway
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className='mb-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Payment Required</AlertTitle>
                <AlertDescription>
                  A one-time payment of R150 is required to set up your iKhoka
                  integration.
                </AlertDescription>
              </Alert>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-3xl font-bold text-white'>R150</p>
                  <p className='text-zinc-400 text-sm mt-1'>One-time fee</p>
                </div>
                <Button onClick={handlePayment}>
                  <CreditCard className='h-4 w-4 mr-2' />
                  Make Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle className='text-white'>iKhoka Credentials</CardTitle>
            <CardDescription>
              Your iKhoka payment gateway credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentDetails ? (
              <div className='space-y-4'>
                <div>
                  <Label className='text-zinc-400'>App ID</Label>
                  <div className='bg-zinc-800 p-3 rounded-md mt-1'>
                    <p className='text-white font-mono'>
                      {paymentDetails.app_id}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className='text-zinc-400'>App Key</Label>
                  <div className='bg-zinc-800 p-3 rounded-md mt-1'>
                    <p className='text-white font-mono'>
                      {paymentDetails.app_key.substring(0, 8)}
                      {'•'.repeat(20)}
                    </p>
                  </div>
                </div>
                <div className='text-sm text-zinc-400'>
                  Last updated:{' '}
                  {new Date(paymentDetails.updated_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <p className='text-zinc-400 mb-4'>
                  No iKhoka credentials configured
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Dialog
              open={openCredentialsDialog}
              onOpenChange={setOpenCredentialsDialog}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={!hasPaid}
                  variant={paymentDetails ? 'outline' : 'default'}
                >
                  {paymentDetails ? (
                    <>
                      <Settings className='h-4 w-4 mr-2' />
                      Update Credentials
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4 mr-2' />
                      Add Credentials
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className='bg-zinc-900 border-zinc-800'>
                <DialogHeader>
                  <DialogTitle className='text-white'>
                    {paymentDetails
                      ? 'Update iKhoka Credentials'
                      : 'Add iKhoka Credentials'}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your iKhoka App ID and App Key
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='appId'>App ID</Label>
                    <Input
                      id='appId'
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder='Enter your iKhoka App ID'
                      className='bg-zinc-800 border-zinc-700'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='appKey'>App Key</Label>
                    <Input
                      id='appKey'
                      value={appKey}
                      onChange={(e) => setAppKey(e.target.value)}
                      placeholder='Enter your iKhoka App Key'
                      className='bg-zinc-800 border-zinc-700'
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveCredentials}
                  disabled={savingCredentials}
                >
                  {savingCredentials ? 'Saving...' : 'Save Credentials'}
                </Button>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
