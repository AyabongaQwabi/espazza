'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import {
  MusicIcon,
  Loader2,
  Heart,
  MessageCircle,
  Share2,
  BookmarkIcon,
  PlayCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const POSTS_PER_PAGE = 5; // Reduced to load fewer posts at a time for better performance

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const supabase = createClientComponentClient();

  // Function to fetch posts
  const fetchPosts = useCallback(
    async (pageNumber) => {
      const start = (pageNumber - 1) * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE - 1;

      try {
        const {
          data: newPosts,
          count,
          error,
        } = await supabase
          .from('blog_posts')
          .select(
            `
          *,
          profiles:author_id (username, full_name, profile_image_url),
          likes:blog_likes(count),
          comments:blog_comments(count)
        `,
            { count: 'exact' }
          )
          .eq('published', true)
          .order('created_at', { ascending: false })
          .range(start, end);

        if (error) {
          console.error('Error fetching posts:', error);
          return false;
        }

        if (newPosts && newPosts.length > 0) {
          // If it's the first page, replace posts, otherwise append
          setPosts((prevPosts) =>
            pageNumber === 1 ? newPosts : [...prevPosts, ...newPosts]
          );

          // Check if we've reached the end
          setHasMore(start + newPosts.length < (count || 0));
          return true;
        } else {
          setHasMore(false);
          return false;
        }
      } catch (error) {
        console.error('Error in fetchPosts:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPosts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, fetchPosts]);

  // Format date for display
  const formatPostDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url) => {
    if (!url) return null;

    // Handle different YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading && posts.length === 0) {
    return (
      <div className='min-h-screen bg-black pt-24 flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-8 w-8 text-red-600 animate-spin' />
          <p className='mt-4 text-white'>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className='min-h-screen bg-black pt-24'>
        <div className='max-w-2xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
              iiPosts
            </h1>
            <p className='text-zinc-400 text-lg'>
              Stories from the Xhosa Hip Hop Community
            </p>
          </div>

          <div className='text-center py-20'>
            <MusicIcon className='h-12 w-12 text-red-600 mx-auto mb-6' />
            <h2 className='text-2xl font-semibold text-white mb-4'>
              Ungabhala iiPosts
            </h2>
            <p className='text-zinc-400 mb-8'>
              You can create your own blog posts to share with the community.
            </p>
            <p className='text-zinc-500'>
              Check back later for updates or{' '}
              <Link
                href='/register'
                className='text-red-500 hover:text-red-400'
              >
                register
              </Link>{' '}
              to contribute your own stories.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black pt-24'>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            iiPosts
          </h1>
          <p className='text-zinc-400 text-lg'>
            Stories from the Xhosa Hip Hop Community
          </p>
        </div>

        <div className='space-y-6'>
          {posts.map((post, index) => (
            <motion.div
              key={`${post.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
              className='bg-zinc-900 rounded-lg overflow-hidden'
            >
              {/* Post Header */}
              <div className='p-4 flex items-center space-x-3 border-b border-zinc-800'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage
                    src={post.profiles?.profile_image_url || '/placeholder.svg'}
                    alt={post.profiles?.username || 'User'}
                  />
                  <AvatarFallback>
                    {(post.profiles?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <Link
                    href={`/profile/${post.profiles?.username}`}
                    className='font-semibold text-white hover:underline'
                  >
                    {post.profiles?.full_name || post.profiles?.username}
                  </Link>
                  <p className='text-xs text-zinc-500'>
                    {formatPostDate(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className='p-4'>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className='text-xl font-bold text-white mb-2'>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className='text-zinc-400 mb-4'>{post.excerpt}</p>
                  )}
                </Link>

                {/* Featured Image - Improved cropping */}
                {post.featured_image && (
                  <Link href={`/blog/${post.slug}`}>
                    <div className='mt-3 mb-4 rounded-lg overflow-hidden'>
                      <img
                        src={post.featured_image || '/placeholder.svg'}
                        alt={post.title}
                        className='w-full max-h-[400px] object-contain bg-zinc-950'
                      />
                    </div>
                  </Link>
                )}

                {/* Media Content - YouTube or Audio */}
                {(post.youtube_url || post.audio_url) && (
                  <div className='mt-3 mb-4 rounded-lg overflow-hidden'>
                    {post.youtube_url &&
                      getYoutubeVideoId(post.youtube_url) && (
                        <div className='aspect-video mb-3 bg-zinc-950 rounded-lg overflow-hidden'>
                          <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeVideoId(
                              post.youtube_url
                            )}`}
                            title={post.title}
                            className='w-full h-full'
                            allowFullScreen
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            loading='lazy'
                          />
                        </div>
                      )}

                    {post.audio_url && (
                      <div className='bg-zinc-800 p-3 rounded-lg'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <PlayCircle className='h-5 w-5 text-red-500' />
                          <span className='text-sm text-zinc-300'>
                            Audio Track
                          </span>
                        </div>
                        <audio controls className='w-full h-10'>
                          <source src={post.audio_url} type='audio/mpeg' />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className='px-4 pb-4'>
                <div className='flex justify-between items-center mb-3'>
                  <div className='flex space-x-4'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-red-500 px-2'
                    >
                      <Heart className='h-5 w-5 mr-1' />
                      <span>{post.likes?.[0]?.count || 0}</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-blue-500 px-2'
                    >
                      <MessageCircle className='h-5 w-5 mr-1' />
                      <span>{post.comments?.[0]?.count || 0}</span>
                    </Button>
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-zinc-300 px-2'
                    >
                      <Share2 className='h-5 w-5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-zinc-300 px-2'
                    >
                      <BookmarkIcon className='h-5 w-5' />
                    </Button>
                  </div>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className='text-sm text-zinc-500 hover:text-zinc-300'
                >
                  View full post
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loader element for infinite scroll */}
        <div
          ref={loaderRef}
          className='flex justify-center items-center py-8 mt-8'
        >
          {hasMore ? (
            <Loader2 className='h-8 w-8 text-red-600 animate-spin' />
          ) : posts.length > 0 ? (
            <p className='text-zinc-500'>You've reached the end</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
