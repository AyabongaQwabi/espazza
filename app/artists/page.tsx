'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
  searchParams: { page?: string; province?: string; town?: string };
}) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [provinces, setProvinces] = useState([]);
  const [towns, setTowns] = useState([]);
  const [user, setUser] = useState(null);

  const currentPage = Number(searchParams.page) || 1;
  const selectedProvince = searchParams.province || null;
  const selectedTown = searchParams.town || null;

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [currentPage, selectedProvince, selectedTown]);

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
    const start = (currentPage - 1) * ARTISTS_PER_PAGE;
    const end = start + ARTISTS_PER_PAGE - 1;

    let query = supabase
      .from('profiles')
      .select(
        `
    *,
    south_african_towns(*)
    `,
        { count: 'exact' }
      )
      .eq('user_type', 'artist')
      .not('artist_name', 'is', null) // Exclude null values
      .not('artist_name', 'eq', '')
      .not('artist_bio', 'eq', '')
      .not('artist_bio', 'eq', null);

    if (selectedProvince) {
      query = query.eq('province', selectedProvince);
    }

    if (selectedTown) {
      query = query.eq('town_id', selectedTown);
    }

    const { data: artists, count, error } = await query.range(start, end);

    if (error) {
      console.error('Error fetching artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artists. Please try again.',
        variant: 'destructive',
      });
    } else if (artists) {
      // Fetch likes count for each artist
      const artistsWithLikes = await Promise.all(
        artists.map(async (artist) => {
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

      // Sort artists by likes count in descending order
      const sortedArtists = artistsWithLikes.sort(
        (a, b) => b.likes_count.length - a.likes_count.length
      );
      setArtists(sortedArtists);
      setTotalPages(Math.ceil((count || 0) / ARTISTS_PER_PAGE));
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-4'>Loading artists...</div>;
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

        {/* Filters */}
        <div className='flex flex-col md:flex-row gap-4 mb-8'>
          <Select
            value={selectedProvince || 'all'}
            onValueChange={(value) => {
              const url = new URL(window.location.href);
              if (value === 'all') {
                url.searchParams.delete('province');
              } else {
                url.searchParams.set('province', value);
              }
              url.searchParams.delete('town');
              url.searchParams.set('page', '1');
              window.history.pushState({}, '', url);
              window.location.reload();
            }}
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
            onValueChange={(value) => {
              const url = new URL(window.location.href);
              if (value === 'all') {
                url.searchParams.delete('town');
              } else {
                url.searchParams.set('town', value);
              }
              url.searchParams.set('page', '1');
              window.history.pushState({}, '', url);
              window.location.reload();
            }}
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
                    }${selectedTown ? `&town=${selectedTown}` : ''}`}
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
                        }${selectedTown ? `&town=${selectedTown}` : ''}`}
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
                    }${selectedTown ? `&town=${selectedTown}` : ''}`}
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
