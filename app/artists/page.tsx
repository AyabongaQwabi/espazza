'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ArtistCard from '@/components/ArtistCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';

const ARTISTS_PER_PAGE = 10;

export default function ArtistsPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    province?: string;
    town?: string;
    seed?: string;
  };
}) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [provinces, setProvinces] = useState([]);
  const [towns, setTowns] = useState([]);
  const [user, setUser] = useState(null);
  const [randomSeed, setRandomSeed] = useState(
    searchParams.seed || generateRandomSeed()
  );

  const currentPage = Number(searchParams.page) || 1;
  const selectedProvince = searchParams.province || null;
  const selectedTown = searchParams.town || null;

  const supabase = createClientComponentClient();

  // Generate a random seed for consistent randomization within a session
  function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15);
  }

  useEffect(() => {
    // Set a new random seed when the component mounts
    if (!searchParams.seed) {
      const newSeed = generateRandomSeed();
      setRandomSeed(newSeed);

      // Update URL with the seed without causing a navigation
      const url = new URL(window.location.href);
      url.searchParams.set('seed', newSeed);
      window.history.replaceState({}, '', url);
    }

    checkAuth();
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [currentPage, selectedProvince, selectedTown, randomSeed]);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchLocations() {
    const { data: townsData } = await supabase
      .from('south_african_towns')
      .select('*')
      .order('name');

    if (townsData) {
      const uniqueProvinces = [
        ...new Set(townsData.map((town) => town.province)),
      ];
      setProvinces(uniqueProvinces);
      setTowns(townsData);
    }
  }

  async function fetchArtists() {
    setLoading(true);
    console.log('Fetching artists with seed:', randomSeed);

    try {
      // Build the base query for artists
      let baseQuery = supabase
        .from('profiles')
        .select(
          `
          *,
          south_african_towns(*)
        `
        )
        .eq('user_type', 'artist')
        .not('artist_name', 'is', null)
        .not('artist_name', 'eq', '')
        .not('artist_bio', 'eq', '')
        .not('artist_bio', 'is', null);

      if (selectedProvince) {
        baseQuery = baseQuery.eq('province', selectedProvince);
      }

      if (selectedTown) {
        baseQuery = baseQuery.eq('town_id', selectedTown);
      }

      // First, get the count for pagination
      const countQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('user_type', 'artist')
        .not('artist_name', 'is', null)
        .not('artist_name', 'eq', '')
        .not('artist_bio', 'eq', '')
        .not('artist_bio', 'is', null);

      if (selectedProvince) {
        countQuery.eq('province', selectedProvince);
      }

      if (selectedTown) {
        countQuery.eq('town_id', selectedTown);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting count:', countError);
        throw countError;
      }

      console.log('Total artists count:', count);
      setTotalPages(Math.ceil((count || 0) / ARTISTS_PER_PAGE));

      // If no artists found, return early
      if (!count || count === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      // Apply pagination
      const start = (currentPage - 1) * ARTISTS_PER_PAGE;
      const end = start + ARTISTS_PER_PAGE - 1;

      // Use a simpler randomization approach that's more compatible with Supabase
      // We'll use the random() function with a seed value
      const seedValue = Number.parseInt(
        randomSeed.replace(/[^0-9]/g, '').substring(0, 8) || '12345',
        10
      );

      // Fetch the artists with random ordering
      const { data: artistsData, error } = await baseQuery
        .order(`id`, { ascending: seedValue % 2 === 0 }) // Alternate between ascending and descending based on seed
        .range(start, end);

      if (error) {
        console.error('Error fetching artists:', error);
        throw error;
      }

      console.log('Artists fetched:', artistsData?.length || 0);

      if (!artistsData || artistsData.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      // Randomize the order client-side using the seed
      const shuffledArtists = shuffleArray([...artistsData], seedValue);

      // Fetch likes count for each artist
      const artistsWithLikes = await Promise.all(
        shuffledArtists.map(async (artist) => {
          const { data: likesCount } = await supabase
            .from('artist_likes')
            .select('id', { count: 'exact' })
            .eq('artist_id', artist.username);

          return {
            ...artist,
            likes_count: likesCount || 0,
          };
        })
      );

      setArtists(artistsWithLikes);
    } catch (error) {
      console.error('Error in fetchArtists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artists. Please try again.',
        variant: 'destructive',
      });
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }

  // Fisher-Yates shuffle algorithm with seed
  function shuffleArray(array, seed) {
    const rng = seedRandom(seed);
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  // Simple seeded random number generator
  function seedRandom(seed) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Function to refresh the random order
  function refreshRandomOrder() {
    const newSeed = generateRandomSeed();
    setRandomSeed(newSeed);

    // Update URL with the new seed
    const url = new URL(window.location.href);
    url.searchParams.set('seed', newSeed);
    url.searchParams.set('page', '1'); // Reset to first page
    window.history.pushState({}, '', url);
  }

  // Function to update filters
  function updateFilters(type, value) {
    const url = new URL(window.location.href);

    if (value === 'all') {
      url.searchParams.delete(type);
    } else {
      url.searchParams.set(type, value);
    }

    // Keep the current random seed
    if (randomSeed) {
      url.searchParams.set('seed', randomSeed);
    }

    url.searchParams.set('page', '1'); // Reset to first page
    window.history.pushState({}, '', url);
    window.location.reload();
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-black pt-24 flex items-center justify-center'>
        <div className='text-white text-xl'>Loading artists...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black pt-24'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Abaculi
          </h1>
          <p className='text-zinc-400 text-lg'>
            Discover Xhosa Hip Hop Artists
          </p>
        </div>

        {/* Filters and Refresh Button */}
        <div className='flex flex-col md:flex-row gap-4 mb-8 items-center'>
          <div className='flex flex-col md:flex-row gap-4 flex-grow'>
            <Select
              value={selectedProvince || 'all'}
              onValueChange={(value) => updateFilters('province', value)}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Filter by Province' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Provinces</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTown || 'all'}
              onValueChange={(value) => updateFilters('town', value)}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Filter by Town' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Towns</SelectItem>
                {towns
                  .filter(
                    (town) =>
                      !selectedProvince || town.province === selectedProvince
                  )
                  .map((town) => (
                    <SelectItem key={town.id} value={town.id}>
                      {town.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={refreshRandomOrder}
            variant='outline'
            className='ml-auto'
          >
            Shuffle Artists
          </Button>
        </div>

        {artists.length === 0 ? (
          <div className='text-center py-20'>
            <UsersIcon className='h-12 w-12 text-red-600 mx-auto mb-6' />
            <h2 className='text-2xl font-semibold text-white mb-4'>
              No Artists Found
            </h2>
            <p className='text-zinc-400 mb-8'>
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className='space-y-12'>
            {artists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <ArtistCard
                  artist_name={artist.artist_name}
                  username={artist.username}
                  profile_image_url={artist.profile_image_url}
                  artist_bio={artist.artist_bio}
                  youtube_links={artist.youtube_links}
                  demo_songs={artist.demo_songs}
                  gallery_images={artist.gallery_images}
                  instagram_url={artist.instagram_url}
                  twitter_url={artist.twitter_url}
                  facebook_url={artist.facebook_url}
                  whatsapp_number={artist.whatsapp_number}
                  likes_count={artist.likes_count}
                  user_id={user?.id}
                  onLike={fetchArtists}
                />
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className='mt-12'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/artists?page=${currentPage - 1}${
                      selectedProvince ? `&province=${selectedProvince}` : ''
                    }${selectedTown ? `&town=${selectedTown}` : ''}${
                      randomSeed ? `&seed=${randomSeed}` : ''
                    }`}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`/artists?page=${page}${
                          selectedProvince
                            ? `&province=${selectedProvince}`
                            : ''
                        }${selectedTown ? `&town=${selectedTown}` : ''}${
                          randomSeed ? `&seed=${randomSeed}` : ''
                        }`}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={`/artists?page=${currentPage + 1}${
                      selectedProvince ? `&province=${selectedProvince}` : ''
                    }${selectedTown ? `&town=${selectedTown}` : ''}${
                      randomSeed ? `&seed=${randomSeed}` : ''
                    }`}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
