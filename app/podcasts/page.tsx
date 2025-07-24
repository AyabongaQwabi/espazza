'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Play,
  Mic,
  User,
  Calendar,
  Search,
  TrendingUp,
  Headphones,
  Share2,
  Filter,
  Sparkles,
  Youtube,
  ExternalLink,
  Clock,
  ChevronRight,
  ListMusic,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';

interface Podcaster {
  id: string;
  podcast_name: string;
  youtube_channel_link: string;
  profile_image_url: string;
  created_at: string;
  updated_at: string;
  episodes: PodcastEpisode[];
}

interface PodcastEpisode {
  id: string;
  title: string;
  podcaster_id: string;
  featured_artist_id: string;
  youtube_link: string;
  created_at: string;
  updated_at: string;
  podcaster?: {
    id: string;
    podcast_name: string;
    profile_image_url: string;
  };
  featured_artist?: {
    id: string;
    username: string;
    artist_name: string;
    profile_image_url: string;
  };
}

const ITEMS_PER_PAGE = 12;

export default function PodcastsPage() {
  const [podcasters, setPodcasters] = useState<Podcaster[]>([]);
  const [allEpisodes, setAllEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [episodeDetailsOpen, setEpisodeDetailsOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(
    null
  );
  const [selectedPodcaster, setSelectedPodcaster] = useState<Podcaster | null>(
    null
  );
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [viewType, setViewType] = useState<'flat' | 'grouped'>('flat');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const supabase = createClientComponentClient();

  // Fetch all episodes for flat view
  const fetchAllEpisodes = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let query = supabase.from('podcast_episodes').select(
          `
            *,
            podcaster:podcaster_id(id, podcast_name, profile_image_url),
            featured_artist:featured_artist_id(id, username, artist_name, profile_image_url)
          `,
          { count: 'exact' }
        );

        if (searchTerm) {
          query = query.or(
            `title.ilike.%${searchTerm}%,podcaster.podcast_name.ilike.%${searchTerm}%`
          );
        }

        if (sortOption === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortOption === 'oldest') {
          query = query.order('created_at', { ascending: true });
        }

        // Pagination
        const from = (pageNum - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        // Check if there are more episodes to load
        const hasMoreData =
          data.length === ITEMS_PER_PAGE &&
          (count ? from + data.length < count : true);
        setHasMore(hasMoreData);

        if (append && pageNum > 1) {
          setAllEpisodes((prev) => [...prev, ...(data || [])]);
        } else {
          setAllEpisodes(data || []);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load episodes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase, searchTerm, sortOption]
  );

  // Fetch podcasters with their episodes for grouped view
  const fetchPodcasters = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('podcasters').select('*');

    if (searchTerm) {
      query = query.or(
        `podcast_name.ilike.%${searchTerm}%,podcast_episodes.title.ilike.%${searchTerm}%`
      );
    }

    if (sortOption === 'most_episodes') {
      // We'll sort by episode count after fetching
    } else if (sortOption === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortOption === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortOption === 'name_asc') {
      query = query.order('podcast_name', { ascending: true });
    } else if (sortOption === 'name_desc') {
      query = query.order('podcast_name', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching podcasters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load podcasters',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Fetch episodes for each podcaster
    const podcastersWithEpisodes = await Promise.all(
      (data || []).map(async (podcaster) => {
        let episodesQuery = supabase
          .from('podcast_episodes')
          .select(
            `
            *,
            featured_artist:featured_artist_id(id, username, artist_name, profile_image_url)
          `
          )
          .eq('podcaster_id', podcaster.id);

        if (searchTerm) {
          episodesQuery = episodesQuery.ilike('title', `%${searchTerm}%`);
        }

        // Sort episodes by created_at date (newest first)
        episodesQuery = episodesQuery.order('created_at', { ascending: false });

        const { data: episodesData, error: episodesError } =
          await episodesQuery;

        if (episodesError) {
          console.error('Error fetching episodes:', episodesError);
          return {
            ...podcaster,
            episodes: [],
          };
        }

        return {
          ...podcaster,
          episodes: episodesData || [],
        };
      })
    );

    // Filter out podcasters with no episodes if searching
    let filteredPodcasters = searchTerm
      ? podcastersWithEpisodes.filter(
          (podcaster) => podcaster.episodes.length > 0
        )
      : podcastersWithEpisodes;

    // Sort by number of episodes if that option is selected
    if (sortOption === 'most_episodes') {
      filteredPodcasters = filteredPodcasters.sort(
        (a, b) => b.episodes.length - a.episodes.length
      );
    }

    setPodcasters(filteredPodcasters || []);
    setLoading(false);
  }, [supabase, searchTerm, sortOption]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (viewType !== 'flat') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Lower threshold and add rootMargin for earlier detection
    );

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = observer;

    const loadMoreElement = loadMoreRef.current;
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadingMore, hasMore, viewType, allEpisodes.length]);

  // Load more episodes when page changes
  useEffect(() => {
    if (viewType === 'flat' && page > 1) {
      fetchAllEpisodes(page, true);
    }
  }, [page, viewType, fetchAllEpisodes]);

  // Initial data fetch
  useEffect(() => {
    if (viewType === 'flat') {
      setPage(1);
      fetchAllEpisodes(1, false);
    } else {
      fetchPodcasters();
    }
  }, [viewType, fetchAllEpisodes, fetchPodcasters, searchTerm, sortOption]);

  const handleShare = (episode: PodcastEpisode) => {
    const podcasterName =
      episode.podcaster?.podcast_name ||
      selectedPodcaster?.podcast_name ||
      'Podcast';

    if (navigator.share) {
      navigator
        .share({
          title: episode.title,
          text: `Check out this episode of ${podcasterName}: ${episode.title}`,
          url:
            episode.youtube_link ||
            `${window.location.origin}/podcasts/episode/${episode.id}`,
        })
        .then(() => {
          console.log('Shared successfully');
        })
        .catch((error) => {
          console.error('Error sharing:', error);
        });
    } else {
      // Fallback for browsers that don't support navigator.share
      const shareUrl =
        episode.youtube_link ||
        `${window.location.origin}/podcasts/episode/${episode.id}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out this episode of ${podcasterName}: ${episode.title}`
        )}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

  const openEpisodeDetails = async (episode: PodcastEpisode) => {
    setSelectedEpisode(episode);

    // If we're in flat view, we need to fetch the podcaster details
    if (viewType === 'flat' && episode.podcaster) {
      const { data, error } = await supabase
        .from('podcasters')
        .select('*')
        .eq('id', episode.podcaster_id)
        .single();

      if (!error && data) {
        setSelectedPodcaster(data);
      } else {
        setSelectedPodcaster({
          id: episode.podcaster_id,
          podcast_name: episode.podcaster?.podcast_name || 'Unknown Podcast',
          profile_image_url: episode.podcaster?.profile_image_url || '',
          youtube_channel_link: '',
          created_at: '',
          updated_at: '',
          episodes: [],
        });
      }
    } else if (viewType === 'grouped') {
      // Find the podcaster from our existing data
      const podcaster = podcasters.find((p) => p.id === episode.podcaster_id);
      if (podcaster) {
        setSelectedPodcaster(podcaster);
      }
    }

    setEpisodeDetailsOpen(true);
  };

  const getYoutubeEmbedUrl = (youtubeLink: string) => {
    if (!youtubeLink) return null;

    // Extract video ID from various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeLink.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }

    return null;
  };

  const getYoutubeThumbnail = (youtubeLink: string) => {
    if (!youtubeLink) return null;

    // Extract video ID from various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeLink.match(regExp);

    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }

    return null;
  };

  const handlePlayVideo = (youtubeLink: string) => {
    if (currentlyPlaying === youtubeLink) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(youtubeLink);
      window.open(youtubeLink, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render an episode card (used in both views)
  const renderEpisodeCard = (episode: PodcastEpisode) => (
    <Card
      key={episode.id}
      className='bg-gray-800 border-gray-700 overflow-hidden hover:border-red-500/50 transition-colors'
    >
      <div className='relative aspect-video overflow-hidden group'>
        {episode.youtube_link ? (
          <>
            <Image
              src={
                getYoutubeThumbnail(episode.youtube_link) ||
                '/placeholder.svg?height=720&width=1280&query=podcast episode' ||
                '/placeholder.svg' ||
                '/placeholder.svg' ||
                '/placeholder.svg'
              }
              alt={episode.title}
              width={640}
              height={360}
              className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
              <Button
                size='icon'
                className='bg-red-600 hover:bg-red-700 rounded-full h-12 w-12'
                onClick={() => openEpisodeDetails(episode)}
              >
                <Play className='h-6 w-6' />
              </Button>
            </div>
          </>
        ) : (
          <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
            <Mic className='h-10 w-10 text-gray-500' />
          </div>
        )}
        {episode.featured_artist && (
          <Badge className='absolute top-2 right-2 bg-red-500 text-white'>
            Featured Artist
          </Badge>
        )}
      </div>
      <CardContent className='p-3'>
        <h4
          className='font-semibold mb-1 line-clamp-2 hover:text-red-400 cursor-pointer'
          onClick={() => openEpisodeDetails(episode)}
        >
          {episode.title}
        </h4>

        {/* Show podcaster name in flat view */}
        {viewType === 'flat' && episode.podcaster && (
          <div className='flex items-center mt-1 mb-2'>
            <div className='h-5 w-5 rounded-full overflow-hidden bg-gray-700 mr-2'>
              {episode.podcaster.profile_image_url ? (
                <Image
                  src={
                    episode.podcaster.profile_image_url || '/placeholder.svg'
                  }
                  alt={episode.podcaster.podcast_name}
                  width={20}
                  height={20}
                  className='object-cover'
                />
              ) : (
                <Mic className='h-3 w-3 text-gray-400' />
              )}
            </div>
            <span className='text-xs text-gray-300 truncate'>
              {episode.podcaster.podcast_name}
            </span>
          </div>
        )}

        <div className='flex items-center justify-between mt-2 text-sm text-gray-400'>
          <div className='flex items-center'>
            <Clock className='h-3 w-3 mr-1' />
            <span>{formatDate(episode.created_at)}</span>
          </div>
          <div className='flex space-x-1'>
            {episode.youtube_link && (
              <Button
                size='icon'
                variant='ghost'
                className='h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20'
                onClick={() => window.open(episode.youtube_link, '_blank')}
              >
                <ExternalLink className='h-3 w-3' />
              </Button>
            )}
            <Button
              size='icon'
              variant='ghost'
              className='h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700'
              onClick={() => handleShare(episode)}
            >
              <Share2 className='h-3 w-3' />
            </Button>
          </div>
        </div>
        {episode.featured_artist && (
          <div className='flex items-center mt-2 pt-2 border-t border-gray-700'>
            <div className='h-5 w-5 rounded-full overflow-hidden bg-gray-700 mr-2'>
              {episode.featured_artist.profile_image_url ? (
                <Image
                  src={
                    episode.featured_artist.profile_image_url ||
                    '/placeholder.svg'
                  }
                  alt={
                    episode.featured_artist.artist_name ||
                    episode.featured_artist.username
                  }
                  width={20}
                  height={20}
                  className='object-cover'
                />
              ) : (
                <User className='h-3 w-3 text-gray-400' />
              )}
            </div>
            <span className='text-xs text-gray-300 truncate'>
              {episode.featured_artist.artist_name ||
                episode.featured_artist.username}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render a compact episode row (used in both views)
  const renderCompactEpisode = (episode: PodcastEpisode) => (
    <div
      key={episode.id}
      className='flex items-center p-2 rounded-md hover:bg-gray-800 transition-colors group'
    >
      <div className='flex-shrink-0 mr-3 relative'>
        <div className='w-16 h-16 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-gray-700'>
          {episode.youtube_link ? (
            <Image
              src={
                getYoutubeThumbnail(episode.youtube_link) ||
                '/placeholder.svg?height=720&width=1280&query=podcast episode' ||
                '/placeholder.svg' ||
                '/placeholder.svg' ||
                '/placeholder.svg'
              }
              alt={episode.title}
              width={96}
              height={96}
              className='object-cover w-full h-full'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <Mic className='h-6 w-6 text-gray-500' />
            </div>
          )}
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button
              size='icon'
              className='bg-red-600 hover:bg-red-700 rounded-full h-8 w-8'
              onClick={() => openEpisodeDetails(episode)}
            >
              <Play className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
      <div className='flex-grow min-w-0'>
        <h4
          className='font-medium text-sm sm:text-base line-clamp-2 hover:text-red-400 cursor-pointer'
          onClick={() => openEpisodeDetails(episode)}
        >
          {episode.title}
        </h4>

        {/* Show podcaster name in flat view */}
        {viewType === 'flat' && episode.podcaster && (
          <div className='flex items-center mt-1'>
            <Mic className='h-3 w-3 mr-1 text-gray-400' />
            <span className='text-xs text-gray-400'>
              {episode.podcaster.podcast_name}
            </span>
          </div>
        )}

        <div className='flex items-center text-xs text-gray-400 mt-1'>
          <Clock className='h-3 w-3 mr-1' />
          <span>{formatDate(episode.created_at)}</span>
          {episode.featured_artist && (
            <Badge className='ml-2 bg-red-500/20 text-red-300 text-[10px] px-1'>
              <User className='h-2 w-2 mr-1' />
              {episode.featured_artist.artist_name ||
                episode.featured_artist.username}
            </Badge>
          )}
        </div>
      </div>
      <div className='flex-shrink-0 ml-2 flex items-center space-x-1'>
        {episode.youtube_link && (
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20'
            onClick={() => window.open(episode.youtube_link, '_blank')}
          >
            <Youtube className='h-4 w-4' />
          </Button>
        )}
        <Button
          size='icon'
          variant='ghost'
          className='h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700'
          onClick={() => handleShare(episode)}
        >
          <Share2 className='h-4 w-4' />
        </Button>
        <Button
          size='sm'
          variant='ghost'
          className='h-8 hidden sm:flex items-center text-gray-300 hover:text-white hover:bg-gray-700'
          onClick={() => openEpisodeDetails(episode)}
        >
          Details
          <ChevronRight className='h-4 w-4 ml-1' />
        </Button>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col min-h-screen bg-gray-900 text-white'>
      {/* Episode Details Dialog */}
      <Dialog open={episodeDetailsOpen} onOpenChange={setEpisodeDetailsOpen}>
        <DialogContent className='bg-gray-800 border-red-500 text-white max-w-3xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {selectedEpisode?.title}
            </DialogTitle>
            <DialogDescription className='text-gray-300'>
              {selectedPodcaster?.podcast_name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            {selectedEpisode?.youtube_link && (
              <div className='aspect-video w-full overflow-hidden rounded-lg'>
                <iframe
                  src={getYoutubeEmbedUrl(selectedEpisode.youtube_link)}
                  className='w-full h-full'
                  allowFullScreen
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                ></iframe>
              </div>
            )}

            <div className='flex items-center space-x-4'>
              <div className='flex-shrink-0'>
                <div className='h-12 w-12 rounded-full overflow-hidden bg-gray-700'>
                  {selectedPodcaster?.profile_image_url ? (
                    <Image
                      src={
                        selectedPodcaster.profile_image_url ||
                        '/placeholder.svg'
                      }
                      alt={selectedPodcaster.podcast_name}
                      width={48}
                      height={48}
                      className='object-cover'
                    />
                  ) : (
                    <div className='flex items-center justify-center h-full w-full'>
                      <Mic className='h-6 w-6 text-gray-400' />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className='font-medium'>
                  {selectedPodcaster?.podcast_name}
                </h3>
                <p className='text-sm text-gray-400'>
                  {selectedEpisode && formatDate(selectedEpisode.created_at)}
                </p>
              </div>
            </div>

            {selectedEpisode?.featured_artist && (
              <div className='flex items-center p-3 bg-gray-700/50 rounded-lg'>
                <div className='flex-shrink-0 mr-3'>
                  <div className='h-10 w-10 rounded-full overflow-hidden bg-gray-700'>
                    {selectedEpisode.featured_artist.profile_image_url ? (
                      <Image
                        src={
                          selectedEpisode.featured_artist.profile_image_url ||
                          '/placeholder.svg'
                        }
                        alt={
                          selectedEpisode.featured_artist.artist_name ||
                          selectedEpisode.featured_artist.username
                        }
                        width={40}
                        height={40}
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-full w-full'>
                        <User className='h-5 w-5 text-gray-400' />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Badge className='bg-red-500/20 text-red-300 mb-1'>
                    Featured Artist
                  </Badge>
                  <h4 className='font-medium'>
                    {selectedEpisode.featured_artist.artist_name ||
                      selectedEpisode.featured_artist.username}
                  </h4>
                </div>
              </div>
            )}

            <div className='flex justify-between pt-4 border-t border-gray-700'>
              <Button
                variant='outline'
                className='border-gray-700 text-white hover:bg-gray-700'
                onClick={() => selectedEpisode && handleShare(selectedEpisode)}
              >
                <Share2 className='h-4 w-4 mr-2' />
                Share
              </Button>
              {selectedEpisode?.youtube_link && (
                <Button
                  className='bg-red-600 hover:bg-red-700 text-white'
                  onClick={() =>
                    window.open(selectedEpisode.youtube_link, '_blank')
                  }
                >
                  <Youtube className='h-4 w-4 mr-2' />
                  Watch on YouTube
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className='relative h-[40vh] overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10'></div>
        <Image
          src='/podcast-hero.png'
          alt='Podcasts Hero'
          layout='fill'
          objectFit='cover'
          className='opacity-70'
        />
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <div className='text-center'>
            <h1 className='text-5xl font-bold mb-4 text-white drop-shadow-lg'>
              Discover SA Music Related Podcast Episodes
            </h1>
            <p className='text-xl mb-8 text-white drop-shadow-lg max-w-2xl mx-auto'>
              Watch thought-provoking conversations and stories from your
              favorite creators
            </p>
            <Button
              size='lg'
              className='bg-red-500 hover:bg-red-600 text-white'
              onClick={() =>
                document
                  .getElementById('podcasts')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Headphones className='mr-2 h-5 w-5' /> Browse Episodes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className='flex-grow' id='podcasts'>
        <div className='container mx-auto px-4 py-8'>
          {/* Search and Filter Bar */}
          <div className='flex items-center justify-between mb-8 sticky top-0 z-30 bg-gray-900 py-4 border-b border-gray-800'>
            <div className='relative flex-grow max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                type='text'
                placeholder='Search episodes or podcasters...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white focus:ring-red-500 focus:border-red-500'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Tabs
                defaultValue='flat'
                value={viewType}
                onValueChange={(value) =>
                  setViewType(value as 'flat' | 'grouped')
                }
                className='mr-2'
              >
                <TabsList className='bg-gray-800'>
                  <TabsTrigger
                    value='flat'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    <LayoutList className='h-4 w-4 mr-1' />
                    All Episodes
                  </TabsTrigger>
                  <TabsTrigger
                    value='grouped'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    <LayoutGrid className='h-4 w-4 mr-1' />
                    By Podcaster
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant='outline'
                className='border-gray-700 text-white hover:bg-gray-800'
                onClick={() =>
                  setViewMode(viewMode === 'grid' ? 'compact' : 'grid')
                }
              >
                <Filter className='h-4 w-4 mr-2' />
                {viewMode === 'grid' ? 'Compact View' : 'Grid View'}
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
                    {viewType === 'grouped' && (
                      <DropdownMenuRadioItem
                        value='most_episodes'
                        className='focus:bg-gray-700'
                      >
                        <ListMusic className='mr-2 h-4 w-4' /> Most Episodes
                      </DropdownMenuRadioItem>
                    )}
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
                    {viewType === 'grouped' && (
                      <>
                        <DropdownMenuRadioItem
                          value='name_asc'
                          className='focus:bg-gray-700'
                        >
                          <TrendingUp className='mr-2 h-4 w-4' /> Name (A-Z)
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value='name_desc'
                          className='focus:bg-gray-700'
                        >
                          <TrendingUp className='mr-2 h-4 w-4' /> Name (Z-A)
                        </DropdownMenuRadioItem>
                      </>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <h2 className='text-2xl font-bold mb-6'>
              <Sparkles className='inline-block mr-2 text-yellow-400' />
              {viewType === 'flat'
                ? 'Latest Podcast Episodes'
                : 'Podcasts & Episodes'}
            </h2>

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
            ) : viewType === 'flat' ? (
              // Flat view - all episodes in a single list
              <>
                {allEpisodes.length === 0 ? (
                  <div className='text-center py-12 bg-gray-800 rounded-lg'>
                    <Mic className='h-16 w-16 mx-auto mb-4 text-gray-600' />
                    <h3 className='text-xl font-semibold mb-2'>
                      No episodes found
                    </h3>
                    <p className='text-gray-400'>
                      Try adjusting your search terms
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {allEpisodes.map((episode) => renderEpisodeCard(episode))}
                  </div>
                ) : (
                  <div className='space-y-2 bg-gray-800/30 rounded-lg p-2'>
                    {allEpisodes.map((episode) =>
                      renderCompactEpisode(episode)
                    )}
                  </div>
                )}

                {/* Load more indicator */}
                <div
                  ref={loadMoreRef}
                  className='flex justify-center items-center py-8 mt-4 bg-gray-800/20 rounded-lg'
                >
                  {loadingMore ? (
                    <div className='flex items-center'>
                      <svg
                        className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      <span>Loading more episodes...</span>
                    </div>
                  ) : hasMore ? (
                    <Button
                      variant='outline'
                      className='border-gray-700 hover:bg-gray-700'
                      onClick={() => setPage(page + 1)}
                    >
                      Load More Episodes
                    </Button>
                  ) : (
                    <span className='text-gray-400'>
                      No more episodes to load
                    </span>
                  )}
                </div>
              </>
            ) : (
              // Grouped view - episodes grouped by podcaster
              <>
                {podcasters.length === 0 ? (
                  <div className='text-center py-12 bg-gray-800 rounded-lg'>
                    <Mic className='h-16 w-16 mx-auto mb-4 text-gray-600' />
                    <h3 className='text-xl font-semibold mb-2'>
                      No podcasts found
                    </h3>
                    <p className='text-gray-400'>
                      Try adjusting your search terms
                    </p>
                  </div>
                ) : (
                  <div className='space-y-12'>
                    {podcasters.map((podcaster) => (
                      <div key={podcaster.id} className='mb-10'>
                        {/* Podcaster Header */}
                        <div className='flex items-center justify-between mb-4'>
                          <div className='flex items-center'>
                            <div className='h-12 w-12 rounded-full overflow-hidden bg-gray-800 mr-3'>
                              {podcaster.profile_image_url ? (
                                <Image
                                  src={
                                    podcaster.profile_image_url ||
                                    '/placeholder.svg'
                                  }
                                  alt={podcaster.podcast_name}
                                  width={48}
                                  height={48}
                                  className='object-cover'
                                />
                              ) : (
                                <div className='flex items-center justify-center h-full w-full bg-gray-700'>
                                  <Mic className='h-6 w-6 text-gray-400' />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className='text-xl font-bold'>
                                {podcaster.podcast_name}
                              </h3>
                              <div className='flex items-center text-sm text-gray-400'>
                                <span>
                                  {podcaster.episodes.length} episodes
                                </span>
                                {podcaster.youtube_channel_link && (
                                  <a
                                    href={podcaster.youtube_channel_link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='ml-3 text-red-400 hover:text-red-300 flex items-center'
                                  >
                                    <Youtube className='h-3 w-3 mr-1' />
                                    YouTube Channel
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator className='my-4 bg-gray-800' />

                        {/* Episodes Grid/Compact View */}
                        {podcaster.episodes.length === 0 ? (
                          <div className='text-center py-8 bg-gray-800/50 rounded-lg'>
                            <p className='text-gray-400'>
                              No episodes available for this podcaster
                            </p>
                          </div>
                        ) : viewMode === 'grid' ? (
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                            {podcaster.episodes.map((episode) =>
                              renderEpisodeCard(episode)
                            )}
                          </div>
                        ) : (
                          <div className='space-y-2 bg-gray-800/30 rounded-lg p-2'>
                            {podcaster.episodes.map((episode) =>
                              renderCompactEpisode(episode)
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
