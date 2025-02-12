'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UsersIcon, SearchIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ArtistCard from '@/components/ArtistCard';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Database } from '@/lib/database.types';
import { isNil, isEmpty } from 'ramda';

const ARTISTS_PER_PAGE = 10;

const exists = (i) => !isNil(i) && !isEmpty(i);

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalArtists, setTotalArtists] = useState(0);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchArtists();
  }, [searchTerm]); // Updated dependency array

  async function fetchArtists() {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('user_type', 'artist')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('username', `%${searchTerm}%`);
    } else {
      setSearchTerm(''); // Reset search term when fetching all artists
    }

    const { data, error, count } = await query.range(
      (currentPage - 1) * ARTISTS_PER_PAGE,
      currentPage * ARTISTS_PER_PAGE - 1
    );

    if (error) {
      console.error('Error fetching artists:', error);
    } else {
      const cleanData = data.filter((d) => exists(d.artist_name));
      setArtists(cleanData || []);
      setTotalArtists(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalArtists / ARTISTS_PER_PAGE);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArtists();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchArtists();
    window.scrollTo(0, 0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchArtists();
  };

  console.log('artsits', artists);

  return (
    <div className='min-h-screen bg-zinc-900'>
      {/* Extra Large Animated Hero Section */}
      <motion.div
        className='relative h-screen flex items-center justify-center overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className='absolute inset-0 bg-cover bg-center z-0'
          style={{
            backgroundImage: 'url("/lxndi.jpg")',
          }}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: 'easeOut' }}
        >
          <div className='absolute inset-0 bg-zinc-900/60' />
        </motion.div>
        <div className='relative z-10 text-center px-4 max-w-4xl'>
          <motion.h1
            className='text-6xl md:text-8xl font-bold text-white mb-6'
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Abaculi
          </motion.h1>
          <motion.p
            className='text-xl md:text-2xl text-gray-300 mb-8'
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Discover the Heartbeat of Xhosa Hip Hop
          </motion.p>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size='lg'
              className='bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg'
              onClick={() => {
                const searchSection = document.getElementById('search-section');
                searchSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Artists
            </Button>
          </motion.div>
        </div>
        <motion.div
          className='absolute bottom-10 left-1/2 transform -translate-x-1/2'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1,
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        >
          <ChevronDownIcon className='w-10 h-10 text-white' />
        </motion.div>
      </motion.div>

      {/* Search and Artists Grid */}
      <div
        id='search-section'
        className='max-w-7xl mx-auto px-4 py-20 relative z-10'
      >
        <motion.div
          className='mb-8 relative'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className='flex flex-col items-center max-w-md mx-auto'>
            <div className='flex items-center w-full bg-gray-800 rounded-lg overflow-hidden'>
              <Input
                type='text'
                placeholder='Search artists...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='flex-grow p-8 bg-transparent text-2xl text-white border-none focus:ring-0'
              />
              <Button
                onClick={handleSearch}
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-8'
              >
                <SearchIcon className='w-5 h-5' />
              </Button>
            </div>
            {searchTerm && (
              <Button
                onClick={handleClearSearch}
                variant='ghost'
                className='mt-2 text-gray-400 hover:text-white'
              >
                <XIcon className='w-4 h-4 mr-2' />
                Clear Search
              </Button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className='text-center text-white'>Loading artists...</div>
        ) : artists.length > 0 ? (
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
                  profile_image_url={artist.avatar_url}
                  artist_bio={artist.artist_bio || 'No bio available.'}
                  youtube_links={artist.youtube_links || []}
                  demo_songs={artist.demo_songs || []}
                  gallery_images={artist.gallery_images || []}
                  instagram_url={artist.instagram_url}
                  twitter_url={artist.twitter_url}
                  facebook_url={artist.facebook_url}
                  whatsapp_number={artist.whatsapp_number}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className='text-center text-white'>No artists found.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className='mt-12 flex justify-center space-x-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='bg-red-600 hover:bg-red-700'
            >
              Previous
            </Button>
            <span className='text-white flex items-center'>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='bg-red-600 hover:bg-red-700'
            >
              Next
            </Button>
          </motion.div>
        )}

        {/* Join as Artist CTA */}
        <motion.div
          className='text-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className='inline-block p-8 bg-zinc-900 rounded-2xl'>
            <UsersIcon className='h-12 w-12 text-red-600 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-white mb-4'>
              NgumRhepi? Yiba yiNxalenye!
            </h2>
            <p className='text-gray-400 mb-6 max-w-lg mx-auto'>
              Are you a Xhosa Hip Hop artist? Join our platform to showcase your
              music and connect with fans.
            </p>
            <Button asChild size='lg' className='bg-red-600 hover:bg-red-700'>
              <Link href='/register'>Qala Apha</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
