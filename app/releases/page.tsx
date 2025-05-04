'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import short from 'short-uuid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  Filter,
  MoreHorizontal,
  Sparkles,
  Flame,
  ListMusic,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { postToURL } from '@/lib/payfast';
import { useMusicPlayer } from '@/hooks/use-music-player';

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
    payment_credentials: {
      ikhoka: any;
      payfast: any;
      paypal: any;
    };
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
  const [showFilters, setShowFilters] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [expandedReleases, setExpandedReleases] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClientComponentClient();
  const { playTrack } = useMusicPlayer();
  const { state, addToPlaylist } = useMusicPlayer();

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
            ikhoka: release.record_owner.payment_credentials?.ikhoka,
            payfast: release.record_owner.payment_credentials?.payfast,
            paypal: release.record_owner.payment_credentials?.paypal,
          },
        },
      }));
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
    if (!selectedRelease || !currentUser) {
      toast({
        title: 'Warning',
        description: 'Invalid release or user data. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

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

  function handlePreview(track: Track, release: Release) {
    if (currentlyPlaying === track.url) {
      // Stop playing
      setCurrentlyPlaying(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      setCurrentlyPlaying(track.url);

      // Create a track object for the music player
      const playerTrack = {
        id: track.id,
        title: track.title,
        artist:
          release.record_owner.artist_name || release.record_owner.username,
        artistId: release.record_owner.username,
        cover_image_url: track.cover_image_url || release.cover_image_url,
        url: track.url,
        release_id: release.id,
      };

      // Play the track in the music player
      playTrack(playerTrack);
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
    console.log('Creating purchase record...');
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

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!selectedTrack) return;

    try {
      // Find the release that contains this track
      const release = releases.find((r) =>
        r.tracks.some((t) => t.id === selectedTrack.id)
      );

      if (!release) return;

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

  const toggleExpandRelease = (releaseId: string) => {
    if (expandedReleases.includes(releaseId)) {
      setExpandedReleases(expandedReleases.filter((id) => id !== releaseId));
    } else {
      setExpandedReleases([...expandedReleases, releaseId]);
    }
  };

  async function handleCardPayment(release: Release | null) {
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
        setPaymentModalOpen(false);
        await createPurchaseRecord(release, totalPrice, transactionId, 'yoco');

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

  return (
    <div className='flex flex-col min-h-screen bg-gray-900 text-white'>
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className='bg-gray-800 border-red-500 text-white'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              Select Payment Method
            </DialogTitle>
            <DialogDescription className='text-gray-300'>
              Choose how you'd like to pay for this release
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col space-y-4 mt-4'>
            <Button
              onClick={() => handleCardPayment(selectedRelease)}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              Pay with Card (Yoco)
            </Button>
            {/* {selectedRelease?.record_owner.payment_credentials.ikhoka && (
              <Button
                onClick={() => handlePaymentMethodSelection('ikhoka')}
                className='bg-red-500 hover:bg-red-600 text-white'
              >
                Pay with iKhoka
              </Button>
            )}
            {selectedRelease?.record_owner.payment_credentials.paypal && (
              <Button
                onClick={() => handlePaymentMethodSelection('paypal')}
                className='bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold'
              >
                Pay with PayPal
              </Button>
            )}
            {selectedRelease?.record_owner.payment_credentials.payfast && (
              <Button
                onClick={() => handlePaymentMethodSelection('payfast')}
                className='bg-white hover:bg-gray-200 text-gray-900'
              >
                Pay with PayFast
              </Button>
            )} */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className='relative h-[40vh] overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10'></div>
        <Image
          src='/ndlu.jpg'
          alt='Music Hero'
          layout='fill'
          objectFit='cover'
          className='opacity-70'
        />
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <div className='text-center'>
            <h1 className='text-5xl font-bold mb-4 text-white drop-shadow-lg'>
              Discover New Music
            </h1>
            <p className='text-xl mb-8 text-white drop-shadow-lg max-w-2xl mx-auto'>
              Purchase and preview the latest releases from your favorite
              artists
            </p>
            <Button
              size='lg'
              className='bg-red-500 hover:bg-red-600 text-white'
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

      {/* Main Content */}
      <main className='flex-grow' id='releases'>
        <div className='container mx-auto px-4 py-8'>
          {/* Search and Filter Bar */}
          <div className='flex items-center justify-between mb-8 sticky top-0 z-30 bg-gray-900 py-4 border-b border-gray-800'>
            <div className='relative flex-grow max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                type='text'
                placeholder='Search releases...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white focus:ring-red-500 focus:border-red-500'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                className='border-gray-700 text-white hover:bg-gray-800'
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className='h-4 w-4 mr-2' />
                Filters
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='border-gray-700 text-white hover:bg-gray-800'
                  >
                    <TrendingUp className='w-4 h-4 mr-2' />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                  <DropdownMenuRadioGroup
                    value={sortOption}
                    onValueChange={setSortOption}
                  >
                    <DropdownMenuRadioItem
                      value='newest'
                      className='focus:bg-gray-700'
                    >
                      <Calendar className='mr-2 h-4 w-4' /> Newest First
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value='oldest'
                      className='focus:bg-gray-700'
                    >
                      <Calendar className='mr-2 h-4 w-4' /> Oldest First
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value='popular'
                      className='focus:bg-gray-700'
                    >
                      <Flame className='mr-2 h-4 w-4' /> Most Popular
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value='rating'
                      className='focus:bg-gray-700'
                    >
                      <Star className='mr-2 h-4 w-4' /> Highest Rated
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className='mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-in slide-in-from-top'>
              <h3 className='text-lg font-semibold mb-4'>Refine Your Search</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='text-sm font-medium mb-2 flex items-center'>
                    <Tag className='mr-2 h-4 w-4' /> Genre
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    <Badge
                      className={`cursor-pointer ${
                        genreFilter === 'all'
                          ? 'bg-red-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setGenreFilter('all')}
                    >
                      All Genres
                    </Badge>
                    {genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        className={`cursor-pointer ${
                          genreFilter === genre.id
                            ? 'bg-red-500'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setGenreFilter(genre.id)}
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className='text-sm font-medium mb-2 flex items-center'>
                    <DollarSign className='mr-2 h-4 w-4' /> Price Range: R
                    {priceRange[0]} - R{priceRange[1]}
                  </h4>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className='py-4'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue='grid' className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-bold'>
                <Sparkles className='inline-block mr-2 text-yellow-400' />
                Latest Music Releases
              </h2>
              <TabsList className='bg-gray-800'>
                <TabsTrigger
                  value='grid'
                  className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                >
                  Grid View
                </TabsTrigger>
                <TabsTrigger
                  value='list'
                  className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                >
                  List View
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className='bg-gray-800 rounded-lg overflow-hidden'
                  >
                    <Skeleton className='h-64 w-full bg-gray-700' />
                    <div className='p-4'>
                      <Skeleton className='h-6 w-3/4 mb-2 bg-gray-700' />
                      <Skeleton className='h-4 w-1/2 mb-4 bg-gray-700' />
                      <Skeleton className='h-20 w-full mb-4 bg-gray-700' />
                      <div className='flex justify-between'>
                        <Skeleton className='h-8 w-20 bg-gray-700' />
                        <Skeleton className='h-8 w-24 bg-gray-700' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : releases.length === 0 ? (
              <div className='text-center py-12 bg-gray-800 rounded-lg'>
                <Music className='h-16 w-16 mx-auto mb-4 text-gray-600' />
                <h3 className='text-xl font-semibold mb-2'>
                  No releases found
                </h3>
                <p className='text-gray-400'>
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <>
                {/* Grid View */}
                <TabsContent value='grid' className='mt-0'>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                    {releases.map((release) => (
                      <div
                        key={release.id}
                        className='bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group'
                      >
                        <div className='relative aspect-square overflow-hidden'>
                          <Image
                            src={release.cover_image_url || '/placeholder.svg'}
                            alt={release.title}
                            width={200}
                            height={200}
                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                          />
                          <div className='absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3'>
                            <Button
                              size='icon'
                              className='bg-red-500 hover:bg-red-600 rounded-full h-10 w-10 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                              onClick={() =>
                                handlePreview(release.tracks[0], release)
                              }
                            >
                              {currentlyPlaying === release.tracks[0]?.url ? (
                                <Pause className='h-5 w-5' />
                              ) : (
                                <Play className='h-5 w-5' />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  className='text-white hover:bg-white/20 rounded-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                                >
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                                <DropdownMenuItem
                                  className='cursor-pointer hover:bg-gray-700'
                                  onClick={() => handleShare(release)}
                                >
                                  <Share2 className='mr-2 h-4 w-4' />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer hover:bg-gray-700'
                                  onClick={() =>
                                    router.push(`/releases/${release.id}`)
                                  }
                                >
                                  <Music className='mr-2 h-4 w-4' />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className='bg-gray-700' />
                                <DropdownMenuItem
                                  className='cursor-pointer hover:bg-gray-700 text-red-400'
                                  onClick={() => handlePurchase(release)}
                                >
                                  <DollarSign className='mr-2 h-4 w-4' />
                                  Buy Now
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer hover:bg-gray-700'
                                  onClick={() =>
                                    toggleExpandRelease(release.id)
                                  }
                                >
                                  <ListMusic className='mr-2 h-4 w-4' />
                                  View Tracks
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className='p-3'>
                          <Link
                            href={`/release/${release.id}`}
                            className='block'
                          >
                            <h3 className='font-bold text-sm mb-1 line-clamp-1 hover:text-red-500 transition-colors'>
                              {release.title}
                            </h3>
                          </Link>
                          <Link
                            href={`/artists/${release.record_owner.username}`}
                            className='text-xs text-gray-400 hover:text-white transition-colors mb-1 flex items-center'
                          >
                            <User className='w-3 h-3 mr-1' />
                            {release.record_owner.artist_name ||
                              release.record_owner.username}
                          </Link>
                          <div className='flex items-center justify-between mt-2 mb-1'>
                            <Badge className='bg-gray-700 text-xs px-1.5 py-0.5 text-[10px]'>
                              {release.genre.name}
                            </Badge>
                            <span className='text-xs text-gray-400'>
                              {new Date(
                                release.release_date
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Track count and expand button */}
                          <div className='flex items-center justify-between mt-2 text-xs text-gray-400'>
                            <span>
                              {release.tracks.length}{' '}
                              {release.tracks.length === 1 ? 'track' : 'tracks'}
                            </span>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='p-0 h-6 text-gray-400 hover:text-white'
                              onClick={() => toggleExpandRelease(release.id)}
                            >
                              {expandedReleases.includes(release.id)
                                ? 'Hide tracks'
                                : 'Show tracks'}
                              <ChevronDown
                                className={`ml-1 h-3 w-3 transition-transform ${
                                  expandedReleases.includes(release.id)
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </Button>
                          </div>

                          {/* Expanded tracks list */}
                          {expandedReleases.includes(release.id) && (
                            <div className='mt-2 pt-2 border-t border-gray-700'>
                              <ul className='space-y-2 max-h-40 overflow-y-auto pr-1'>
                                {release.tracks.map((track, index) => (
                                  <li
                                    key={track.id}
                                    className='flex items-center justify-between text-xs'
                                  >
                                    <div className='flex items-center flex-1 min-w-0'>
                                      <span className='text-gray-500 w-4'>
                                        {index + 1}.
                                      </span>
                                      <span className='ml-1 truncate'>
                                        {track.title}
                                      </span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-6 w-6 text-gray-400 hover:text-white'
                                        onClick={() =>
                                          handlePreview(track, release)
                                        }
                                      >
                                        {currentlyPlaying === track.url ? (
                                          <Pause className='h-3 w-3' />
                                        ) : (
                                          <Play className='h-3 w-3' />
                                        )}
                                      </Button>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-6 w-6 text-gray-400 hover:text-white'
                                        onClick={() => {
                                          setSelectedTrack(track);
                                          setAddToPlaylistDialogOpen(true);
                                        }}
                                      >
                                        <Plus className='h-3 w-3' />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className='mt-2 pt-2 border-t border-gray-700 flex justify-between items-center'>
                            <span className='font-bold text-yellow-400 text-xs'>
                              R
                              {calculateReleasePrice(release.tracks).toFixed(2)}
                            </span>
                            <Button
                              size='sm'
                              className='bg-red-500 hover:bg-red-600 text-white h-7 text-xs px-2'
                              onClick={() => handlePurchase(release)}
                            >
                              Buy Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* List View */}
                <TabsContent value='list' className='mt-0'>
                  <div className='bg-gray-800 rounded-lg overflow-hidden'>
                    <div className='grid grid-cols-12 p-3 text-sm font-medium text-gray-400 border-b border-gray-700'>
                      <div className='col-span-5 flex items-center'>TITLE</div>
                      <div className='col-span-3 flex items-center'>ARTIST</div>
                      <div className='col-span-2 flex items-center'>GENRE</div>
                      <div className='col-span-2 flex items-center justify-end'>
                        PRICE
                      </div>
                    </div>
                    <ScrollArea className='h-[600px]'>
                      {releases.map((release, index) => (
                        <Accordion
                          key={release.id}
                          type='single'
                          collapsible
                          className={`${
                            index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'
                          }`}
                        >
                          <AccordionItem
                            value={release.id}
                            className='border-b border-gray-700'
                          >
                            <div className='grid grid-cols-12 p-3 items-center hover:bg-gray-700 group'>
                              <div className='col-span-5 flex items-center gap-3'>
                                <div className='relative flex-shrink-0'>
                                  <Image
                                    src={
                                      release.cover_image_url ||
                                      '/placeholder.svg' ||
                                      '/placeholder.svg'
                                    }
                                    alt={release.title}
                                    width={50}
                                    height={50}
                                    className='rounded object-cover w-12 h-12'
                                  />
                                  <Button
                                    size='icon'
                                    className='absolute inset-0 m-auto bg-red-500/80 hover:bg-red-500 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                                    onClick={() =>
                                      handlePreview(release.tracks[0], release)
                                    }
                                  >
                                    {currentlyPlaying ===
                                    release.tracks[0]?.url ? (
                                      <Pause className='h-4 w-4' />
                                    ) : (
                                      <Play className='h-4 w-4' />
                                    )}
                                  </Button>
                                </div>
                                <div>
                                  <Link
                                    href={`/release/${release.id}`}
                                    className='font-medium hover:text-red-500 transition-colors line-clamp-1'
                                  >
                                    {release.title}
                                  </Link>
                                  <p className='text-xs text-gray-400 line-clamp-1'>
                                    {release.tracks.length} tracks
                                  </p>
                                </div>
                              </div>
                              <div className='col-span-3'>
                                <Link
                                  href={`/artists/${release.record_owner.username}`}
                                  className='text-sm hover:text-red-500 transition-colors line-clamp-1'
                                >
                                  {release.record_owner.artist_name ||
                                    release.record_owner.username}
                                </Link>
                              </div>
                              <div className='col-span-2'>
                                <Badge className='bg-gray-700 text-xs'>
                                  {release.genre.name}
                                </Badge>
                              </div>
                              <div className='col-span-2 flex items-center justify-end gap-2'>
                                <span className='font-medium text-yellow-400'>
                                  R
                                  {calculateReleasePrice(
                                    release.tracks
                                  ).toFixed(2)}
                                </span>
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
                                        router.push(`/release/${release.id}`)
                                      }
                                    >
                                      <Music className='mr-2 h-4 w-4' />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className='cursor-pointer hover:bg-gray-700'
                                      onClick={() => handleShare(release)}
                                    >
                                      <Share2 className='mr-2 h-4 w-4' />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className='bg-gray-700' />
                                    <DropdownMenuItem
                                      className='cursor-pointer hover:bg-gray-700 text-red-400'
                                      onClick={() => handlePurchase(release)}
                                    >
                                      <DollarSign className='mr-2 h-4 w-4' />
                                      Buy Now
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <AccordionTrigger className='py-2 px-3 hover:no-underline'>
                              <span className='text-sm text-gray-400'>
                                View Tracks
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className='px-3 pb-3'>
                              <div className='space-y-2 pl-16'>
                                {release.tracks.map((track, trackIndex) => (
                                  <div
                                    key={track.id}
                                    className='flex items-center justify-between py-1 px-2 rounded hover:bg-gray-700'
                                  >
                                    <div className='flex items-center flex-1 min-w-0'>
                                      <span className='text-gray-500 w-6 text-xs'>
                                        {trackIndex + 1}.
                                      </span>
                                      <span className='truncate text-sm'>
                                        {track.title}
                                      </span>
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-7 w-7 text-gray-400 hover:text-white'
                                        onClick={() =>
                                          handlePreview(track, release)
                                        }
                                      >
                                        {currentlyPlaying === track.url ? (
                                          <Pause className='h-4 w-4' />
                                        ) : (
                                          <Play className='h-4 w-4' />
                                        )}
                                      </Button>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-7 w-7 text-gray-400 hover:text-white'
                                        onClick={() => {
                                          setSelectedTrack(track);
                                          setAddToPlaylistDialogOpen(true);
                                        }}
                                      >
                                        <Plus className='h-4 w-4' />
                                      </Button>
                                      <span className='text-yellow-400 text-xs font-medium'>
                                        R{track.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </>
            )}

            {/* Pagination */}
            {!loading && releases.length > 0 && (
              <div className='flex justify-center mt-8'>
                <div className='flex items-center space-x-2 bg-gray-800 p-2 rounded-lg'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50'
                  >
                    <ChevronLeft className='h-4 w-4 mr-1' />
                    Prev
                  </Button>
                  <span className='text-sm px-3 py-1 bg-gray-700 rounded-md'>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50'
                  >
                    Next
                    <ChevronRight className='h-4 w-4 ml-1' />
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </main>
      <audio ref={audioRef} className='hidden' />
      {/* Add to Playlist Dialog */}
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

// Add the global declaration for YocoSDK at the end of the file
// Add this to the global.d.ts file or declare it here
declare global {
  interface Window {
    YocoSDK: any;
  }
}
