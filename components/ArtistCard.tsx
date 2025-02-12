'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  FaPlay,
  FaPause,
  FaYoutube,
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaEnvelope,
  FaLink,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { isNil, isEmpty } from 'ramda';

function getYouTubeVideoId(url: string) {
  const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^?&]+)/;
  const match = url.match(regex);
  return match && match[1] ? match[1] : null;
}

const exists = (i) => !isEmpty(i) && !isNil(i);

const SocialFollowButtons = ({ artist }) => {
  return (
    <div className='flex space-x-2 mt-4'>
      {artist.twitter_url && (
        <Button
          variant='outline'
          size='sm'
          onClick={() => window.open(artist.twitter_url, '_blank')}
        >
          <Twitter className='w-4 h-4 mr-2' />
          Follow on Twitter
        </Button>
      )}
      {artist.instagram_url && (
        <Button
          variant='outline'
          size='sm'
          onClick={() => window.open(artist.instagram_url, '_blank')}
        >
          <Instagram className='w-4 h-4 mr-2' />
          Follow on Instagram
        </Button>
      )}
      {artist.facebook_url && (
        <Button
          variant='outline'
          size='sm'
          onClick={() => window.open(artist.facebook_url, '_blank')}
        >
          <Facebook className='w-4 h-4 mr-2' />
          Follow on Facebook
        </Button>
      )}
      {artist.whatsapp_number && (
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            window.open(`https://wa.me/${artist.whatsapp_number}`, '_blank')
          }
        >
          <Phone className='w-4 h-4 mr-2' />
          WhatsApp
        </Button>
      )}
    </div>
  );
};

interface Song {
  title: string;
  url: string;
  releaseDate: string;
}

