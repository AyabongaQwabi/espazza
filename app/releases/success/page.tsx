'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

function SuccessPage() {
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPurchaseDetails() {
      if (!transactionId) return;

      const { data, error } = await supabase
        .from('purchases')
        .select('*, release:releases (*)')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching purchase details:', error);
      } else {
        setPurchaseDetails(data);

        // Fetch the release tracks
        if (data.release && data.release.tracks) {
          setTracks(data.release.tracks);
        }

        // Update the purchase status to 'complete'
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ status: 'complete' })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error('Error updating purchase status:', updateError);
        }
      }
      setLoading(false);
    }

    fetchPurchaseDetails();
  }, [transactionId, supabase]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
        <p className='text-muted-foreground'>Loading purchase details...</p>
      </div>
    );
  }

  if (!purchaseDetails) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh]'>
        <p className='text-xl text-muted-foreground'>
          Purchase details not found.
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
              <span>{purchaseDetails.release.title}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Amount:</span>
              <span>R{purchaseDetails.amount.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Purchase Date:</span>
              <span>
                {new Date(purchaseDetails.created_at).toLocaleString()}
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
                      coverArt={purchaseDetails.release.cover_image_url}
                      title={track.title}
                      artist={
                        purchaseDetails.release.profiles?.artist_name ||
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
