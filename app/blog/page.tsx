'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { MusicIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { motion } from 'framer-motion';

const POSTS_PER_PAGE = 12;

export default function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const currentPage = Number(searchParams.page) || 1;
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  async function fetchPosts() {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE - 1;

    const {
      data: posts,
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
    } else {
      setPosts(posts || []);
      setTotalPages(Math.ceil((count || 0) / POSTS_PER_PAGE));
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-4'>Loading posts...</div>;
  }

  if (!posts || posts.length === 0) {
    return (
      <div className='min-h-screen bg-black pt-24'>
        <div className='max-w-7xl mx-auto px-4'>
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
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            iiPosts
          </h1>
          <p className='text-zinc-400 text-lg'>
            Stories from the Xhosa Hip Hop Community
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <article className='bg-zinc-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300'>
                  {post.featured_image && (
                    <div className='relative h-48'>
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                  <div className='p-6'>
                    <h2 className='text-xl font-bold text-white mb-2 line-clamp-2'>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className='text-zinc-400 mb-4 line-clamp-3'>
                        {post.excerpt}
                      </p>
                    )}
                    <div className='flex-col space-y-4 items-center justify-between text-sm text-zinc-500'>
                      <div className='flex items-center'>
                        {post.profiles?.profile_image_url && (
                          <img
                            src={post.profiles.profile_image_url}
                            alt={post.profiles.username}
                            className='w-6 h-6 rounded-full mr-2'
                          />
                        )}
                        <span>
                          {post.profiles?.full_name || post.profiles?.username}
                        </span>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <span>{post.likes?.[0]?.count || 0} likes</span>
                        <span>{post.comments?.[0]?.count || 0} comments</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className='mt-12'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/blog?page=${currentPage - 1}`}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`/blog?page=${page}`}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={`/blog?page=${currentPage + 1}`}
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
