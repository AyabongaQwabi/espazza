'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Play,
  Pause,
  Music,
  User,
  Calendar,
  DollarSign,
  Share2,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  Star,
  Disc3,
  Sparkles,
  ListMusic,
  Plus,
} from 'lucide-react';

// Add this import at the top
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Add this import at the top of the file
import { useMusicPlayer } from '@/hooks/use-music-player';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;
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

interface Artist {
  artist_name: string;
  id: string;
  is_unregistered: boolean;
}

interface Track {
  id: string;
  title: string;
  cover_image_url: string;
  url: string;
  featured_artists: Artist[];
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('tracks');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Add this to the component state variables
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();
  const { state, addToPlaylist } = useMusicPlayer();

  // Inside the ReleasePage component, add this line after other hooks
  const { playTrackFromRelease } = useMusicPlayer();

  useEffect(() => {
    fetchRelease();
    checkUser();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };

      const handleDurationChange = () => {
        setDuration(audioRef.current?.duration || 0);
      };

      const handleEnded = () => {
        setCurrentlyPlaying(null);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('durationchange', handleDurationChange);
      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current?.removeEventListener(
          'durationchange',
          handleDurationChange
        );
        audioRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef.current]);

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
      .eq('short_unique_id', params.id)
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

  async function handleCardPayment() {
    if (!release || !currentUser) {
      toast({
        title: 'Warning',
        description: 'Invalid release or user data. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    setPurchaseLoading(true);
    const totalPrice = calculateReleasePrice(release.tracks) + SURCHARGE;
    const transactionId = short().toUUID(short.generate());

    try {
      // Create a checkout session with Yoco
      const response = await axios.post('/api/yoco-payment', {
        amountInCents: Math.round(totalPrice * 100), // Convert to cents
        currency: 'ZAR',
        releaseId: release.id,
        userId: currentUser?.id,
        transactionId,
        description: `Purchase of ${release.title} (includes R${SURCHARGE} service fee)`,
      });

      if (response.data.redirectUrl) {
        // Close the payment modal

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

        // Redirect to Yoco's hosted checkout page
        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received from payment provider');
      }
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      toast({
        title: 'Payment Error',
        description:
          error.response?.data?.error || 'Could not initialize payment system',
        variant: 'destructive',
      });
      setPurchaseLoading(false);
    }
  }

  const parseTimeString = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Replace the handlePreview function with this updated version
  function handlePreview(trackUrl: string, previewStart: number, track: Track) {
    if (currentlyPlaying === trackUrl) {
      // Stop playing
      setCurrentlyPlaying(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      setCurrentlyPlaying(trackUrl);

      // Map all tracks to the format expected by the music player
      const playerTracks = release.tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist:
          release.record_owner.artist_name || release.record_owner.username,
        artistId: release.record_owner.username,
        cover_image_url: t.cover_image_url || release.cover_image_url,
        url: t.url,
        release_id: release.id,
        plays: t.plays || 0,
      }));

      // Find the current track
      const currentTrack = playerTracks.find((t) => t.url === trackUrl);

      if (currentTrack) {
        // Play the track in the music player
        playTrackFromRelease(currentTrack, playerTracks);
      }
    }
  }

  const calculateReleasePrice = (tracks: Track[]) => {
    return tracks.reduce((total, track) => total + (track.price || 0), 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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

  // Find the handleAddToPlaylist function and replace it with this updated version:

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!selectedTrack || !release) return;

    try {
      // Create a properly formatted track object with all required properties
      const formattedTrack = {
        id: selectedTrack.id,
        title: selectedTrack.title,
        artist:
          release.record_owner.artist_name || release.record_owner.username,
        artistId: release.record_owner.username,
        cover_image_url:
          selectedTrack.cover_image_url || release.cover_image_url,
        url: selectedTrack.url,
        release_id: release.id,
        plays: selectedTrack.plays || 0,
      };

      await addToPlaylist(playlistId, formattedTrack);
      setAddToPlaylistDialogOpen(false);
      setSelectedTrack(null);

      toast({
        title: 'Success',
        description: 'Track added to playlist',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add track to playlist',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-gray-900'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500'></div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-gray-900 text-white'>
        <Music className='h-16 w-16 mb-4 text-red-500' />
        <h2 className='text-2xl font-bold mb-2'>Release not found</h2>
        <p className='text-gray-400 mb-6'>
          The release you're looking for doesn't exist or has been removed
        </p>
        <Button
          onClick={() => router.push('/releases')}
          className='bg-red-500 hover:bg-red-600 text-white'
        >
          <ChevronLeft className='mr-2 h-4 w-4' /> Back to Releases
        </Button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white pb-16'>
      {/* Header with blurred background */}
      <div className='relative'>
        <div className='absolute inset-0 overflow-hidden'>
          <Image
            src={release.cover_image_url || '/placeholder.svg'}
            alt={release.title}
            layout='fill'
            objectFit='cover'
            className='opacity-30 blur-xl'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900'></div>
        </div>

        <div className='container mx-auto px-4 py-8 relative z-10'>
          <Button
            variant='ghost'
            className='mb-6 text-white hover:bg-white/10'
            onClick={() => router.push('/releases')}
          >
            <ChevronLeft className='mr-2 h-4 w-4' /> Back to Releases
          </Button>

          <div className='flex flex-col md:flex-row gap-8'>
            <div className='flex-shrink-0'>
              <div className='relative group'>
                <Image
                  src={release.cover_image_url || '/placeholder.svg'}
                  alt={release.title}
                  width={300}
                  height={300}
                  className='rounded-lg shadow-xl shadow-black/50 w-full max-w-[300px]'
                />
                <Button
                  size='icon'
                  className='absolute inset-0 m-auto bg-red-500/80 hover:bg-red-500 rounded-full h-16 w-16 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                  onClick={() =>
                    handlePreview(
                      release.tracks[0]?.url,
                      release.tracks[0]?.preview_start,
                      release.tracks[0]
                    )
                  }
                >
                  {currentlyPlaying === release.tracks[0]?.url ? (
                    <Pause className='h-8 w-8' />
                  ) : (
                    <Play className='h-8 w-8' />
                  )}
                </Button>
              </div>
            </div>

            <div className='flex-grow'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge className='bg-red-500 text-white px-3 py-1'>ALBUM</Badge>
                {release.average_rating > 0 && (
                  <Badge className='bg-yellow-400 text-gray-900 px-3 py-1 flex items-center'>
                    <Star className='h-3 w-3 mr-1' />
                    {release.average_rating.toFixed(1)}
                  </Badge>
                )}
              </div>

              <h1 className='text-4xl font-bold mb-2'>{release.title}</h1>

              <div className='flex items-center gap-2 mb-4'>
                <Avatar className='h-6 w-6 border border-gray-700'>
                  <AvatarImage src='/placeholder-user.jpg' alt='Artist' />
                  <AvatarFallback>
                    {release.record_owner.artist_name?.charAt(0) ||
                      release.record_owner.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/artists/${release.record_owner.username}`}
                  className='text-lg hover:text-red-500 transition-colors'
                >
                  {release.record_owner.artist_name ||
                    release.record_owner.username}
                </Link>
                <span className='text-gray-400'>•</span>
                <span className='text-gray-400 flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' />
                  {new Date(release.release_date).getFullYear()}
                </span>
                <span className='text-gray-400'>•</span>
                <span className='text-gray-400 flex items-center'>
                  <Disc3 className='h-4 w-4 mr-1' />
                  {release.tracks.length} tracks
                </span>
              </div>

              <p className='text-gray-300 mb-6 max-w-2xl'>
                {release.description}
              </p>

              <div className='flex flex-wrap gap-3 mt-6'>
                <Button
                  className='bg-red-500 hover:bg-red-600 text-white'
                  onClick={handleCardPayment}
                  disabled={purchaseLoading}
                >
                  <DollarSign className='mr-2 h-4 w-4' />
                  {purchaseLoading
                    ? 'Processing...'
                    : `Buy for R${calculateReleasePrice(release.tracks).toFixed(
                        2
                      )}`}
                </Button>
                <Button
                  variant='outline'
                  className='border-gray-700 text-white hover:bg-gray-800'
                >
                  <Heart className='mr-2 h-4 w-4' />
                  Add to Favorites
                </Button>
                <Button
                  variant='outline'
                  className='border-gray-700 text-white hover:bg-gray-800'
                  onClick={handleShare}
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Now Playing Bar (visible when a track is playing) */}
      {currentlyPlaying && (
        <div className='fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 z-50'>
          <div className='container mx-auto flex items-center gap-4'>
            <Button
              size='icon'
              className='bg-red-500 hover:bg-red-600 rounded-full h-10 w-10'
              onClick={() => {
                if (audioRef.current?.paused) {
                  audioRef.current.play();
                } else {
                  audioRef.current?.pause();
                }
              }}
            >
              {audioRef.current?.paused ? (
                <Play className='h-5 w-5' />
              ) : (
                <Pause className='h-5 w-5' />
              )}
            </Button>

            <div className='flex-grow'>
              <div className='flex justify-between text-sm mb-1'>
                <span className='text-white'>
                  {release.tracks.find((t) => t.url === currentlyPlaying)
                    ?.title || 'Preview'}
                </span>
                <span className='text-gray-400'>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <Progress
                value={(currentTime / duration) * 100}
                className='h-1'
              />
            </div>

            <Button
              size='icon'
              variant='ghost'
              className='text-white hover:bg-white/10 rounded-full'
              onClick={() => {
                setCurrentlyPlaying(null);
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
              }}
            >
              <span className='sr-only'>Stop</span>✕
            </Button>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className='container mx-auto px-4 py-8'>
        <Tabs
          defaultValue='tracks'
          onValueChange={setActiveTab}
          className='w-full'
        >
          <TabsList className='bg-gray-800 mb-6'>
            <TabsTrigger
              value='tracks'
              className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
            >
              Tracks
            </TabsTrigger>
            <TabsTrigger
              value='details'
              className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
            >
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value='tracks' className='mt-0'>
            <div className='bg-gray-800 rounded-lg overflow-hidden'>
              <div className='grid grid-cols-12 p-3 text-sm font-medium text-gray-400 border-b border-gray-700'>
                <div className='col-span-1'>#</div>
                <div className='col-span-5'>TITLE</div>
                <div className='col-span-3'>FEATURED ARTISTS</div>
                <div className='col-span-2 text-right'>PRICE</div>
                <div className='col-span-1'></div>
              </div>

              {release.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 p-3 items-center hover:bg-gray-700 group ${
                    currentlyPlaying === track.url
                      ? 'bg-gray-700'
                      : index % 2 === 0
                      ? 'bg-gray-800'
                      : 'bg-gray-850'
                  }`}
                >
                  <div className='col-span-1 flex items-center'>
                    {currentlyPlaying === track.url ? (
                      <Sparkles className='h-4 w-4 text-red-500 animate-pulse' />
                    ) : (
                      <span className='text-gray-400 group-hover:hidden'>
                        {index + 1}
                      </span>
                    )}
                    <Button
                      size='icon'
                      variant='ghost'
                      className='hidden group-hover:flex h-6 w-6 text-white hover:bg-white/10 rounded-full'
                      className='hidden group-hover:flex h-6 w-6 text-white hover:bg-white/10 rounded-full'
                      onClick={() =>
                        handlePreview(track.url, track.preview_start, track)
                      }
                    >
                      {currentlyPlaying === track.url ? (
                        <Pause className='h-3 w-3' />
                      ) : (
                        <Play className='h-3 w-3' />
                      )}
                    </Button>
                  </div>

                  <div className='col-span-5'>
                    <div className='font-medium'>{track.title}</div>
                  </div>

                  <div className='col-span-3 text-gray-400 text-sm'>
                    {track.featured_artists && track.featured_artists.length > 0
                      ? track.featured_artists
                          .map((a) => a.artist_name)
                          .join(', ')
                      : '-'}
                  </div>

                  <div className='col-span-2 text-right font-medium text-yellow-400'>
                    R{track.price.toFixed(2)}
                  </div>

                  <div className='col-span-1 flex justify-end'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 text-gray-400'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                        <DropdownMenuItem
                          className='cursor-pointer hover:bg-gray-700'
                          onClick={() =>
                            handlePreview(track.url, track.preview_start, track)
                          }
                        >
                          {currentlyPlaying === track.url ? (
                            <>
                              <Pause className='mr-2 h-4 w-4' />
                              Stop Preview
                            </>
                          ) : (
                            <>
                              <Play className='mr-2 h-4 w-4' />
                              Preview
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-gray-700' />
                        <DropdownMenuItem className='cursor-pointer hover:bg-gray-700'>
                          <Heart className='mr-2 h-4 w-4' />
                          Add to Favorites
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer hover:bg-gray-700'>
                          <Share2 className='mr-2 h-4 w-4' />
                          Share
                        </DropdownMenuItem>
                        {/* Add this to the DropdownMenuContent for tracks */}
                        <DropdownMenuItem
                          className='cursor-pointer hover:bg-gray-700'
                          onClick={() => {
                            setSelectedTrack(track);
                            setAddToPlaylistDialogOpen(true);
                          }}
                        >
                          <ListMusic className='mr-2 h-4 w-4' />
                          Add to Playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value='details' className='mt-0'>
            <div className='bg-gray-800 rounded-lg p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div>
                  <h3 className='text-lg font-semibold mb-4 flex items-center'>
                    <Music className='w-5 h-5 mr-2 text-red-500' />
                    Album Information
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-sm text-gray-400'>Release Date</h4>
                      <p className='font-medium'>
                        {new Date(release.release_date).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm text-gray-400'>Genre</h4>
                      <p className='font-medium'>{release.genre.name}</p>
                    </div>
                    {release.record_label && (
                      <div>
                        <h4 className='text-sm text-gray-400'>Record Label</h4>
                        <p className='font-medium'>
                          {release.record_label.name}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className='text-sm text-gray-400'>Total Tracks</h4>
                      <p className='font-medium'>{release.tracks.length}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-4 flex items-center'>
                    <User className='w-5 h-5 mr-2 text-red-500' />
                    Artist Information
                  </h3>
                  <div className='flex items-center gap-4 mb-4'>
                    <Avatar className='h-16 w-16 border border-gray-700'>
                      <AvatarImage src='/placeholder-user.jpg' alt='Artist' />
                      <AvatarFallback>
                        {release.record_owner.artist_name?.charAt(0) ||
                          release.record_owner.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className='font-medium text-lg'>
                        {release.record_owner.artist_name ||
                          release.record_owner.username}
                      </h4>
                      <Link
                        href={`/artists/${release.record_owner.username}`}
                        className='text-red-500 hover:text-red-400 text-sm'
                      >
                        View Artist Profile
                      </Link>
                    </div>
                  </div>
                  <p className='text-gray-300'>
                    Check out more music from this artist on their profile page.
                  </p>
                </div>
              </div>

              <Separator className='my-8 bg-gray-700' />

              <div>
                <h3 className='text-lg font-semibold mb-4'>
                  About this Release
                </h3>
                <p className='text-gray-300 whitespace-pre-line'>
                  {release.description}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <audio ref={audioRef} className='hidden' />
      {/* Add this dialog at the end of the component, before the closing return tag */}
      <Dialog
        open={addToPlaylistDialogOpen}
        onOpenChange={setAddToPlaylistDialogOpen}
      >
        <DialogContent className='bg-gray-800 border-gray-700 text-white'>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            {state.playlists.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
                <ListMusic className='h-12 w-12 mb-2 opacity-50' />
                <p>You don't have any playlists yet</p>
                <Button
                  variant='link'
                  className='text-red-500 mt-2'
                  onClick={() => {
                    setAddToPlaylistDialogOpen(false);
                    router.push('/playlists');
                  }}
                >
                  Create your first playlist
                </Button>
              </div>
            ) : (
              <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                {state.playlists
                  .filter(
                    (playlist) =>
                      currentUser && playlist.user_id === currentUser.id
                  )
                  .map((playlist) => (
                    <div
                      key={playlist.id}
                      className='flex items-center justify-between p-2 rounded-md hover:bg-gray-700 cursor-pointer'
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <div>
                        <p className='font-medium text-white'>
                          {playlist.name}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {playlist.tracks.length} tracks
                        </p>
                      </div>
                      <Plus className='h-4 w-4 text-gray-400' />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
