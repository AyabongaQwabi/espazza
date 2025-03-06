'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentGateway = 'ikhoka' | 'paypal' | 'payfast';

interface PaymentDetails {
  ikhoka?: {
    app_id: string;
    app_key: string;
  };
  paypal?: {
    client_id: string;
    secret: string;
  };
  payfast?: {
    merchant_id: string;
    merchant_key: string;
  };
}

export default function PaymentDashboard() {
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [user, setUser] = useState<any>(null);
  const [activeGateway, setActiveGateway] = useState<PaymentGateway>('ikhoka');
  const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  // State for form inputs
  const [ikhokaAppId, setIkhokaAppId] = useState('');
  const [ikhokaAppKey, setIkhokaAppKey] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        setUser(userData.user);

        const { data: detailsData } = await supabase
          .from('payment_credentials')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();

        if (detailsData) {
          setPaymentDetails(detailsData);
          setIkhokaAppId(detailsData.ikhoka?.app_id || '');
          setIkhokaAppKey(detailsData.ikhoka?.app_key || '');
          setPaypalClientId(detailsData.paypal?.client_id || '');
          setPaypalSecret(detailsData.paypal?.secret || '');
          setPayfastMerchantId(detailsData.payfast?.merchant_id || '');
          setPayfastMerchantKey(detailsData.payfast?.merchant_key || '');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSaveCredentials = async () => {
    try {
      setSavingCredentials(true);

      if (!user) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      const updatedDetails = { ...paymentDetails };

      // Update the credentials for the active gateway
      switch (activeGateway) {
        case 'ikhoka':
          if (!ikhokaAppId || !ikhokaAppKey) {
            toast({
              title: 'Error',
              description: 'Please provide both App ID and App Key for iKhoka',
              variant: 'destructive',
            });
            return;
          }
          updatedDetails.ikhoka = {
            app_id: ikhokaAppId,
            app_key: ikhokaAppKey,
          };
          break;
        case 'paypal':
          if (!paypalClientId || !paypalSecret) {
            toast({
              title: 'Error',
              description:
                'Please provide both Client ID and Secret for PayPal',
              variant: 'destructive',
            });
            return;
          }
          updatedDetails.paypal = {
            client_id: paypalClientId,
            secret: paypalSecret,
          };
          break;
        case 'payfast':
          if (!payfastMerchantId || !payfastMerchantKey) {
            toast({
              title: 'Error',
              description:
                'Please provide both Merchant ID and Merchant Key for PayFast',
              variant: 'destructive',
            });
            return;
          }
          updatedDetails.payfast = {
            merchant_id: payfastMerchantId,
            merchant_key: payfastMerchantKey,
          };
          break;
      }

      console.log('Updated details:', updatedDetails);
      // Upsert all credentials in a single operation
      const { data: existingRecord, error: fetchError } = await supabase
        .from('payment_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Existing record:', existingRecord);

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Handle error (not a "no rows returned" error)
        console.error('Error checking for existing record:', fetchError);
        return { error: fetchError };
      }

      if (existingRecord) {
        // Record exists, update it
        console.log('Updating existing record');

        const ikhoka = {
          app_id: ikhokaAppId,
          app_key: ikhokaAppKey,
        };
        const paypal = {
          client_id: paypalClientId,
          secret: paypalSecret,
        };
        const payfast = {
          merchant_id: payfastMerchantId,
          merchant_key: payfastMerchantKey,
        };

        const dataUpdate = {
          ikhoka,
          paypal,
          payfast,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };
        console.log(
          'Updating record with:',
          { ikhoka, paypal, payfast },
          'to',
          {
            ...existingRecord,
            ...dataUpdate,
          }
        );
        const { data, error } = await supabase
          .from('payment_credentials')
          .update({ ...existingRecord, ...dataUpdate })
          .eq('id', existingRecord.id);
        console.log('Error:', error, 'Data:', data);
        if (error) throw error;
      } else {
        console.log('Inserting new record because record does not exist');
        const { error } = await supabase.from('payment_credentials').insert({
          user_id: user.id,
          ikhoka: {
            app_id: ikhokaAppId,
            app_key: ikhokaAppKey,
          },
          paypal: {
            client_id: paypalClientId,
            secret: paypalSecret,
          },
          payfast: {
            merchant_id: payfastMerchantId,
            merchant_key: payfastMerchantKey,
          },
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      setPaymentDetails(updatedDetails);

      toast({
        title: 'Success',
        description: `${activeGateway.toUpperCase()} credentials saved successfully`,
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
          Payment Gateway Settings
        </h1>
        <p className='text-zinc-400'>
          Manage your payment gateway integrations
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='grid grid-cols-1 gap-6 mb-8'
      >
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle className='text-white'>
              Payment Gateway Credentials
            </CardTitle>
            <CardDescription>
              Your payment gateway integration details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='ikhoka' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='ikhoka'>iKhoka</TabsTrigger>
                <TabsTrigger value='paypal'>PayPal</TabsTrigger>
                <TabsTrigger value='payfast'>PayFast</TabsTrigger>
              </TabsList>
              <TabsContent value='ikhoka'>
                <CredentialsDisplay
                  title='iKhoka Credentials'
                  credentials={paymentDetails.ikhoka}
                  fields={[
                    { label: 'App ID', key: 'app_id' },
                    { label: 'App Key', key: 'app_key', sensitive: true },
                  ]}
                />
              </TabsContent>
              <TabsContent value='paypal'>
                <CredentialsDisplay
                  title='PayPal Credentials'
                  credentials={paymentDetails.paypal}
                  fields={[
                    { label: 'Client ID', key: 'client_id' },
                    { label: 'Secret', key: 'secret', sensitive: true },
                  ]}
                />
              </TabsContent>
              <TabsContent value='payfast'>
                <CredentialsDisplay
                  title='PayFast Credentials'
                  credentials={paymentDetails.payfast}
                  fields={[
                    { label: 'Merchant ID', key: 'merchant_id' },
                    {
                      label: 'Merchant Key',
                      key: 'merchant_key',
                      sensitive: true,
                    },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Dialog
              open={openCredentialsDialog}
              onOpenChange={setOpenCredentialsDialog}
            >
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <Settings className='h-4 w-4 mr-2' />
                  Update Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className='bg-zinc-900 border-zinc-800'>
                <DialogHeader>
                  <DialogTitle className='text-white'>
                    Update Payment Gateway Credentials
                  </DialogTitle>
                  <DialogDescription>
                    Enter your payment gateway credentials
                  </DialogDescription>
                </DialogHeader>
                <Tabs
                  value={activeGateway}
                  onValueChange={(value) =>
                    setActiveGateway(value as PaymentGateway)
                  }
                >
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='ikhoka'>iKhoka</TabsTrigger>
                    <TabsTrigger value='paypal'>PayPal</TabsTrigger>
                    <TabsTrigger value='payfast'>PayFast</TabsTrigger>
                  </TabsList>
                  <TabsContent value='ikhoka'>
                    <div className='grid gap-4 py-4'>
                      <div className='grid gap-2'>
                        <Label htmlFor='ikhokaAppId'>App ID</Label>
                        <Input
                          id='ikhokaAppId'
                          value={ikhokaAppId}
                          onChange={(e) => setIkhokaAppId(e.target.value)}
                          placeholder='Enter your iKhoka App ID'
                          className='bg-zinc-800 border-zinc-700'
                        />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='ikhokaAppKey'>App Key</Label>
                        <Input
                          id='ikhokaAppKey'
                          value={ikhokaAppKey}
                          onChange={(e) => setIkhokaAppKey(e.target.value)}
                          placeholder='Enter your iKhoka App Key'
                          className='bg-zinc-800 border-zinc-700'
                          type='password'
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value='paypal'>
                    <div className='grid gap-4 py-4'>
                      <div className='grid gap-2'>
                        <Label htmlFor='paypalClientId'>Client ID</Label>
                        <Input
                          id='paypalClientId'
                          value={paypalClientId}
                          onChange={(e) => setPaypalClientId(e.target.value)}
                          placeholder='Enter your PayPal Client ID'
                          className='bg-zinc-800 border-zinc-700'
                        />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='paypalSecret'>Secret</Label>
                        <Input
                          id='paypalSecret'
                          value={paypalSecret}
                          onChange={(e) => setPaypalSecret(e.target.value)}
                          placeholder='Enter your PayPal Secret'
                          className='bg-zinc-800 border-zinc-700'
                          type='password'
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value='payfast'>
                    <div className='grid gap-4 py-4'>
                      <div className='grid gap-2'>
                        <Label htmlFor='payfastMerchantId'>Merchant ID</Label>
                        <Input
                          id='payfastMerchantId'
                          value={payfastMerchantId}
                          onChange={(e) => setPayfastMerchantId(e.target.value)}
                          placeholder='Enter your PayFast Merchant ID'
                          className='bg-zinc-800 border-zinc-700'
                        />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='payfastMerchantKey'>Merchant Key</Label>
                        <Input
                          id='payfastMerchantKey'
                          value={payfastMerchantKey}
                          onChange={(e) =>
                            setPayfastMerchantKey(e.target.value)
                          }
                          placeholder='Enter your PayFast Merchant Key'
                          className='bg-zinc-800 border-zinc-700'
                          type='password'
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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

interface CredentialsDisplayProps {
  title: string;
  credentials?: Record<string, string>;
  fields: Array<{ label: string; key: string; sensitive?: boolean }>;
}

function CredentialsDisplay({
  title,
  credentials,
  fields,
}: CredentialsDisplayProps) {
  if (!credentials) {
    return (
      <div className='text-center py-8'>
        <p className='text-zinc-400 mb-4'>No {title} configured</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {fields.map((field) => (
        <div key={field.key}>
          <Label className='text-zinc-400'>{field.label}</Label>
          <div className='bg-zinc-800 p-3 rounded-md mt-1'>
            <p className='text-white font-mono'>
              {field.sensitive
                ? credentials[field.key].substring(0, 8) + '•'.repeat(20)
                : credentials[field.key]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
