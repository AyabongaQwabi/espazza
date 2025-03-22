'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { MusicIcon, Loader2, Heart, Search, Share2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState(null);
  const [postLikes, setPostLikes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const loaderRef = useRef(null);
  const supabase = createClientComponentClient();

  const POSTS_PER_PAGE = 9; // Changed to 9 for 3x3 grid

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

          // Initialize likes for each post
          const likesObj = {};
          for (const post of newPosts) {
            await fetchLikes(post.id, likesObj);
          }

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

  // Search posts function
  const searchPosts = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(
            `
            *,
            profiles:author_id (username, full_name, profile_image_url),
            likes:blog_likes(count),
            comments:blog_comments(count)
          `
          )
          .eq('published', true)
          .or(
            `title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`
          )
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error searching posts:', error);
          toast({
            title: 'Search Error',
            description: 'Failed to search posts. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        setSearchResults(data || []);

        // Initialize likes for search results
        const likesObj = { ...postLikes };
        for (const post of data || []) {
          await fetchLikes(post.id, likesObj);
        }
      } catch (error) {
        console.error('Error in searchPosts:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [supabase, postLikes]
  );

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    checkAuth();
  }, [supabase]);

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !searchQuery) {
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
  }, [hasMore, loading, fetchPosts, searchQuery]);

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPosts(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPosts]);

  // Fetch likes for a post
  async function fetchLikes(postId, likesObj = postLikes) {
    try {
      const { data: likes } = await supabase
        .from('blog_likes')
        .select('*, profiles(username, profile_image_url)')
        .eq('post_id', postId);

      const newLikesObj = { ...likesObj };
      newLikesObj[postId] = likes || [];
      setPostLikes(newLikesObj);

      return likes || [];
    } catch (error) {
      console.error('Error fetching likes:', error);
      return [];
    }
  }

  // Handle like button click
  async function handleLike(postId) {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }

    const currentLikes = postLikes[postId] || [];
    const existingLike = currentLikes.find((like) => like.user_id === user.id);

    try {
      if (existingLike) {
        // Unlike the post
        const { error } = await supabase
          .from('blog_likes')
          .delete()
          .eq('id', existingLike.id);

        if (!error) {
          const updatedLikes = currentLikes.filter(
            (like) => like.id !== existingLike.id
          );
          setPostLikes({
            ...postLikes,
            [postId]: updatedLikes,
          });

          // Update the post's likes count in the UI
          const updatePostLikes = (postArray) =>
            postArray.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  likes: [{ count: (post.likes?.[0]?.count || 1) - 1 }],
                };
              }
              return post;
            });

          setPosts(updatePostLikes(posts));
          if (searchResults.length > 0) {
            setSearchResults(updatePostLikes(searchResults));
          }
        }
      } else {
        // Like the post
        const { data, error } = await supabase
          .from('blog_likes')
          .insert([{ post_id: postId, user_id: user.id }])
          .select('*, profiles(username, profile_image_url)')
          .single();

        if (!error && data) {
          setPostLikes({
            ...postLikes,
            [postId]: [...currentLikes, data],
          });

          // Update the post's likes count in the UI
          const updatePostLikes = (postArray) =>
            postArray.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  likes: [{ count: (post.likes?.[0]?.count || 0) + 1 }],
                };
              }
              return post;
            });

          setPosts(updatePostLikes(posts));
          if (searchResults.length > 0) {
            setSearchResults(updatePostLikes(searchResults));
          }
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your like. Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Format date for display
  const formatPostDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Check if the current user has liked a post
  const hasUserLikedPost = (postId) => {
    const likes = postLikes[postId] || [];
    return likes.some((like) => like.user_id === user?.id);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Render post grid
  const renderPostGrid = (postsToRender) => {
    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className='text-center py-20 bg-white/10 backdrop-blur-sm rounded-xl p-8'>
          <MusicIcon className='h-16 w-16 text-pink-400 mx-auto mb-6' />
          <h2 className='text-2xl font-semibold text-white mb-4'>
            No posts found
          </h2>
          <p className='text-pink-200 mb-8'>
            {searchQuery
              ? 'Try a different search term'
              : 'Check back later for updates'}
          </p>
        </div>
      );
    }

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {postsToRender.map((post, index) => (
          <motion.div
            key={`${post.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
          >
            <Card className='h-full flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800'>
              {/* Featured Image */}
              <div className='relative overflow-hidden h-48'>
                <Link href={`/blog/${post.slug}`}>
                  <img
                    src={
                      post.featured_image ||
                      '/placeholder.svg?height=200&width=400'
                    }
                    alt={post.title}
                    className='w-full h-full object-cover transition-transform duration-300 hover:scale-105'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70'></div>
                  <div className='absolute bottom-0 left-0 p-4'>
                    <Badge className='bg-pink-600 hover:bg-pink-700 text-white'>
                      {'Music'}
                    </Badge>
                  </div>
                </Link>
              </div>

              <CardHeader className='p-4 pb-2'>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className='text-xl font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-pink-600 dark:hover:text-pink-400 transition-colors'>
                    {post.title}
                  </h2>
                </Link>
                <div className='flex items-center space-x-2 mt-2'>
                  <Avatar className='h-6 w-6 ring-1 ring-pink-500'>
                    <AvatarImage
                      src={
                        post.profiles?.profile_image_url || '/placeholder.svg'
                      }
                      alt={post.profiles?.username || 'User'}
                    />
                    <AvatarFallback className='bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs'>
                      {(post.profiles?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {post.profiles?.full_name || post.profiles?.username} •{' '}
                    {formatPostDate(post.created_at)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className='p-4 pt-2 flex-grow'>
                <p className='text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-2'>
                  {post.excerpt}
                </p>
              </CardContent>

              <CardFooter className='p-4 pt-0 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center'>
                <div className='flex space-x-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className={`${
                      hasUserLikedPost(post.id)
                        ? 'text-pink-600 dark:text-pink-400'
                        : 'text-gray-600 dark:text-gray-300'
                    } hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-700 p-1 rounded-full`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        hasUserLikedPost(post.id)
                          ? 'fill-pink-600 dark:fill-pink-400'
                          : ''
                      }`}
                    />
                    <span className='ml-1 text-xs'>
                      {post.likes?.[0]?.count || 0}
                    </span>
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 p-1 rounded-full'
                  >
                    <Share2 className='h-4 w-4' />
                  </Button>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className='text-xs text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 font-medium'
                >
                  Read more →
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 pt-24 flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-10 w-10 text-pink-500 animate-spin' />
          <p className='mt-4 text-white font-medium'>
            Loading awesome posts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 pt-16 pb-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl md:text-6xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500'>
            iiPosts
          </h1>
          <p className='text-pink-200 text-lg max-w-2xl mx-auto'>
            Stories from the South African music Community
          </p>
        </div>

        {/* Search Bar */}
        <div className='max-w-2xl mx-auto mb-8'>
          <div className='relative'>
            <Input
              type='text'
              placeholder='Search posts...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 pr-10 py-6 bg-white/10 backdrop-blur-sm border-pink-300/30 text-white placeholder:text-pink-200 focus:border-pink-500 focus:ring-pink-500'
            />
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-pink-300' />
            {searchQuery && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearSearch}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-pink-300 hover:text-pink-100 p-1'
              >
                <X className='h-5 w-5' />
              </Button>
            )}
          </div>
        </div>

        {/* Featured Post (only show if not searching) */}
        {!searchQuery && posts.length > 0 && (
          <div className='mb-12'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className='overflow-hidden border-0 shadow-xl bg-gradient-to-r from-pink-500/10 to-indigo-500/10 backdrop-blur-sm'>
                <div className='grid md:grid-cols-2 gap-0'>
                  <div className='relative h-64 md:h-auto'>
                    <Link href={`/blog/${posts[0].slug}`}>
                      <img
                        src={
                          posts[0].featured_image ||
                          '/placeholder.svg?height=400&width=600'
                        }
                        alt={posts[0].title}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent md:bg-gradient-to-r'></div>
                    </Link>
                  </div>
                  <div className='p-6 md:p-8 flex flex-col justify-center'>
                    <Badge className='w-fit mb-4 bg-pink-600 hover:bg-pink-700 text-white'>
                      Featured
                    </Badge>
                    <Link href={`/blog/${posts[0].slug}`}>
                      <h2 className='text-2xl md:text-3xl font-bold text-white mb-4 hover:text-pink-300 transition-colors'>
                        {posts[0].title}
                      </h2>
                    </Link>
                    <p className='text-pink-100 mb-6 line-clamp-3'>
                      {posts[0].excerpt}
                    </p>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8 ring-2 ring-pink-500'>
                          <AvatarImage
                            src={
                              posts[0].profiles?.profile_image_url ||
                              '/placeholder.svg'
                            }
                            alt={posts[0].profiles?.username || 'User'}
                          />
                          <AvatarFallback className='bg-gradient-to-br from-pink-500 to-purple-600 text-white'>
                            {(posts[0].profiles?.username || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium text-white'>
                            {posts[0].profiles?.full_name ||
                              posts[0].profiles?.username}
                          </p>
                          <p className='text-xs text-pink-200'>
                            {formatPostDate(posts[0].created_at)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/blog/${posts[0].slug}`}
                        className='text-sm text-pink-300 hover:text-pink-100 font-medium'
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Content Tabs (only show if not searching) */}
        {!searchQuery ? (
          <Tabs defaultValue='latest' className='mb-8'>
            <div className='flex justify-center'>
              <TabsList className='bg-white/10 backdrop-blur-sm'>
                <TabsTrigger
                  value='latest'
                  className='text-pink-200 data-[state=active]:text-white data-[state=active]:bg-pink-600'
                >
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value='popular'
                  className='text-pink-200 data-[state=active]:text-white data-[state=active]:bg-pink-600'
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value='trending'
                  className='text-pink-200 data-[state=active]:text-white data-[state=active]:bg-pink-600'
                >
                  Trending
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='latest' className='mt-6'>
              {renderPostGrid(posts.slice(1))}{' '}
              {/* Skip the first post as it's featured */}
            </TabsContent>

            <TabsContent value='popular' className='mt-6'>
              {renderPostGrid(
                [...posts].sort(
                  (a, b) =>
                    (b.likes?.[0]?.count || 0) - (a.likes?.[0]?.count || 0)
                )
              )}
            </TabsContent>

            <TabsContent value='trending' className='mt-6'>
              {renderPostGrid(
                [...posts].sort(
                  (a, b) =>
                    (b.comments?.[0]?.count || 0) -
                    (a.comments?.[0]?.count || 0)
                )
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className='mb-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-bold text-white'>
                {isSearching ? (
                  <span className='flex items-center'>
                    <Loader2 className='h-5 w-5 text-pink-400 animate-spin mr-2' />
                    Searching...
                  </span>
                ) : (
                  `Search Results (${searchResults.length})`
                )}
              </h2>
            </div>
            {renderPostGrid(searchResults)}
          </div>
        )}

        {/* Loader element for infinite scroll (only show if not searching) */}
        {!searchQuery && (
          <div
            ref={loaderRef}
            className='flex justify-center items-center py-8 mt-8'
          >
            {hasMore ? (
              <Loader2 className='h-8 w-8 text-pink-500 animate-spin' />
            ) : posts.length > 0 ? (
              <p className='text-pink-200 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full'>
                You've reached the end ✨
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
