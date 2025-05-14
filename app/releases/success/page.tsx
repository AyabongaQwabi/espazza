'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  CheckCircle,
  Download,
  Loader2,
  Music,
  ShoppingBag,
} from 'lucide-react';
import { Suspense } from 'react';
import { SongPreview } from '@/components/SongPreview';
import { Separator } from '@/components/ui/separator';

// Define the system user ID that exists in the auth.users table
const SYSTEM_USER_ID = 'c4dc7b72-8f2f-41d4-8a28-0538e06b2a9a';

function SuccessPage() {
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transaction_id');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function updatePurchaseAndFetchDetails() {
      if (!transactionId) {
        setError('No transaction ID provided');
        setLoading(false);
        return;
      }

      console.log('Transaction ID:', transactionId);

      try {
        // First, update the purchase status to completed
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ status: 'completed' })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error('Error updating purchase status:', updateError);
          setError('Failed to update purchase status');
        }

        // Get the purchase record with release details
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('*, release:releases (*, profiles:record_owner(*))')
          .eq('transaction_id', transactionId)
          .single();

        console.log('Purchase Data:', purchaseData);
        if (purchaseError || !purchaseData) {
          console.error('Error fetching purchase details:', purchaseError);
          setError('Purchase details not found');
          setLoading(false);
          return;
        }

        // Update the release payment status if this is a release purchase
        if (
          purchaseData.purchase_type === 'release' &&
          purchaseData.release_id
        ) {
          const { error: releaseError } = await supabase
            .from('releases')
            .update({
              is_paid: true,
              payment_method: purchaseData.payment_method || 'yoco',
              payment_date: new Date().toISOString(),
              transaction_id: transactionId,
            })
            .eq('id', purchaseData.release_id);

          if (releaseError) {
            console.error('Error updating release status:', releaseError);
          }
        }

        // Check if earnings records already exist for this transaction
        const { data: existingEarnings, error: earningsCheckError } =
          await supabase
            .from('earnings')
            .select('id')
            .eq('transaction_id', transactionId);

        if (earningsCheckError) {
          console.error(
            'Error checking existing earnings:',
            earningsCheckError
          );
        }

        // Only create earnings records if none exist for this transaction
        if (!existingEarnings || existingEarnings.length === 0) {
          if (purchaseData.amount && purchaseData.status === 'completed') {
            const totalAmount = Number.parseFloat(purchaseData.amount);
            const systemAmount = totalAmount * 0.1; // 10% for system
            const artistAmount = totalAmount * 0.9; // 90% for artist

            // Make sure we have a valid user ID for the artist earnings
            // Use the purchase user_id which we know exists in the auth.users table
            const artistUserId = purchaseData.user_id;

            if (!artistUserId) {
              console.error('No valid user ID found for artist earnings');
              return;
            }

            console.log(
              'Creating earnings with system user ID:',
              SYSTEM_USER_ID
            );
            console.log('Creating earnings with artist user ID:', artistUserId);

            try {
              // Create system earnings record (10%)
              const { error: systemEarningError } = await supabase
                .from('earnings')
                .insert({
                  user_id: SYSTEM_USER_ID, // Use the specific system user ID
                  purchase_id: purchaseData.id,
                  transaction_id: transactionId,
                  amount: systemAmount.toFixed(2),
                  percentage: 10.0,
                  type: 'system',
                  status: 'pending',
                });

              if (systemEarningError) {
                console.error(
                  'Error creating system earnings record:',
                  systemEarningError
                );
              } else {
                console.log('Successfully created system earnings record');
              }

              // Create artist earnings record (90%)
              const { error: artistEarningError } = await supabase
                .from('earnings')
                .insert({
                  user_id: artistUserId,
                  purchase_id: purchaseData.id,
                  transaction_id: transactionId,
                  amount: artistAmount.toFixed(2),
                  percentage: 90.0,
                  type: 'artist',
                  status: 'pending',
                });

              if (artistEarningError) {
                console.error(
                  'Error creating artist earnings record:',
                  artistEarningError
                );
              } else {
                console.log('Successfully created artist earnings record');
              }
            } catch (err) {
              console.error('Error creating earnings records:', err);
            }
          }
        } else {
          console.log(
            'Earnings records already exist for transaction:',
            transactionId
          );
        }

        setPurchaseDetails(purchaseData);

        // Fetch the release tracks
        if (purchaseData.release && purchaseData.release.tracks) {
          setTracks(purchaseData.release.tracks);
        }
      } catch (err) {
        console.error('Error processing purchase:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    updatePurchaseAndFetchDetails();
  }, [transactionId, supabase]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
        <p className='text-muted-foreground'>Processing your purchase...</p>
      </div>
    );
  }

  if (error || !purchaseDetails) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh]'>
        <p className='text-xl text-muted-foreground'>
          {error || 'Purchase details not found.'}
        </p>
        <Button className='mt-4' asChild>
          <Link href='/releases'>Back to Releases</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-12 max-w-3xl'>
      <div className='flex justify-center mb-8'>
        <CheckCircle className='h-24 w-24 text-green-500' />
      </div>

      <Card className='border-green-200 shadow-lg'>
        <CardHeader className='bg-green-50 dark:bg-green-900/20 border-b'>
          <CardTitle className='text-2xl text-center text-green-600 dark:text-green-400'>
            Payment Successful!
          </CardTitle>
        </CardHeader>

        <CardContent className='pt-6 pb-4'>
          <div className='text-center mb-6'>
            <p className='text-lg'>
              Thank you for your purchase. Your transaction has been completed
              successfully.
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              You can find all your purchases in your{' '}
              <Link
                href='/dashboard/purchases'
                className='text-primary hover:underline'
              >
                purchases dashboard
              </Link>
              .
            </p>
          </div>

          <div className='bg-muted/50 p-4 rounded-lg space-y-2 mb-6'>
            <div className='flex justify-between'>
              <span className='font-medium'>Transaction ID:</span>
              <span className='font-mono text-sm'>{transactionId}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Release:</span>
              <span>{purchaseDetails.release?.title || 'N/A'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Amount:</span>
              <span>R{purchaseDetails.amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Purchase Date:</span>
              <span>
                {new Date(
                  purchaseDetails.purchase_date || purchaseDetails.created_at
                ).toLocaleString()}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Payment Method:</span>
              <span className='capitalize'>
                {purchaseDetails.payment_method || 'Card'}
              </span>
            </div>
          </div>

          {tracks.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Music className='h-5 w-5' />
                Your Tracks
              </h3>
              <Separator />

              <div className='space-y-4'>
                {tracks.map((track, index) => (
                  <div
                    key={track.id || index}
                    className='bg-background rounded-lg border p-4'
                  >
                    <SongPreview
                      url={track.url}
                      coverArt={purchaseDetails.release?.cover_image_url}
                      title={track.title}
                      artist={
                        purchaseDetails.release?.profiles?.artist_name ||
                        'Artist'
                      }
                    />
                    <div className='mt-3 flex justify-end'>
                      <Button size='sm' variant='outline' asChild>
                        <a
                          href={track.url}
                          download={`${track.title}.mp3`}
                          className='flex items-center gap-2'
                        >
                          <Download className='h-4 w-4' />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className='flex justify-between border-t pt-6 pb-4 bg-muted/20'>
          <Button variant='outline' asChild>
            <Link href='/releases'>Browse More Releases</Link>
          </Button>
          <Button asChild>
            <Link
              href='/dashboard/purchases'
              className='flex items-center gap-2'
            >
              <ShoppingBag className='h-4 w-4' />
              My Purchases
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SuccessPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center min-h-[60vh]'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  );
}
