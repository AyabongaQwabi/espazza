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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Play,
  Video,
  User,
  Calendar,
  Search,
  TrendingUp,
  Share2,
  Filter,
  Sparkles,
  Youtube,
  ExternalLink,
  Clock,
  ChevronRight,
  LayoutList,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface VideoPromotion {
  id: string;
  created_at: string;
  youtube_link: string;
  promotional_text: string;
  user_id: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  error: string | null;
  transaction_id: string | null;
}

const ITEMS_PER_PAGE = 12;

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [videoDetailsOpen, setVideoDetailsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoPromotion | null>(
    null
  );
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const supabase = createClientComponentClient();

  // Fetch videos with pagination
  const fetchVideos = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let query = supabase
          .from('video_promotion_queue')
          .select('*', { count: 'exact' });

        // Filter by status (default to approved videos)

        // Search functionality
        if (searchTerm) {
          query = query.or(
            `promotional_text.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`
          );
        }

        // Sorting
        if (sortOption === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortOption === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else if (sortOption === 'username_asc') {
          query = query.order('username', { ascending: true });
        } else if (sortOption === 'username_desc') {
          query = query.order('username', { ascending: false });
        }

        // Pagination
        const from = (pageNum - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        console.log('Fetching videos with query:', query);

        const { data, error, count } = await query;
        console.log('Fetched videos:', data, 'Count:', count);
        if (error) {
          throw error;
        }

        const fetchedVideos = data || [];

        // More precise hasMore calculation
        const totalFetched = append
          ? videos.length + fetchedVideos.length
          : fetchedVideos.length;
        const hasMoreData = count
          ? totalFetched < count
          : fetchedVideos.length === ITEMS_PER_PAGE;

        setHasMore(hasMoreData);

        if (append && pageNum > 1) {
          setVideos((prev) => {
            // Prevent duplicates
            const existingIds = new Set(prev.map((v) => v.id));
            const newVideos = fetchedVideos.filter(
              (v) => !existingIds.has(v.id)
            );
            return [...prev, ...newVideos];
          });
        } else {
          setVideos(fetchedVideos);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: 'Error',
          description: 'Failed to load videos',
          variant: 'destructive',
        });
        setHasMore(false); // Stop trying to load more on error
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase, searchTerm, sortOption, statusFilter, videos.length]
  );

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px', // Increased margin to prevent premature loading
      }
    );

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = observer;

    const loadMoreElement = loadMoreRef.current;
    if (loadMoreElement && videos.length > 0) {
      // Only observe if we have videos
      observer.observe(loadMoreElement);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, videos.length]);

  // Load more videos when page changes (but not on initial load)
  useEffect(() => {
    if (page > 1 && !loading) {
      fetchVideos(page, true);
    }
  }, [page]);

  // Initial data fetch and reset when filters change
  useEffect(() => {
    setPage(1);
    setVideos([]); // Clear existing videos
    setHasMore(true); // Reset hasMore flag
    fetchVideos(1, false);
  }, [searchTerm, sortOption, statusFilter]);

  // Separate effect for search term debouncing (optional but recommended)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setVideos([]);
      setHasMore(true);
      fetchVideos(1, false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleShare = (video: VideoPromotion) => {
    if (navigator.share) {
      navigator
        .share({
          title: `Video by ${video.username}`,
          text:
            video.promotional_text ||
            `Check out this video by ${video.username}`,
          url:
            video.youtube_link ||
            `${window.location.origin}/videos/${video.id}`,
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
        video.youtube_link || `${window.location.origin}/videos/${video.id}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          video.promotional_text || `Check out this video by ${video.username}`
        )}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

  const openVideoDetails = (video: VideoPromotion) => {
    setSelectedVideo(video);
    setVideoDetailsOpen(true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-500/20 text-green-300 border-green-500/30'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-500/20 text-yellow-300 border-yellow-500/30'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className='bg-blue-500/20 text-blue-300 border-blue-500/30'>
            <Loader2 className='h-3 w-3 mr-1 animate-spin' />
            Processing
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-500/20 text-red-300 border-red-500/30'>
            <AlertCircle className='h-3 w-3 mr-1' />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gray-500/20 text-gray-300 border-gray-500/30'>
            {status}
          </Badge>
        );
    }
  };

  // Render a video card
  const renderVideoCard = (video: VideoPromotion) => (
    <Card
      key={video.id}
      className='bg-gray-800 border-gray-700 overflow-hidden hover:border-red-500/50 transition-colors'
    >
      <div className='relative aspect-video overflow-hidden group'>
        {video.youtube_link ? (
          <>
            <Image
              src={
                getYoutubeThumbnail(video.youtube_link) ||
                '/placeholder.svg?height=720&width=1280&query=video thumbnail' ||
                '/placeholder.svg' ||
                '/placeholder.svg'
              }
              alt={video.promotional_text || `Video by ${video.username}`}
              width={640}
              height={360}
              className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
              <Button
                size='icon'
                className='bg-red-600 hover:bg-red-700 rounded-full h-12 w-12'
                onClick={() => openVideoDetails(video)}
              >
                <Play className='h-6 w-6' />
              </Button>
            </div>
          </>
        ) : (
          <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
            <Video className='h-10 w-10 text-gray-500' />
          </div>
        )}
        {/* <div className='absolute top-2 right-2'>
          {getStatusBadge(video.status)}
        </div> */}
      </div>
      <CardContent className='p-3'>
        <h4
          className='font-semibold mb-1 line-clamp-2 hover:text-red-400 cursor-pointer'
          onClick={() => openVideoDetails(video)}
        >
          {video.promotional_text || `Video by ${video.username}`}
        </h4>

        <div className='flex items-center mt-1 mb-2'>
          <div className='h-5 w-5 rounded-full overflow-hidden bg-gray-700 mr-2 flex items-center justify-center'>
            <User className='h-3 w-3 text-gray-400' />
          </div>
          <span className='text-xs text-gray-300 truncate'>
            {video.username}
          </span>
        </div>

        <div className='flex items-center justify-between mt-2 text-sm text-gray-400'>
          <div className='flex items-center'>
            <Clock className='h-3 w-3 mr-1' />
            <span>{formatDate(video.created_at)}</span>
          </div>
          <div className='flex space-x-1'>
            {video.youtube_link && (
              <Button
                size='icon'
                variant='ghost'
                className='h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20'
                onClick={() => window.open(video.youtube_link, '_blank')}
              >
                <ExternalLink className='h-3 w-3' />
              </Button>
            )}
            <Button
              size='icon'
              variant='ghost'
              className='h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700'
              onClick={() => handleShare(video)}
            >
              <Share2 className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render a compact video row
  const renderCompactVideo = (video: VideoPromotion) => (
    <div
      key={video.id}
      className='flex items-center p-2 rounded-md hover:bg-gray-800 transition-colors group'
    >
      <div className='flex-shrink-0 mr-3 relative'>
        <div className='w-16 h-16 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-gray-700'>
          {video.youtube_link ? (
            <Image
              src={
                getYoutubeThumbnail(video.youtube_link) ||
                '/placeholder.svg?height=720&width=1280&query=video thumbnail' ||
                '/placeholder.svg' ||
                '/placeholder.svg'
              }
              alt={video.promotional_text || `Video by ${video.username}`}
              width={96}
              height={96}
              className='object-cover w-full h-full'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <Video className='h-6 w-6 text-gray-500' />
            </div>
          )}
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button
              size='icon'
              className='bg-red-600 hover:bg-red-700 rounded-full h-8 w-8'
              onClick={() => openVideoDetails(video)}
            >
              <Play className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
      <div className='flex-grow min-w-0'>
        <h4
          className='font-medium text-sm sm:text-base line-clamp-2 hover:text-red-400 cursor-pointer'
          onClick={() => openVideoDetails(video)}
        >
          {video.promotional_text || `Video by ${video.username}`}
        </h4>

        <div className='flex items-center mt-1'>
          <User className='h-3 w-3 mr-1 text-gray-400' />
          <span className='text-xs text-gray-400'>{video.username}</span>
        </div>

        {/* <div className='flex items-center text-xs text-gray-400 mt-1'>
          <Clock className='h-3 w-3 mr-1' />
          <span>{formatDate(video.created_at)}</span>
          <div className='ml-2'>{getStatusBadge(video.status)}</div>
        </div> */}
      </div>
      <div className='flex-shrink-0 ml-2 flex items-center space-x-1'>
        {video.youtube_link && (
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20'
            onClick={() => window.open(video.youtube_link, '_blank')}
          >
            <Youtube className='h-4 w-4' />
          </Button>
        )}
        <Button
          size='icon'
          variant='ghost'
          className='h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700'
          onClick={() => handleShare(video)}
        >
          <Share2 className='h-4 w-4' />
        </Button>
        <Button
          size='sm'
          variant='ghost'
          className='h-8 hidden sm:flex items-center text-gray-300 hover:text-white hover:bg-gray-700'
          onClick={() => openVideoDetails(video)}
        >
          Details
          <ChevronRight className='h-4 w-4 ml-1' />
        </Button>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col min-h-screen bg-gray-900 text-white'>
      {/* Video Details Dialog */}
      <Dialog open={videoDetailsOpen} onOpenChange={setVideoDetailsOpen}>
        <DialogContent className='bg-gray-800 border-red-500 text-white max-w-3xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {selectedVideo?.promotional_text ||
                `Video by ${selectedVideo?.username}`}
            </DialogTitle>
            <DialogDescription className='text-gray-300'>
              By {selectedVideo?.username}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            {selectedVideo?.youtube_link && (
              <div className='aspect-video w-full overflow-hidden rounded-lg'>
                <iframe
                  src={getYoutubeEmbedUrl(selectedVideo.youtube_link)}
                  className='w-full h-full'
                  allowFullScreen
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                ></iframe>
              </div>
            )}

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='flex-shrink-0'>
                  <div className='h-12 w-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center'>
                    <User className='h-6 w-6 text-gray-400' />
                  </div>
                </div>
                <div>
                  <h3 className='font-medium'>{selectedVideo?.username}</h3>
                  <p className='text-sm text-gray-400'>
                    {selectedVideo && formatDate(selectedVideo.created_at)}
                  </p>
                </div>
              </div>
              {/* {selectedVideo && getStatusBadge(selectedVideo.status)} */}
            </div>

            {selectedVideo?.promotional_text && (
              <div className='p-3 bg-gray-700/50 rounded-lg'>
                <p className='text-gray-300'>
                  {selectedVideo.promotional_text}
                </p>
              </div>
            )}

            <div className='flex justify-between pt-4 border-t border-gray-700'>
              <Button
                variant='outline'
                className='border-gray-700 text-white hover:bg-gray-700 bg-transparent'
                onClick={() => selectedVideo && handleShare(selectedVideo)}
              >
                <Share2 className='h-4 w-4 mr-2' />
                Share
              </Button>
              {selectedVideo?.youtube_link && (
                <Button
                  className='bg-red-600 hover:bg-red-700 text-white'
                  onClick={() =>
                    window.open(selectedVideo.youtube_link, '_blank')
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
          src='/kkeed.jpg'
          alt='Videos Hero'
          layout='fill'
          objectFit='cover'
          className='opacity-70'
        />
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <div className='text-center'>
            <h1 className='text-5xl font-bold mb-4 text-white drop-shadow-lg'>
              Discover New Mzansi Music Videos
            </h1>
            <p className='text-xl mb-8 text-white drop-shadow-lg max-w-2xl mx-auto'>
              Watch promotional videos and creative content from talented
              creators
            </p>
            <Button
              size='lg'
              className='bg-red-500 hover:bg-red-600 text-white'
              onClick={() =>
                document
                  .getElementById('videos')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Video className='mr-2 h-5 w-5' /> Browse Videos
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className='flex-grow' id='videos'>
        <div className='container mx-auto px-4 py-8'>
          {/* Search and Filter Bar */}
          <div className='flex items-center justify-between mb-8 sticky top-0 z-30 bg-gray-900 py-4 border-b border-gray-800'>
            <div className='relative flex-grow max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                type='text'
                placeholder='Search videos or creators...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white focus:ring-red-500 focus:border-red-500'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Tabs
                defaultValue='approved'
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                className='mr-2'
              >
                <TabsList className='bg-gray-800'>
                  <TabsTrigger
                    value='approved'
                    className='data-[state=active]:bg-green-500 data-[state=active]:text-white'
                  >
                    <CheckCircle className='h-4 w-4 mr-1' />
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value='pending'
                    className='data-[state=active]:bg-yellow-500 data-[state=active]:text-white'
                  >
                    <Clock className='h-4 w-4 mr-1' />
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value=''
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    <LayoutList className='h-4 w-4 mr-1' />
                    All
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant='outline'
                className='border-gray-700 text-white hover:bg-gray-800 bg-transparent'
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
                    className='border-gray-700 text-white hover:bg-gray-800 bg-transparent'
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
                      value='username_asc'
                      className='focus:bg-gray-700'
                    >
                      <User className='mr-2 h-4 w-4' /> Creator (A-Z)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value='username_desc'
                      className='focus:bg-gray-700'
                    >
                      <User className='mr-2 h-4 w-4' /> Creator (Z-A)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <h2 className='text-2xl font-bold mb-6'>
              <Sparkles className='inline-block mr-2 text-yellow-400' />
              Promotional Videos
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
            ) : videos.length === 0 ? (
              <div className='text-center py-12 bg-gray-800 rounded-lg'>
                <Video className='h-16 w-16 mx-auto mb-4 text-gray-600' />
                <h3 className='text-xl font-semibold mb-2'>No videos found</h3>
                <p className='text-gray-400'>
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {videos.map((video) => renderVideoCard(video))}
              </div>
            ) : (
              <div className='space-y-2 bg-gray-800/30 rounded-lg p-2'>
                {videos.map((video) => renderCompactVideo(video))}
              </div>
            )}

            {/* Load more indicator - only show if we have videos */}
            {videos.length > 0 && (
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
                    <span>Loading more videos...</span>
                  </div>
                ) : hasMore ? (
                  <Button
                    variant='outline'
                    className='border-gray-700 hover:bg-gray-700 bg-transparent'
                    onClick={() => {
                      if (!loadingMore && hasMore) {
                        setPage(page + 1);
                      }
                    }}
                  >
                    Load More Videos
                  </Button>
                ) : videos.length > 0 ? (
                  <span className='text-gray-400'>No more videos to load</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
