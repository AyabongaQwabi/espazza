'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import { Play, Pause, Music, User, Calendar, Tag } from 'lucide-react';
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

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortOption, setSortOption] = useState('newest');
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReleases();
    fetchGenres();
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchReleases() {
    setLoading(true);
    let query = supabase
      .from('releases')
      .select(
        `
        *,
        genre:genres(id, name),
        record_label:record_labels(name),
        record_owner:profiles(artist_name, username)
      `
      )
      .order('release_date', { ascending: sortOption === 'oldest' });

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    if (genreFilter && genreFilter !== 'all') {
      query = query.eq('genre_id', genreFilter);
    }

    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching releases:', error);
    } else {
      setReleases(data || []);
    }
    setLoading(false);
  }

  async function fetchGenres() {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching genres:', error);
    } else {
      setGenres(data || []);
    }
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

  async function handlePurchase(releaseId: string) {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase releases',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const release = releases.find((r) => r.id === releaseId);
    if (!release) return;

    setPurchaseLoading(true);

    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = release.price + SURCHARGE;

      const request = {
        entityID: release.id,
        externalEntityID: release.id,
        amount: totalPrice * 100, // Convert to cents
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
        //window.location.href = response.data.paylinkUrl;
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
        }, 30000);
      }
    }
  }

  const calculateReleasePrice = (tracks: Track[]) => {
    return tracks.reduce((total, track) => total + (track.price || 0), 0);
  };

  console.log('releases', releases);

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Music Releases</h1>

      <div className='flex flex-col md:flex-row gap-4 mb-8'>
        <Input
          type='text'
          placeholder='Search releases...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='md:w-1/3'
        />
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className='md:w-1/4'>
            <SelectValue placeholder='Filter by genre' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Genres</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre.id} value={genre.id}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='flex flex-col md:w-1/4'>
          <span className='text-sm mb-2'>
            Price Range: R{priceRange[0]} - R{priceRange[1]}
          </span>
          <Slider
            min={0}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={setPriceRange}
          />
        </div>
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className='md:w-1/4'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest First</SelectItem>
            <SelectItem value='oldest'>Oldest First</SelectItem>
            <SelectItem value='popular'>Most Popular</SelectItem>
            <SelectItem value='rating'>Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className='text-center'>Loading releases...</div>
      ) : releases.length === 0 ? (
        <div className='text-center'>No releases found.</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {releases.map((release) => (
            <Card key={release.id} className='flex flex-col'>
              <CardHeader>
                <Image
                  src={release.cover_image_url || '/placeholder.svg'}
                  alt={release.title}
                  width={300}
                  height={300}
                  className='w-full h-48 object-cover rounded-t-lg'
                />
              </CardHeader>
              <CardContent className='flex-grow'>
                <CardTitle className='text-xl mb-2'>{release.title}</CardTitle>
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
                <p className='text-sm text-gray-600 mb-4'>
                  {release.description}
                </p>
                <div className='space-y-2 bg-gray-800 p-4 rounded-lg'>
                  <h3 className='font-semibold mb-2 flex items-center'>
                    <Music className='w-4 h-4 mr-2' />
                    Tracks
                  </h3>
                  {release.tracks.map((track) => (
                    <div
                      key={track.id}
                      className='flex justify-between items-center'
                    >
                      <span className='text-sm'>{track.title}</span>
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
                  ))}
                </div>
              </CardContent>
              <CardFooter className='flex justify-between mt-auto'>
                <span className='text-lg font-bold'>
                  R{calculateReleasePrice(release.tracks).toFixed(2)}
                </span>
                <Button
                  onClick={() => handlePurchase(release.id)}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <audio ref={audioRef} className='hidden' />
    </div>
  );
}
