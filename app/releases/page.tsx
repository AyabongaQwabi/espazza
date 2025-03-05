'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import short from 'short-uuid';
import {
  Play,
  Pause,
  Music,
  User,
  Calendar,
  Tag,
  Search,
  DollarSign,
  TrendingUp,
  Star,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { postToURL } from '@/lib/payfast';

const SURCHARGE = 2;
const ITEMS_PER_PAGE = 10;

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

const convertZarTOUSD = (zarAmount: number) => {
  return zarAmount / 18.5;
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('releases').select(
      `
        *,
        genre:genres(id, name),
        record_label:record_labels(name),
        record_owner:profiles!inner(
          id,
          artist_name, 
          username,
          payment_credentials(ikhoka, payfast, paypal)
        )
      `,
      { count: 'exact' }
    );

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    if (genreFilter && genreFilter !== 'all') {
      query = query.eq('genre_id', genreFilter);
    }

    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
    }

    if (sortOption === 'newest') {
      query = query.order('release_date', { ascending: false });
    } else if (sortOption === 'oldest') {
      query = query.order('release_date', { ascending: true });
    } else if (sortOption === 'popular') {
      query = query.order('popularity', { ascending: false });
    } else if (sortOption === 'rating') {
      query = query.order('average_rating', { ascending: false });
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await query.range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching releases:', error);
    } else {
      // Process the data to structure payment_credentials correctly
      const processedData = data?.map((release) => ({
        ...release,
        record_owner: {
          ...release.record_owner,
          payment_credentials: {
            ikhoka: release.record_owner.payment_credentials[0]?.ikhoka,
            payfast: release.record_owner.payment_credentials[0]?.payfast,
            paypal: release.record_owner.payment_credentials[0]?.paypal,
          },
        },
      }));
      console.log('processed data', processedData);
      setReleases(processedData || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    }
    setLoading(false);
  }, [supabase, searchTerm, genreFilter, priceRange, sortOption, currentPage]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    fetchGenres();
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
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

  const handlePurchase = (release: Release) => {
    setSelectedRelease(release);
    setPaymentModalOpen(true);
  };

  const handlePaymentMethodSelection = async (method: string) => {
    if (!selectedRelease || !currentUser) return;

    const totalPrice =
      calculateReleasePrice(selectedRelease.tracks) + SURCHARGE;
    const transactionId = short().toUUID(short.generate());

    switch (method) {
      case 'ikhoka':
        await handleIkhokaPayment(selectedRelease, totalPrice, transactionId);
        break;
      case 'paypal':
        await handlePaypalPayment(selectedRelease, totalPrice, transactionId);
        break;
      case 'payfast':
        await handlePayfastPayment(selectedRelease, totalPrice, transactionId);
        break;
      default:
        toast({
          title: 'Error',
          description: 'Invalid payment method selected',
          variant: 'destructive',
        });
    }

    setPaymentModalOpen(false);
  };

  async function handleIkhokaPayment(
    release: Release,
    totalPrice: number,
    transactionId: string
  ) {
    try {
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

      const response = await axios.post('/api/payment', request);
      if (response.data?.paylinkUrl) {
        await createPurchaseRecord(
          release,
          totalPrice,
          transactionId,
          'ikhoka'
        );
        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating iKhoka payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process iKhoka payment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handlePaypalPayment(
    release: Release,
    totalPrice: number,
    transactionId: string
  ) {
    try {
      const { paypal } = release.record_owner.payment_credentials;

      if (!paypal || !paypal.client_id || !paypal.secret) {
        toast({
          title: 'Error',
          description: 'This artist has not set up PayPal payments.',
          variant: 'destructive',
        });
        return;
      }

      // Create order via backend
      const response = await axios.post('/api/paypal/create-order', {
        totalPrice: convertZarTOUSD(totalPrice),
        currency: 'USD',
        transactionId,
        artistPaypalClientId: paypal.client_id,
        artistPaypalSecret: paypal.secret,
      });

      if (response.data?.approvalUrl) {
        await createPurchaseRecord(
          release,
          totalPrice,
          transactionId,
          'paypal'
        );
        window.location.href = response.data.approvalUrl;
      } else {
        throw new Error('No PayPal approval URL received');
      }
    } catch (error) {
      console.error('Error creating PayPal payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process PayPal payment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handlePayfastPayment(
    release: Release,
    totalPrice: number,
    transactionId: string
  ) {
    try {
      const { merchant_id, merchant_key } =
        release.record_owner.payment_credentials.payfast!;
      const paymentData = {
        merchant_id: merchant_id,
        merchant_key: merchant_key,
        return_url: `https://espazza.co.za/releases/success?transaction_id=${transactionId}`,
        cancel_url: 'https://espazza.co.za/cancel',
        notify_url: 'https://espazza.co.za/releases/callback',
        name_first: currentUser.user_metadata.full_name || 'Customer',
        email_address: currentUser.email,
        m_payment_id: transactionId,
        amount: totalPrice.toFixed(2),
        item_name: `Purchase of ${release.title}`,
        item_description: `${release.title} by ${
          release.record_owner.artist_name || release.record_owner.username
        }`,
        custom_str1: release.id,
      };

      await createPurchaseRecord(release, totalPrice, transactionId, 'payfast');
      postToURL('https://sandbox.payfast.co.za/eng/process', paymentData);
    } catch (error) {
      console.error('Error creating PayFast payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process PayFast payment. Please try again.',
        variant: 'destructive',
      });
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleShare = (release: Release) => {
    if (navigator.share) {
      navigator
        .share({
          title: release.title,
          text: `Check out ${release.title} by ${
            release.record_owner.artist_name || release.record_owner.username
          }`,
          url: `${window.location.origin}/releases/${release.id}`,
        })
        .then(() => {
          console.log('Shared successfully');
        })
        .catch((error) => {
          console.error('Error sharing:', error);
        });
    } else {
      // Fallback for browsers that don't support navigator.share
      const shareUrl = `${window.location.origin}/release/${release.id}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out ${release.title} by ${
            release.record_owner.artist_name || release.record_owner.username
          }`
        )}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

  async function createPurchaseRecord(
    release: Release,
    totalPrice: number,
    transactionId: string,
    paymentMethod: string
  ) {
    const { error: purchaseError } = await supabase.from('purchases').insert([
      {
        release_id: release.id,
        user_id: currentUser.id,
        amount: totalPrice,
        transaction_id: transactionId,
        purchase_date: new Date(),
        status: 'pending',
        purchase_type: 'release',
        payment_method: paymentMethod,
      },
    ]);

    if (purchaseError) throw purchaseError;
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay for this release
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col space-y-4'>
            {selectedRelease?.record_owner.payment_credentials.ikhoka && (
              <Button onClick={() => handlePaymentMethodSelection('ikhoka')}>
                Pay with iKhoka
              </Button>
            )}
            {selectedRelease?.record_owner.payment_credentials.paypal && (
              <Button onClick={() => handlePaymentMethodSelection('paypal')}>
                Pay with PayPal
              </Button>
            )}
            {selectedRelease?.record_owner.payment_credentials.payfast && (
              <Button onClick={() => handlePaymentMethodSelection('payfast')}>
                Pay with PayFast
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className='relative h-[50vh] overflow-hidden'>
        <Image
          src='/ndlu.jpg'
          alt='Music Hero'
          layout='fill'
          objectFit='cover'
          className='animate-ken-burns'
        />
        <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='text-center text-white'>
            <h1 className='text-5xl font-bold mb-4 animate-fade-in-up'>
              Discover New Music
            </h1>
            <p className='text-xl mb-8 animate-fade-in-up animation-delay-300'>
              Purchase and preview the latest releases from your favorite
              artists
            </p>
            <Button
              size='lg'
              className='animate-fade-in-up animation-delay-600'
              onClick={() =>
                document
                  .getElementById('releases')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Headphones className='mr-2 h-5 w-5' /> Browse Releases
            </Button>
          </div>
        </div>
      </div>
      <main className='flex-grow bg-gray-100 dark:bg-gray-900' id='releases'>
        <div className='container mx-auto px-4 py-12'>
          <h2 className='text-3xl font-bold mb-8 text-center'>
            Latest Music Releases
          </h2>

          <div className='flex flex-col md:flex-row gap-4 mb-8'>
            <div className='relative md:w-1/3'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                type='text'
                placeholder='Search releases...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
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
              <span className='text-sm mb-2 flex items-center'>
                <DollarSign className='mr-1 h-4 w-4' />
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
                <SelectItem value='newest'>
                  <div className='flex items-center'>
                    <Calendar className='mr-2 h-4 w-4' /> Newest First
                  </div>
                </SelectItem>
                <SelectItem value='oldest'>
                  <div className='flex items-center'>
                    <Calendar className='mr-2 h-4 w-4' /> Oldest First
                  </div>
                </SelectItem>
                <SelectItem value='popular'>
                  <div className='flex items-center'>
                    <TrendingUp className='mr-2 h-4 w-4' /> Most Popular
                  </div>
                </SelectItem>
                <SelectItem value='rating'>
                  <div className='flex items-center'>
                    <Star className='mr-2 h-4 w-4' /> Highest Rated
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className='text-center'>
              <Headphones className='animate-spin h-10 w-10 mx-auto mb-4' />
              Loading releases...
            </div>
          ) : releases.length === 0 ? (
            <div className='text-center'>No releases found.</div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {releases.map((release) => (
                <Card
                  key={release.id}
                  className='flex flex-col hover:shadow-lg transition-shadow duration-300'
                >
                  <CardHeader>
                    <Image
                      src={release.cover_image_url || '/placeholder.svg'}
                      alt={release.title}
                      width={300}
                      height={300}
                      className='w-full h-64 object-cover rounded-t-lg'
                    />
                  </CardHeader>
                  <CardContent className='flex-grow'>
                    <CardTitle className='text-xl mb-2'>
                      <Link
                        href={`/release/${release.id}`}
                        className='hover:underline'
                      >
                        {release.title}
                      </Link>
                    </CardTitle>
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
                    <p className='text-sm text-gray-600 mb-4 line-clamp-3'>
                      {release.description}
                    </p>
                    <div className='space-y-2 bg-gray-800 p-4 rounded-lg'>
                      <h3 className='font-semibold mb-2 flex items-center text-white'>
                        <Music className='w-4 h-4 mr-2' />
                        Tracks
                      </h3>
                      {release.tracks.slice(0, 3).map((track) => (
                        <div
                          key={track.id}
                          className='flex justify-between items-center'
                        >
                          <span className='text-sm text-white'>
                            {track.title}
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
                            {currentlyPlaying === track.url
                              ? 'Stop'
                              : 'Preview'}
                          </Button>
                        </div>
                      ))}
                      {release.tracks.length > 3 && (
                        <p className='text-sm text-gray-400 text-center mt-2'>
                          +{release.tracks.length - 3} more tracks
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className='flex justify-between mt-auto'>
                    <span className='text-lg font-bold'>
                      R{calculateReleasePrice(release.tracks).toFixed(2)}
                    </span>
                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleShare(release)}
                      >
                        <Share2 className='h-4 w-4 mr-2' />
                        Share
                      </Button>
                      <Button
                        onClick={() => handlePurchase(release)}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? 'Processing...' : 'Buy Now'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className='flex justify-center mt-8'>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' />
                Previous
              </Button>
              <span className='text-sm'>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <audio ref={audioRef} className='hidden' />
        </div>
      </main>
    </div>
  );
}
