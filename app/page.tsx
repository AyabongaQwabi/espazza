'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Play,
  Pause,
  Heart,
  Share2,
  Headphones,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  Flame,
  Loader2,
} from 'lucide-react';
import { useMusicPlayer } from '@/hooks/use-music-player';

export default function HomePage() {
  const [featuredReleases, setFeaturedReleases] = useState([]);
  const [featuredReleasesFromTable, setFeaturedReleasesFromTable] = useState(
    []
  );
  const [latestReleases, setLatestReleases] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [trendingArtists, setTrendingArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [allTracks, setAllTracks] = useState([]);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const {
    playTrack,
    playTrackFromRelease,
    addTracksToQueue,
    state,
    playFirstTrackFromQueue,
    togglePlay,
  } = useMusicPlayer();
  const initialLoadRef = useRef(true);
  const buttonRef = useRef(null);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await Promise.all([
        fetchFeaturedReleasesFromTable(),
        fetchFeaturedReleases(),
        fetchLatestReleases(),
        fetchLatestPosts(),
        fetchTrendingArtists(),
      ]);
      setLoading(false);
    }

    fetchData();
  }, []);

  async function fetchFeaturedReleases() {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select(
          `
          *,
          genre:genres(id, name),
          record_label:record_labels(name),
          record_owner:profiles!inner(
            id,
            artist_name, 
            username
          )
    `
        )
        .order('created_at', { ascending: false }) // DESC order
        .limit(6);

      if (error) throw error;
      const allTracks = data.reduce((acc, release) => {
        const tracks = release.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist:
            release.record_owner.artist_name || release.record_owner.username,
          artistId: release.record_owner.username,
          cover_image_url: track.cover_image_url || release.cover_image_url,
          url: track.url,
          release_id: release.id,
          plays: track.plays || 0,
        }));
        return [...acc, ...tracks];
      }, []);
      setAllTracks(allTracks);
      addTracksToQueue(allTracks);
      setFeaturedReleases(data || []);
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  }

  async function fetchFeaturedReleasesFromTable() {
    try {
      const { data, error } = await supabase
        .from('featured_releases')
        .select(
          `
          *,
          release:release_id(
            *,
            genre:genres(id, name),
            record_label:record_labels(name),
            record_owner:profiles!inner(
              id,
              artist_name, 
              username
            )
          ),
          featured_by_user:featured_by(
            username,
            artist_name
          )
        `
        )
        .order('featured_at', { ascending: true })
        .limit(6);

      if (error) throw error;

      // Extract the release data from the featured_releases
      const releases = data.map((item) => item.release);
      setFeaturedReleasesFromTable(releases || []);
    } catch (error) {
      console.error('Error fetching featured releases:', error);
    }
  }

  async function fetchLatestReleases() {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select(
          `
          *,
          genre:genres(id, name),
          record_label:record_labels(name),
          record_owner:profiles!inner(
            id,
            artist_name, 
            username
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setLatestReleases(data || []);
    } catch (error) {
      console.error('Error fetching latest releases:', error);
    }
  }

  async function fetchLatestPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          profiles:author_id (username, full_name, profile_image_url),
          likes:blog_likes(count)
        `
        )
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setLatestPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  async function fetchTrendingArtists() {
    try {
      // Fetch all likes (or a large enough number for trending purposes)
      const { data: likesData, error: likesError } = await supabase
        .from('artist_likes')
        .select('artist_id');

      if (likesError) throw likesError;

      if (!likesData || likesData.length === 0) {
        console.warn('No likes found');
        setTrendingArtists([]);
        return;
      }

      // Count likes per artist in JS
      const likeCounts = likesData.reduce((acc, { artist_id }) => {
        acc[artist_id] = (acc[artist_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sort artist IDs by like count
      const sortedArtistIds = Object.entries(likeCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([artist_id]) => artist_id)
        .slice(0, 10); // limit to top 10

      // Fetch artist profiles for the top artist IDs
      const { data: artistProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, south_african_towns(*)')
        .eq('user_type', 'artist')
        .not('artist_name', 'is', null)
        .not('artist_name', 'eq', '')
        .in('username', sortedArtistIds); // NOTE: match against `id`, not `username`

      if (profilesError) throw profilesError;

      // Merge like count into profiles
      const artistsWithLikes = artistProfiles.map((profile) => ({
        ...profile,
        likes_count: likeCounts[profile.id] || 0,
      }));

      // Sort final results again and limit to top 5
      const sortedArtists = artistsWithLikes
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 5);

      setTrendingArtists(sortedArtists);
    } catch (error) {
      console.error('Error fetching trending artists:', error);
      setTrendingArtists([]);
    }
  }

  const handlePlayPreview = (track, release) => {
    if (currentlyPlaying === track.url) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(track.url);

      const playerTrack = {
        id: track.id,
        title: track.title,
        artist:
          release.record_owner.artist_name || release.record_owner.username,
        artistId: release.record_owner.username,
        cover_image_url: track.cover_image_url || release.cover_image_url,
        url: track.url,
        release_id: release.id,
        plays: track.plays || 0,
      };

      playTrack(playerTrack);
    }
  };

  const formatPostDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      return 'recently';
    }
  };

  const calculateReleasePrice = (tracks) => {
    return tracks.reduce((total, track) => total + (track.price || 0), 0);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-black to-red-950 flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-12 w-12 text-red-500 animate-spin' />
          <p className='mt-4 text-white font-medium'>Loading your vibe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-black to-red-950'>
      {/* Hero Section */}

      <section className='relative h-[85vh] overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <Image
            src='/kkeedcover.jpg'
            alt='Music Visualizer'
            fill
            priority
            className='object-cover opacity-70'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-red-950'></div>
        </div>

        <div className='relative z-10 container mx-auto px-4 h-full flex flex-col justify-center'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='max-w-4xl'
          >
            <Badge className='bg-red-600 text-white mb-6 py-1.5'>
              <Sparkles className='w-4 h-4 mr-1' /> Premium Music Experience
            </Badge>
            <h1 className='text-5xl md:text-7xl font-bold text-white mb-6 leading-tight'>
              Discover Your Next
              <span className='bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-700 to-red-900 block'>
                Musical Obsession
              </span>
            </h1>
            <p className='text-xl text-gray-300 mb-8 max-w-2xl'>
              Explore the latest releases from top artists and stay updated with
              exclusive content from your favorite creators.
            </p>
            <div className='flex flex-wrap gap-4'>
              <Button
                size='lg'
                className='bg-red-600 hover:bg-red-700 text-white'
                onClick={() => router.push('/releases')}
              >
                <Headphones className='mr-2 h-5 w-5' /> Browse Music
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-red-500 text-red-500 hover:bg-red-500/10'
                onClick={() => router.push('/blog')}
              >
                <BookOpen className='mr-2 h-5 w-5' /> Read Blog
              </Button>
            </div>
          </motion.div>

          {/* Floating Music Player Preview */}
          {featuredReleases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className='absolute bottom-12 right-12 max-w-md hidden lg:block'
            >
              <Card className='bg-black/40 backdrop-blur-md border border-white/10 overflow-hidden'>
                <div className='flex p-4'>
                  <div className='relative w-16 h-16 mr-4'>
                    <Image
                      src={
                        featuredReleasesFromTable[0].cover_image_url ||
                        '/placeholder.svg' ||
                        '/placeholder.svg' ||
                        '/placeholder.svg'
                      }
                      alt={featuredReleasesFromTable[0].title}
                      fill
                      className='object-cover rounded-md'
                    />
                    <Button
                      size='icon'
                      id='play-btn'
                      ref={buttonRef}
                      className='absolute inset-0 m-auto bg-red-600/80 hover:bg-red-600 h-8 w-8 rounded-full'
                      onClick={() =>
                        handlePlayPreview(
                          featuredReleasesFromTable[0].tracks[0],
                          featuredReleasesFromTable[0]
                        )
                      }
                    >
                      {currentlyPlaying ===
                      featuredReleasesFromTable[0].tracks[0]?.url ? (
                        <Pause className='h-4 w-4' />
                      ) : (
                        <Play className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-white truncate'>
                      {featuredReleasesFromTable[0].title}
                    </h3>
                    <p className='text-sm text-gray-300 truncate'>
                      {featuredReleasesFromTable[0].record_owner.artist_name ||
                        featuredReleasesFromTable[0].record_owner.username}
                    </p>
                    <div className='flex items-center mt-1'>
                      <Badge className='bg-purple-600/50 text-white text-xs'>
                        Featured
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Discover New Music Section */}
      <section className='py-16 container mx-auto px-4'>
        <div className='flex justify-between items-center mb-10'>
          <div>
            <Badge className='bg-green-600 text-white mb-2'>
              <Sparkles className='w-3 h-3 mr-1' /> Fresh Drops
            </Badge>
            <h2 className='text-3xl font-bold text-white'>
              Discover New Music
            </h2>
          </div>
          <Button
            variant='ghost'
            className='text-red-500 hover:text-red-400 hover:bg-red-500/10'
            onClick={() => router.push('/releases')}
          >
            View All <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {latestReleases.map((release) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className='group'
            >
              <Card className='bg-gray-900/50 backdrop-blur-sm border-0 overflow-hidden hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300'>
                <div className='relative aspect-square overflow-hidden'>
                  <Image
                    src={release.cover_image_url || '/placeholder.svg'}
                    alt={release.title}
                    fill
                    className='object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4'>
                    <Button
                      size='icon'
                      className='bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                      onClick={() =>
                        handlePlayPreview(release.tracks[0], release)
                      }
                    >
                      {currentlyPlaying === release.tracks[0]?.url ? (
                        <Pause className='h-5 w-5' />
                      ) : (
                        <Play className='h-5 w-5' />
                      )}
                    </Button>
                    <div className='flex gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full h-10 w-10'
                      >
                        <Heart className='h-5 w-5' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full h-10 w-10'
                      >
                        <Share2 className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className='p-4'>
                  <Link href={`/r/${release.short_unique_id || release.id}`}>
                    <h3 className='font-bold text-white text-lg mb-1 hover:text-green-500 transition-colors'>
                      {release.title}
                    </h3>
                  </Link>
                  <Link href={`/artists/${release.record_owner.username}`}>
                    <p className='text-gray-400 hover:text-white transition-colors'>
                      {release.record_owner.artist_name ||
                        release.record_owner.username}
                    </p>
                  </Link>
                  <div className='flex items-center justify-between mt-3'>
                    <Badge className='bg-green-900/50 text-green-200'>
                      {release.genre?.name || 'Music'}
                    </Badge>
                    <span className='text-yellow-400 font-medium'>
                      R{calculateReleasePrice(release.tracks).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className='p-4 pt-0 flex justify-between items-center'>
                  <span className='text-xs text-gray-400'>
                    {release.tracks.length} tracks
                  </span>
                  <Button
                    size='sm'
                    className='bg-green-600 hover:bg-green-700 text-white'
                    onClick={() =>
                      router.push(`/r/${release.short_unique_id || release.id}`)
                    }
                  >
                    Listen Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className='py-16 bg-gradient-to-r from-red-900/30 to-black/30 backdrop-blur-sm'>
        <div className='container mx-auto px-4'>
          <div className='flex justify-between items-center mb-10'>
            <div>
              <Badge className='bg-red-600 text-white mb-2'>
                <BookOpen className='w-3 h-3 mr-1' /> Latest Stories
              </Badge>
              <h2 className='text-3xl font-bold text-white'>From The Blog</h2>
            </div>
            <Button
              variant='ghost'
              className='text-red-500 hover:text-red-400 hover:bg-red-500/10'
              onClick={() => router.push('/blog')}
            >
              View All <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Featured Blog Post */}
            {latestPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className='lg:col-span-1'
              >
                <Card className='bg-black/40 backdrop-blur-md border border-white/10 overflow-hidden h-full'>
                  <div className='relative w-full h-full aspect-[16/9]'>
                    <Image
                      src={
                        latestPosts[0].featured_image ||
                        '/placeholder.svg?height=400&width=600&query=music studio with neon lights' ||
                        '/placeholder.svg' ||
                        '/placeholder.svg' ||
                        '/placeholder.svg' ||
                        '/placeholder.svg' ||
                        '/placeholder.svg'
                      }
                      alt={latestPosts[0].title}
                      fill
                      className='object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/90 to-transparent'></div>
                    <div className='absolute bottom-0 left-0 p-6'>
                      <Badge className='bg-red-600 hover:bg-red-700 text-white mb-3'>
                        Featured
                      </Badge>
                      <Link href={`/blog/${latestPosts[0].slug}`}>
                        <h3 className='text-2xl font-bold text-white mb-2 hover:text-red-400 transition-colors'>
                          {latestPosts[0].title}
                        </h3>
                      </Link>
                      <p className='text-gray-300 line-clamp-2 mb-4'>
                        {latestPosts[0].excerpt}
                      </p>
                      <div className='flex items-center'>
                        <Avatar className='h-8 w-8 mr-3 ring-2 ring-red-500'>
                          <AvatarImage
                            src={
                              latestPosts[0].profiles?.profile_image_url ||
                              '/placeholder.svg' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg'
                            }
                            alt={latestPosts[0].profiles?.username || 'User'}
                          />
                          <AvatarFallback className='bg-gradient-to-br from-red-500 to-red-900 text-white'>
                            {(latestPosts[0].profiles?.username || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium text-white'>
                            {latestPosts[0].profiles?.full_name ||
                              latestPosts[0].profiles?.username}
                          </p>
                          <p className='text-xs text-gray-400'>
                            {formatPostDate(latestPosts[0].created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Other Blog Posts */}
            <div className='lg:col-span-1'>
              <div className='space-y-4'>
                {latestPosts.slice(1, 4).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className='bg-black/40 backdrop-blur-md border border-white/10 overflow-hidden'>
                      <div className='flex flex-col md:flex-row'>
                        <div className='relative w-full md:w-1/3 h-40'>
                          <Image
                            src={
                              post.featured_image ||
                              '/placeholder.svg?height=200&width=300&query=music blog post' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg' ||
                              '/placeholder.svg'
                            }
                            alt={post.title}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <div className='p-4 md:w-2/3'>
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className='font-bold text-white hover:text-red-400 transition-colors mb-2'>
                              {post.title}
                            </h3>
                          </Link>
                          <p className='text-gray-400 text-sm line-clamp-2 mb-3'>
                            {post.excerpt}
                          </p>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                              <Avatar className='h-6 w-6 mr-2'>
                                <AvatarImage
                                  src={
                                    post.profiles?.profile_image_url ||
                                    '/placeholder.svg' ||
                                    '/placeholder.svg' ||
                                    '/placeholder.svg' ||
                                    '/placeholder.svg' ||
                                    '/placeholder.svg'
                                  }
                                  alt={post.profiles?.username || 'User'}
                                />
                                <AvatarFallback className='bg-gradient-to-br from-red-500 to-red-900 text-white text-xs'>
                                  {(post.profiles?.username || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className='text-xs text-gray-400'>
                                {formatPostDate(post.created_at)}
                              </span>
                            </div>
                            <Link
                              href={`/blog/${post.slug}`}
                              className='text-xs text-red-500 hover:text-red-400 font-medium'
                            >
                              Read more
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Music Section */}
      <section className='py-16 container mx-auto px-4'>
        <div className='flex justify-between items-center mb-10'>
          <div>
            <Badge className='bg-indigo-600 text-white mb-2'>
              <Flame className='w-3 h-3 mr-1' /> Hot Releases
            </Badge>
            <h2 className='text-3xl font-bold text-white'>Featured Music</h2>
          </div>
          <Button
            variant='ghost'
            className='text-red-500 hover:text-red-400 hover:bg-red-500/10'
            onClick={() => router.push('/releases')}
          >
            View All <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {featuredReleasesFromTable.map((release) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className='group'
            >
              <Card className='bg-gray-900/50 backdrop-blur-sm border-0 overflow-hidden hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300'>
                <div className='relative aspect-square overflow-hidden'>
                  <Image
                    src={release.cover_image_url || '/placeholder.svg'}
                    alt={release.title}
                    fill
                    className='object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4'>
                    <Button
                      size='icon'
                      className='bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                      onClick={() =>
                        handlePlayPreview(release.tracks[0], release)
                      }
                    >
                      {currentlyPlaying === release.tracks[0]?.url ? (
                        <Pause className='h-5 w-5' />
                      ) : (
                        <Play className='h-5 w-5' />
                      )}
                    </Button>
                    <div className='flex gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full h-10 w-10'
                      >
                        <Heart className='h-5 w-5' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full h-10 w-10'
                      >
                        <Share2 className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className='p-4'>
                  <Link href={`/r/${release.short_unique_id || release.id}`}>
                    <h3 className='font-bold text-white text-lg mb-1 hover:text-red-500 transition-colors'>
                      {release.title}
                    </h3>
                  </Link>
                  <Link href={`/artists/${release.record_owner.username}`}>
                    <p className='text-gray-400 hover:text-white transition-colors'>
                      {release.record_owner.artist_name ||
                        release.record_owner.username}
                    </p>
                  </Link>
                  <div className='flex items-center justify-between mt-3'>
                    <Badge className='bg-purple-900/50 text-purple-200'>
                      {release.genre?.name || 'Music'}
                    </Badge>
                    <span className='text-yellow-400 font-medium'>
                      R{calculateReleasePrice(release.tracks).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className='p-4 pt-0 flex justify-between items-center'>
                  <span className='text-xs text-gray-400'>
                    {release.tracks.length} tracks
                  </span>
                  <Button
                    size='sm'
                    className='bg-red-600 hover:bg-red-700 text-white'
                    onClick={() =>
                      router.push(`/r/${release.short_unique_id || release.id}`)
                    }
                  >
                    Listen Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Artists Section */}
      <section className='py-16 container mx-auto px-4'>
        <div className='flex justify-between items-center mb-10'>
          <div>
            <Badge className='bg-red-900 text-white mb-2'>
              <TrendingUp className='w-3 h-3 mr-1' /> Trending Now
            </Badge>
            <h2 className='text-3xl font-bold text-white'>Popular Artists</h2>
          </div>
          <Button
            variant='ghost'
            className='text-red-500 hover:text-red-400 hover:bg-red-500/10'
            onClick={() => router.push('/artists')}
          >
            Discover More <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>

        <ScrollArea className='w-full whitespace-nowrap pb-6'>
          <div className='flex space-x-6'>
            {trendingArtists.map((artist) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className='w-[220px] flex-shrink-0'
              >
                <Link href={`/artists/${artist.username}`}>
                  <div className='group relative'>
                    <div className='relative h-[220px] w-[220px] rounded-full overflow-hidden mb-4 ring-4 ring-red-500/20 group-hover:ring-red-500/50 transition-all duration-300'>
                      <Image
                        src={
                          artist.profile_image_url ||
                          '/placeholder.svg?height=400&width=400&query=music artist portrait' ||
                          '/placeholder.svg' ||
                          '/placeholder.svg' ||
                          '/placeholder.svg' ||
                          '/placeholder.svg' ||
                          '/placeholder.svg'
                        }
                        alt={artist.artist_name || artist.username}
                        fill
                        className='object-cover'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                        <Button
                          size='icon'
                          className='bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300'
                        >
                          <Play className='h-5 w-5' />
                        </Button>
                      </div>
                    </div>
                    <div className='text-center'>
                      <h3 className='font-bold text-white text-lg group-hover:text-red-500 transition-colors'>
                        {artist.artist_name || artist.username}
                      </h3>
                      <p className='text-gray-400 text-sm'>
                        {artist.likes_count || 0} followers
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </section>

      <section className='py-16 bg-gradient-to-r from-black/80 to-red-950/80 backdrop-blur-sm'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col lg:flex-row items-center justify-between gap-8'>
            <div className='lg:w-1/2'>
              <Badge className='bg-green-600 text-white mb-2'>
                <Sparkles className='w-3 h-3 mr-1' /> New Release
              </Badge>
              <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                Get the eSpazza App
              </h2>
              <p className='text-gray-300 mb-6 max-w-lg'>
                Take your music experience on the go with our Android app.
                Download now to enjoy all your favorite tracks, artists, and
                content offline.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button
                  size='lg'
                  className='bg-red-600 hover:bg-red-700 text-white'
                  onClick={() => (window.location.href = '/espazza.apk')}
                >
                  <ArrowRight className='mr-2 h-5 w-5' /> Download for Android
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-red-500 text-red-500 hover:bg-red-500/10'
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className='lg:w-1/2 relative'>
              <div className='relative h-[400px] w-full'>
                <Image
                  src='/app.webp'
                  alt='Espazza Mobile App'
                  fill
                  className='object-contain'
                />
                <div className='absolute -bottom-6 -right-6 bg-red-600 text-white p-4 rounded-full shadow-lg transform rotate-12'>
                  <Headphones className='h-8 w-8' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className='py-20 container mx-auto px-4'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className='bg-gradient-to-r from-red-600 to-red-900 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden'
        >
          <div className='absolute inset-0 opacity-20'>
            <Image
              src='/abstract-music-waveform.png'
              alt='Background Pattern'
              fill
              className='object-cover'
            />
          </div>
          <div className='relative z-10'>
            <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
              Ready to Elevate Your Music Experience?
            </h2>
            <p className='text-white/80 max-w-2xl mx-auto mb-8'>
              Join our community of music lovers and get exclusive access to
              premium content, early releases, and special events.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                className='bg-white text-red-600 hover:bg-white/90'
                onClick={() => router.push('/signup')}
              >
                Sign Up Now
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-white text-white hover:bg-white/10'
                onClick={() => router.push('/releases')}
              >
                Browse Music <ChevronRight className='ml-1 h-4 w-4' />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
