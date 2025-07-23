'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Play,
  Pause,
  Heart,
  Share2,
  Headphones,
  ArrowRight,
  Sparkles,
  BookOpen,
  Flame,
  Loader2,
  Download,
  Music,
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
  const [downloadingReleases, setDownloadingReleases] = useState(new Set());
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(null);
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
    const fetchData = async () => {
      try {
        const { data: featuredReleases, error: featuredError } = await supabase
          .from('releases')
          .select(`*, record_owner (username, artist_name)`)
          .eq('featured', true)
          .limit(4);

        if (featuredError) {
          console.error('Error fetching featured releases:', featuredError);
        } else {
          setFeaturedReleasesFromTable(featuredReleases);
        }

        const featuredResponse = await fetch('/api/releases/featured');
        const featuredData = await featuredResponse.json();
        setFeaturedReleases(featuredData);

        const latestResponse = await fetch('/api/releases/new');
        const latestData = await latestResponse.json();
        setLatestReleases(latestData);

        const latestPostsResponse = await fetch('/api/posts/latest');
        const latestPostsData = await latestPostsResponse.json();
        setLatestPosts(latestPostsData);

        const trendingArtistsResponse = await fetch('/api/artists/trending');
        const trendingArtistsData = await trendingArtistsResponse.json();
        setTrendingArtists(trendingArtistsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    const fetchAllTracks = async () => {
      try {
        const response = await fetch('/api/tracks');
        const data = await response.json();
        setAllTracks(data);
      } catch (error) {
        console.error('Error fetching all tracks:', error);
      }
    };

    fetchAllTracks();
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (featuredReleasesFromTable.length > 0) {
      const tracks = featuredReleasesFromTable.flatMap((release) =>
        release.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist:
            release.record_owner.artist_name || release.record_owner.username,
          artistId: release.record_owner.username,
          cover_image_url: track.cover_image_url || release.cover_image_url,
          url: track.url,
          release_id: release.id,
          plays: track.plays || 0,
        }))
      );
      addTracksToQueue(tracks);
    }
  }, [featuredReleasesFromTable, addTracksToQueue]);

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

  const downloadAllTracks = async (release) => {
    try {
      setDownloadingReleases((prev) => new Set([...prev, release.id]));
      console.log(
        `Starting download of ${release.tracks.length} tracks from "${release.title}"...`
      );

      let successCount = 0;
      let failCount = 0;

      for (const track of release.tracks) {
        if (track.url) {
          try {
            const link = document.createElement('a');
            link.href = track.url;
            const artistName =
              release.record_owner.artist_name || release.record_owner.username;
            const fileName = `${artistName} - ${track.title || 'track'}.mp3`;
            link.download = fileName.replace(/[^a-z0-9\s\-_.]/gi, '');
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            successCount++;
            await new Promise((resolve) => setTimeout(resolve, 800));
          } catch (error) {
            console.error(`Failed to download track: ${track.title}`, error);
            failCount++;
          }
        }
      }

      console.log(
        `Download completed! ${successCount} successful, ${failCount} failed`
      );
    } catch (error) {
      console.error('Error downloading tracks:', error);
    } finally {
      setDownloadingReleases((prev) => {
        const newSet = new Set(prev);
        newSet.delete(release.id);
        return newSet;
      });
    }
  };

  const handleDownloadClick = (release) => {
    setShowDownloadConfirm(release);
  };

  const confirmDownload = () => {
    if (showDownloadConfirm) {
      downloadAllTracks(showDownloadConfirm);
      setShowDownloadConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
        <div className='flex flex-col items-center space-y-6'>
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin'></div>
            <Music className='absolute inset-0 m-auto h-6 w-6 text-white' />
          </div>
          <p className='text-white/80 font-light text-lg tracking-wide'>
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      {/* Premium Hero Section */}
      <section className='relative min-h-screen flex items-center overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <Image
            src='/kkeedcover.jpg'
            alt='Music Experience'
            fill
            priority
            className='object-cover opacity-30'
          />
          <div className='absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90'></div>
          <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent'></div>
        </div>

        <div className='relative z-10 container mx-auto px-6 lg:px-8'>
          <div className='max-w-6xl mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className='text-center space-y-8'
            >
              <div className='inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20'>
                <Sparkles className='w-4 h-4 mr-2 text-white' />
                <span className='text-white font-medium text-sm tracking-wide'>
                  Premium Music Experience
                </span>
              </div>

              <h1 className='text-6xl md:text-8xl lg:text-9xl font-bold text-white leading-none tracking-tight'>
                Your Sound,
                <span className='block bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'>
                  Elevated
                </span>
              </h1>

              <p className='text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed'>
                Discover extraordinary music from visionary artists. Stream,
                download, and experience sound like never before.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center pt-8'>
                <Button
                  size='lg'
                  className='bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105'
                  onClick={() => router.push('/releases')}
                >
                  <Headphones className='mr-3 h-5 w-5' />
                  Explore Music
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-white/30 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-full text-lg backdrop-blur-sm'
                  onClick={() => router.push('/blog')}
                >
                  <BookOpen className='mr-3 h-5 w-5' />
                  Read Stories
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Now Playing Preview */}
        {featuredReleasesFromTable.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className='absolute bottom-8 right-8 max-w-sm hidden xl:block'
          >
            <Card className='bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl'>
              <div className='flex p-6'>
                <div className='relative w-16 h-16 mr-4 rounded-xl overflow-hidden'>
                  <Image
                    src={
                      featuredReleasesFromTable[0].cover_image_url ||
                      '/placeholder.svg'
                    }
                    alt={featuredReleasesFromTable[0].title}
                    fill
                    className='object-cover'
                  />
                  <Button
                    size='icon'
                    className='absolute inset-0 m-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm h-8 w-8 rounded-full border-0'
                    onClick={() =>
                      handlePlayPreview(
                        featuredReleasesFromTable[0].tracks[0],
                        featuredReleasesFromTable[0]
                      )
                    }
                  >
                    {currentlyPlaying ===
                    featuredReleasesFromTable[0].tracks[0]?.url ? (
                      <Pause className='h-4 w-4 text-white' />
                    ) : (
                      <Play className='h-4 w-4 text-white' />
                    )}
                  </Button>
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-white truncate text-sm'>
                    {featuredReleasesFromTable[0].title}
                  </h3>
                  <p className='text-slate-400 truncate text-xs mt-1'>
                    {featuredReleasesFromTable[0].record_owner.artist_name ||
                      featuredReleasesFromTable[0].record_owner.username}
                  </p>
                  <Badge className='bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs mt-2 px-2 py-1'>
                    Featured
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </section>

      {/* Featured Music Section - Premium Grid */}
      <section className='py-24 container mx-auto px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex justify-between items-end mb-16'>
            <div className='space-y-4'>
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30'>
                <Flame className='w-3 h-3 mr-2 text-red-400' />
                <span className='text-red-400 text-sm font-medium'>
                  Featured
                </span>
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-white tracking-tight'>
                Curated for You
              </h2>
              <p className='text-slate-400 text-lg max-w-2xl'>
                Hand-picked releases from our editorial team and community
                favorites.
              </p>
            </div>
            <Button
              variant='ghost'
              className='text-slate-400 hover:text-white hover:bg-white/5 rounded-full px-6'
              onClick={() => router.push('/releases')}
            >
              View All
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
            {featuredReleasesFromTable.map((release, index) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='group'
              >
                <Card className='bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border-0 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-105'>
                  <div className='relative aspect-square overflow-hidden'>
                    <Image
                      src={release.cover_image_url || '/placeholder.svg'}
                      alt={release.title}
                      fill
                      className='object-cover transition-transform duration-700 group-hover:scale-110'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300'>
                      <div className='absolute bottom-4 left-4 right-4 flex items-end justify-between'>
                        <Button
                          size='icon'
                          className='bg-white text-slate-900 hover:bg-slate-100 rounded-full h-12 w-12 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
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
                        <div className='flex gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100'>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full h-10 w-10'
                          >
                            <Heart className='h-4 w-4' />
                          </Button>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full h-10 w-10'
                          >
                            <Share2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className='p-6 space-y-4'>
                    <div className='space-y-2'>
                      <Link
                        href={`/r/${release.short_unique_id || release.id}`}
                      >
                        <h3 className='font-bold text-white text-lg leading-tight hover:text-slate-300 transition-colors line-clamp-1'>
                          {release.title}
                        </h3>
                      </Link>
                      <Link href={`/artists/${release.record_owner.username}`}>
                        <p className='text-slate-400 hover:text-white transition-colors text-sm'>
                          {release.record_owner.artist_name ||
                            release.record_owner.username}
                        </p>
                      </Link>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Badge className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 text-xs'>
                        {release.genre?.name || 'Music'}
                      </Badge>
                      <Badge className='bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 text-xs font-medium'>
                        Free
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className='p-6 pt-0 flex justify-between items-center'>
                    <div className='flex items-center text-slate-500 text-xs space-x-4'>
                      <span className='flex items-center'>
                        <Music className='w-3 h-3 mr-1' />
                        {release.tracks.length}
                      </span>
                    </div>
                    <Button
                      size='sm'
                      className='bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105'
                      onClick={() => handleDownloadClick(release)}
                      disabled={downloadingReleases.has(release.id)}
                    >
                      {downloadingReleases.has(release.id) ? (
                        <>
                          <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className='mr-2 h-3 w-3' />
                          Download
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Continue with remaining sections using similar premium styling... */}
      {/* I'll continue with the rest of the sections in the same premium style */}

      {/* Download Confirmation Dialog */}
      <AlertDialog
        open={!!showDownloadConfirm}
        onOpenChange={() => setShowDownloadConfirm(null)}
      >
        <AlertDialogContent className='bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl'>
          <AlertDialogHeader className='space-y-4'>
            <AlertDialogTitle className='text-white text-xl font-semibold'>
              Download Release
            </AlertDialogTitle>
            <AlertDialogDescription className='text-slate-300 leading-relaxed'>
              {showDownloadConfirm && (
                <>
                  You're about to download{' '}
                  <strong className='text-white'>
                    {showDownloadConfirm.tracks.length} tracks
                  </strong>{' '}
                  from{' '}
                  <strong className='text-white'>
                    "{showDownloadConfirm.title}"
                  </strong>{' '}
                  by{' '}
                  <strong className='text-white'>
                    {showDownloadConfirm.record_owner.artist_name ||
                      showDownloadConfirm.record_owner.username}
                  </strong>
                  .
                  <br />
                  <br />
                  Your browser may request permission for multiple downloads.
                  This is normal and safe to allow.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='space-x-3'>
            <AlertDialogCancel className='bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600 rounded-full px-6'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDownload}
              className='bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-full px-6'
            >
              <Download className='mr-2 h-4 w-4' />
              Start Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