interface ArtistCardProps {
  artist_name: string;
  username: string;
  profile_image_url: string;
  artist_artist_bio: string;
  youtube_links: string[];
  gallery_images: string[];
  demo_songs: Song[];
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist_name,
  username,
  profile_image_url,
  gallery_images,
  artist_bio,
  youtube_links,
  demo_songs,
  instagram_url,
  facebook_url,
  twitter_url,
  whatsapp_number,
}) => {
  const songs = demo_songs?.map((i) => JSON.parse(i));
  console.log('songs', songs, username, artist_name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1511367461989-f85a21fda167';
  };

  const togglePlay = async (songUrl: string) => {
    if (currentlyPlaying === songUrl) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      try {
        if (audioRef.current) {
          audioRef.current.src = songUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setCurrentlyPlaying(songUrl);
          }
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        toast({
          title: 'Error',
          description:
            'Unable to play this audio file. Please try again or check the file.',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    const handleEnded = () => {
      setCurrentlyPlaying(null);
    };

    const audioElement = audioRef.current;
    audioElement?.addEventListener('ended', handleEnded);

    return () => {
      audioElement?.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleCanPlayThrough = () => {
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
          toast({
            title: 'Error',
            description:
              'Unable to play this audio file. Please try again or check the file.',
            variant: 'destructive',
          });
        });
      };

      audio.addEventListener('canplaythrough', handleCanPlayThrough);

      return () => {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
    }
  }, [audioRef]); //Corrected useEffect dependency

  const handleShare = (platform: string) => {
    const url = `https://xhap.co.za/artist/${username}`; // Replace with actual artist page URL
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          `Check out ${artist_name} on XHAPP: ${url}`
        )}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Check out ${artist_name} on XHAPP&body=I thought you might be interested in this artist: ${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          toast({
            title: 'Link Copied',
            description: "The artist's link has been copied to your clipboard.",
          });
        });
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }

    setIsShareModalOpen(false);
  };

  return (
    <div className='max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl'>
      <div className='grid md:grid-cols-3 gap-8'>
        <div className='md:col-span-1'>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            className='relative overflow-hidden rounded-lg shadow-lg'
          >
            <Image
              src={
                exists(profile_image_url)
                  ? profile_image_url
                  : exists(gallery_images[0])
                  ? gallery_images[0]
                  : '/placeholder.svg'
              }
              alt={artist_name}
              onError={handleImageError}
              className='w-full h-64 object-cover'
              width={300}
              height={300}
            />
          </motion.div>
          <h2 className='text-3xl font-bold text-white mt-4 mb-2'>
            {artist_name}
          </h2>
          <div className='flex space-x-4 mb-4'>
            <FaTwitter className='text-2xl text-red-500 cursor-pointer hover:text-red-600' />
            <FaInstagram className='text-2xl text-red-500 cursor-pointer hover:text-red-600' />
            <FaFacebook className='text-2xl text-red-500 cursor-pointer hover:text-red-600' />
          </div>
          <div className='flex space-x-2 mt-4'>
            <Link href={`/artists/${username}`} passHref>
              <Button variant='outline'>More</Button>
            </Link>
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant='outline'>Share</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share {artist_name}</DialogTitle>
                </DialogHeader>
                <SocialFollowButtons
                  artist={{
                    instagram_url,
                    facebook_url,
                    twitter_url,
                    whatsapp_number,
                  }}
                />
                <div className='flex justify-around mt-4'>
                  <Button
                    onClick={() => handleShare('facebook')}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    <FaFacebook className='mr-2' /> Facebook
                  </Button>
                  <Button
                    onClick={() => handleShare('whatsapp')}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <FaWhatsapp className='mr-2' /> WhatsApp
                  </Button>
                  <Button
                    onClick={() => handleShare('email')}
                    className='bg-gray-600 hover:bg-gray-700'
                  >
                    <FaEnvelope className='mr-2' /> Email
                  </Button>
                  <Button
                    onClick={() => handleShare('copy')}
                    className='bg-gray-600 hover:bg-gray-700'
                  >
                    <FaLink className='mr-2' /> Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='md:col-span-2 space-y-6'>
          <div>
            <p className='text-gray-300 leading-relaxed'>
              {isExpanded ? artist_bio : `${artist_bio?.slice(0, 150)}...`}
            </p>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-white mb-3'>
              Latest Videos
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              {youtube_links?.slice(0, 4).map((video, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className='relative cursor-pointer group'
                  onClick={() => {
                    setSelectedVideo(getYouTubeVideoId(video));
                    setIsModalOpen(true);
                  }}
                >
                  <Image
                    src={`https://img.youtube.com/vi/${getYouTubeVideoId(
                      video
                    )}/0.jpg`}
                    alt='Video thumbnail'
                    className='w-full h-32 object-cover rounded-lg'
                    width={300}
                    height={150}
                  />
                  <div className='absolute inset-0 flex items-center justify-center bg-zinc-900 bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg'>
                    <FaYoutube className='text-4xl text-red-500' />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-white mb-3'>
              Demo Songs
            </h3>
            <div className='space-y-3'>
              {songs?.map((song) => (
                <motion.div
                  key={song.url}
                  whileHover={{ scale: 1.02 }}
                  className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => togglePlay(song.url)}
                      className='p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors'
                      aria-label={
                        currentlyPlaying === song.url ? 'Pause' : 'Play'
                      }
                    >
                      {currentlyPlaying === song.url ? <FaPause /> : <FaPlay />}
                    </button>
                    <div>
                      <p className='font-medium text-white'>{song.title}</p>
                      <p className='text-sm text-gray-400'>
                        Released: {song.releaseDate}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 bg-zinc-900 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-gray-900 p-4 rounded-lg w-full max-w-3xl'>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}`}
              className='w-full aspect-video rounded-lg'
              allowFullScreen
              title='YouTube Video Player'
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className='mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onError={(e) => {
          console.error('Audio error:', e);
          toast({
            title: 'Error',
            description:
              'There was an error with the audio file. Please try again.',
            variant: 'destructive',
          });
        }}
      />
    </div>
  );
};

export default ArtistCard;
