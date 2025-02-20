'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaSpotify,
  FaYoutube,
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Music,
  Award,
  Users,
} from 'lucide-react';

const DEFAULT_IMAGE = '/Ndlu.jpg';

async function fetchArtist(username: string) {
  const supabase = createClientComponentClient<Database>();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No results found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching artist:', error);
    return null;
  }
}

export default function ArtistPage({
  params,
}: {
  params: { username: string };
}) {
  const [artist, setArtist] = useState<
    Database['public']['Tables']['profiles']['Row'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtist() {
      const artistData = await fetchArtist(params.username);
      if (artistData) {
        setArtist(artistData);
      } else {
        console.log('Artist not found');
      }
      setLoading(false);
    }

    loadArtist();
  }, [params.username]);

  if (loading) {
    return (
      <div className='min-h-screen bg-zinc-900 text-white flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='text-4xl font-bold'
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className='min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center'>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-4xl font-bold mb-4'
        >
          Artist Not Found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='text-xl mb-8'
        >
          We couldn't find an artist with that username.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href='/artists'
            className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300'
          >
            Back to Artists
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-zinc-900 text-white'>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className='relative h-[60vh] flex items-center justify-center'
      >
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage: `url(${
              artist.gallery_images[0] ||
              artist.profile_image_url ||
              DEFAULT_IMAGE
            })`,
            filter: 'blur(5px)',
          }}
        />
        <div className='absolute inset-0 bg-zinc-900 bg-opacity-50' />
        <div className='relative z-10 text-center'>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={artist.profile_image_url || DEFAULT_IMAGE}
              alt='Artist image'
              width={250}
              height={250}
              className='rounded-full mx-auto mb-6 border-4 border-white shadow-lg'
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-5xl font-bold mb-2'
          >
            {artist.artist_name}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className='text-xl text-zinc-300 mt-2'
          >
            <Music className='inline-block mr-2' />
            Hip Hop • <MapPin className='inline-block mr-2 ml-2' />
            {artist.suburb}
          </motion.p>
        </div>
      </motion.div>

      {/* About the Artist */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='max-w-4xl mx-auto px-4 py-16'
      >
        <h2 className='text-3xl font-bold mb-6 flex items-center'>
          <Award className='mr-3' />
          About the Artist
        </h2>
        <p className='text-zinc-300 mb-6 text-lg leading-relaxed whitespace-pre-line'>
          {artist.artist_bio}
        </p>
      </motion.section>

      {/* Gallery */}
      {artist.gallery_images && artist.gallery_images.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='max-w-6xl mx-auto px-4 py-16'
        >
          <h2 className='text-3xl font-bold mb-6 flex items-center'>
            <Award className='mr-3' />
            Gallery
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-6'>
            {artist.gallery_images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Image
                  src={image || DEFAULT_IMAGE}
                  alt={`${artist.artist_name} gallery image ${index + 1}`}
                  width={400}
                  height={400}
                  className='rounded-lg object-cover w-full h-64 transition-transform duration-300 hover:scale-105'
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Music & Media Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='max-w-4xl mx-auto px-4 py-16'
      >
        <h2 className='text-3xl font-bold mb-6 flex items-center'>
          <Music className='mr-3' />
          Music & Media
        </h2>
        {/* Featured Songs */}
        <div className='mb-12'>
          <h3 className='text-2xl font-semibold mb-6'>Featured Songs</h3>
          {/* Add your music player component here */}
          <p className='text-zinc-400'>Music player coming soon...</p>
        </div>
        {/* Music Videos & Performances */}
        <div>
          <h3 className='text-2xl font-semibold mb-6'>Videos</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {artist.youtube_links?.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className='aspect-w-16 aspect-h-9'
              >
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                    link
                  )}`}
                  frameBorder='0'
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen
                  className='w-full h-full rounded-lg shadow-lg'
                ></iframe>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Social & Streaming Links */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className='max-w-4xl mx-auto px-4 py-16'
      >
        <h2 className='text-3xl font-bold mb-6'>Follow & Listen</h2>
        <div className='flex flex-wrap gap-4'>
          <SocialLink
            href={artist.youtube_url}
            icon={<FaYoutube />}
            label='YouTube'
          />
          <SocialLink
            href={artist.spotify_url}
            icon={<FaSpotify />}
            label='Spotify'
          />
          <SocialLink
            href={artist.instagram_url}
            icon={<FaInstagram />}
            label='Instagram'
          />
          <SocialLink
            href={artist.twitter_url}
            icon={<FaTwitter />}
            label='Twitter'
          />
          <SocialLink
            href={artist.facebook_url}
            icon={<FaFacebook />}
            label='Facebook'
          />
          <SocialLink
            href={artist.tiktok_url}
            icon={<FaTiktok />}
            label='TikTok'
          />
        </div>
      </motion.section>

      {/* Contact & Booking */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className='max-w-4xl mx-auto px-4 py-16'
      >
        <h2 className='text-3xl font-bold mb-6 flex items-center'>
          <Phone className='mr-3' />
          Contact & Booking
        </h2>
        <div className='grid md:grid-cols-2 gap-8'>
          <div>
            <h3 className='text-2xl font-semibold mb-4'>Book This Artist</h3>
            <p className='text-zinc-300 mb-6 text-lg'>
              Interested in booking {artist.artist_name} for an event or
              collaboration?
            </p>
            <div className='flex space-x-4'>
              {artist.cellphone && (
                <Button
                  onClick={() =>
                    window.open(`https://wa.me/${artist.cellphone}`, '_blank')
                  }
                  className='bg-green-600 hover:bg-green-700 transition-colors duration-300'
                >
                  <FaWhatsapp className='mr-2' />
                  WhatsApp
                </Button>
              )}
              {artist.email && (
                <Button
                  onClick={() =>
                    (window.location.href = `mailto:${artist.email}`)
                  }
                  className='bg-blue-600 hover:bg-blue-700 transition-colors duration-300'
                >
                  <Mail className='mr-2' />
                  Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Fan Interaction & Engagement */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className='max-w-4xl mx-auto px-4 py-16'
      >
        <h2 className='text-3xl font-bold mb-6 flex items-center'>
          <Users className='mr-3' />
          Fan Zone
        </h2>
        <Button className='mb-6 bg-red-600 hover:bg-red-700 transition-colors duration-300'>
          Follow Artist
        </Button>
        {/* Add comments/fan wall component here */}
        <p className='text-zinc-400 mb-8'>
          Fan interaction features coming soon...
        </p>
        {artist.upcoming_events && (
          <div className='mt-12'>
            <h3 className='text-2xl font-semibold mb-6 flex items-center'>
              <Calendar className='mr-3' />
              Upcoming Events
            </h3>
            <ul className='space-y-4'>
              <li className='bg-zinc-800 p-6 rounded-lg transition-all duration-300 hover:bg-zinc-700'>
                <p className='font-semibold text-lg'>No upcoming events</p>
                <p className='text-zinc-400'>
                  Check back later for future events!
                </p>
              </li>
            </ul>
          </div>
        )}
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className='bg-red-600 py-16'
      >
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <h2 className='text-4xl font-bold mb-8'>
            Support {artist.artist_name}
          </h2>
          <div className='flex flex-wrap justify-center gap-6'>
            <Button
              size='lg'
              className='bg-white text-red-600 hover:bg-zinc-100 transition-colors duration-300'
            >
              <Calendar className='mr-2' />
              Book This Artist
            </Button>
            <Button
              size='lg'
              className='bg-[#1DB954] hover:bg-[#1ed760] transition-colors duration-300'
            >
              <FaSpotify className='mr-2' />
              Listen on Spotify
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='text-white border-white hover:bg-white/10 transition-colors duration-300'
            >
              <Users className='mr-2' />
              Follow on Socials
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function SocialLink({ href, icon, label }) {
  if (!href) return null;
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full transition-colors duration-300'
      >
        {icon}
        <span>{label}</span>
      </Link>
    </motion.div>
  );
}

function getYouTubeVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
