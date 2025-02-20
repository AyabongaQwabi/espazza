'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import {
  Play,
  Pause,
  Music,
  User,
  Calendar,
  Tag,
  DollarSign,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = 'IKF3SALX1F82BZ7IT6914BEGBEWQ55Y7';
const APPLICATION_KEY = 'DaNAI4IUXeHdZiliiDnrxwWYPm2AE1Al';
const SURCHARGE = 2;

interface Release {
  id: string;
  title: string;
  description: string;
  record_label_id: string;
  distributor_id: string;
  cover_image_url: string;
  tracks: Track[];
  release_date: string;
  genre_id: string;
  average_rating: number;
  price: number;
  record_owner: {
    artist_name: string;
    username: string;
  };
  genre: {
    id: string;
    name: string;
  };
}

interface Track {
  id: string;
  title: string;
  cover_image_url: string;
  url: string;
  featured_artists: string[];
  producers: string[];
  lyrics: string;
  price: number;
  preview_start: number;
  release_date: string;
}

export default function ReleasePage({ params }: { params: { id: string } }) {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRelease();
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchRelease() {
    setLoading(true);
    const { data, error } = await supabase
      .from('releases')
      .select(
        `
        *,
        genre:genres(id, name),
        record_label:record_labels(name),
        record_owner:profiles(artist_name, username)
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching release:', error);
      toast({
        title: 'Error',
        description: 'Failed to load release. Please try again.',
        variant: 'destructive',
      });
    } else {
      setRelease(data);
    }
    setLoading(false);
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
    try {
      return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    } catch (error) {
      console.error('Error on jsStringEscape:', error);
      return '';
    }
  }

  async function handlePurchase() {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase releases',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!release) return;

    setPurchaseLoading(true);

    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice =
        (Number.parseFloat(calculateReleasePrice(release.tracks)) + SURCHARGE) *
        100;
      console.log('totalPrice', totalPrice);
      const request = {
        entityID: release.id,
        externalEntityID: release.id,
        amount: totalPrice, // Convert to cents
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/releases',
        description: `Purchase of ${release.title} (includes R${SURCHARGE} service fee)`,
        paymentReference: `${currentUser.id}-${release.id}`,
        mode: 'sandbox',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/releases/callback',
          successPageUrl: `https://espazza.co.za/releases/success?transaction_id=${transactionId}`,
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
      console.log('Payment API response:', response.data);
      if (response.data?.paylinkUrl) {
        // Create purchase record
        console.log({
          release_id: release.id,
          user_id: currentUser.id,
          amount: totalPrice,
          transaction_id: transactionId,
          purchase_date: new Date(),
          status: 'pending',
          purchase_type: 'release',
        });
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert([
            {
              release_id: release.id,
              user_id: currentUser.id,
              amount: totalPrice,
              transaction_id: transactionId,
              purchase_date: new Date(),
              status: 'pending',
              purchase_type: 'release',
            },
          ]);

        if (purchaseError) throw purchaseError;
        console.log('TRANSACTION ID', transactionId);
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

  const parseTimeString = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  function handlePreview(trackUrl: string, previewStart: number) {
    if (currentlyPlaying === trackUrl) {
      // Stop playing
      setCurrentlyPlaying(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      setCurrentlyPlaying(trackUrl);
      if (audioRef.current) {
        console.log('Playing', trackUrl);
        console.log('Preview start', previewStart);
        const startTime = parseTimeString(previewStart); // Convert "00:30" to 30

        audioRef.current.src = trackUrl;
        audioRef.current.currentTime = startTime;
        audioRef.current.play();

        // Limit preview to 30 seconds
        setTimeout(() => {
          if (audioRef.current && audioRef.current.src === trackUrl) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setCurrentlyPlaying(null);
          }
        }, 50000);
      }
    }
  }

  const calculateReleasePrice = (tracks: Track[]) => {
    return tracks.reduce((total, track) => total + (track.price || 0), 0);
  };

  const handleShare = () => {
    if (!release) return;

    if (navigator.share) {
      navigator
        .share({
          title: release.title,
          text: `Check out ${release.title} by ${
            release.record_owner.artist_name || release.record_owner.username
          }`,
          url: window.location.href,
        })
        .then(() => {
          console.log('Shared successfully');
        })
        .catch((error) => {
          console.error('Error sharing:', error);
        });
    } else {
      // Fallback for browsers that don't support navigator.share
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out ${release.title} by ${
            release.record_owner.artist_name || release.record_owner.username
          }`
        )}&url=${encodeURIComponent(window.location.href)}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  if (!release) {
    return <div className='text-center text-2xl mt-8'>Release not found</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='w-full max-w-4xl mx-auto'>
        <CardHeader>
          <div className='relative h-64 md:h-96 mb-4'>
            <Image
              src={release.cover_image_url || '/placeholder.svg'}
              alt={release.title}
              layout='fill'
              objectFit='cover'
              className='rounded-t-lg'
            />
          </div>
          <CardTitle className='text-3xl mb-2'>{release.title}</CardTitle>
          <div className='flex items-center text-sm text-gray-500 mb-2'>
            <User className='w-4 h-4 mr-1' />
            <Link
              href={`/artists/${release.record_owner.username}`}
              className='hover:underline'
            >
              {release.record_owner.artist_name ||
                release.record_owner.username}
            </Link>
          </div>
          <div className='flex items-center text-sm text-gray-500 mb-2'>
            <Calendar className='w-4 h-4 mr-1' />
            {new Date(release.release_date).toLocaleDateString()}
          </div>
          <div className='flex items-center text-sm text-gray-500 mb-4'>
            <Tag className='w-4 h-4 mr-1' />
            {release.genre.name}
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-gray-600 mb-6'>{release.description}</p>
          <h3 className='font-semibold mb-4 flex items-center'>
            <Music className='w-5 h-5 mr-2' />
            Tracks
          </h3>
          <div className='space-y-4'>
            {release.tracks.map((track) => (
              <div
                key={track.id}
                className='flex justify-between items-center bg-gray-100 p-4 rounded-lg'
              >
                <span className='text-lg'>{track.title}</span>
                <div className='flex items-center space-x-4'>
                  <span className='text-gray-600'>
                    R{track.price.toFixed(2)}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      handlePreview(track.url, track.preview_start)
                    }
                    className='flex items-center'
                  >
                    {currentlyPlaying === track.url ? (
                      <Pause className='w-4 h-4 mr-1' />
                    ) : (
                      <Play className='w-4 h-4 mr-1' />
                    )}
                    {currentlyPlaying === track.url ? 'Stop' : 'Preview'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className='flex justify-between mt-6'>
          <div className='flex items-center'>
            <DollarSign className='w-5 h-5 mr-2' />
            <span className='text-2xl font-bold'>
              R{calculateReleasePrice(release.tracks).toFixed(2)}
            </span>
          </div>
          <div className='flex space-x-4'>
            <Button variant='outline' onClick={handleShare}>
              <Share2 className='w-4 h-4 mr-2' />
              Share
            </Button>
            <Button onClick={handlePurchase} disabled={purchaseLoading}>
              {purchaseLoading ? 'Processing...' : 'Buy Now'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      <audio ref={audioRef} className='hidden' />
    </div>
  );
}
