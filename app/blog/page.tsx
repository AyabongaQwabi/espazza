'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { MusicIcon } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogPosts() {
      const supabase = createClientComponentClient();
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(
            `
            id,
            title,
            excerpt,
            slug,
            featured_image,
            created_at,
            profiles (
              username,
              full_name
            )
          `
          )
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-zinc-950 pt-24 flex items-center justify-center'>
        <p className='text-white text-xl'>Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className='min-h-screen bg-zinc-950 pt-24'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
              Amabali eXhap
            </h1>
            <p className='text-gray-400 text-lg'>
              Stories from the Xhosa Hip Hop Community
            </p>
          </div>

          <div className='text-center py-20'>
            <MusicIcon className='h-12 w-12 text-red-600 mx-auto mb-6' />
            <h2 className='text-2xl font-semibold text-white mb-4'>
              Amabali Azakufika Kwakamsinya
            </h2>
            <p className='text-gray-400 mb-8'>
              Stories coming soon! Our writers are working on amazing content
              about Xhosa Hip Hop.
            </p>
            <p className='text-gray-500'>
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
    <div className='min-h-screen bg-zinc-950 pt-24'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Amabali eXhap
          </h1>
          <p className='text-gray-400 text-lg'>
            Stories from the Xhosa Hip Hop Community
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className='group'>
              <article className='bg-gray-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors'>
                {post.featured_image && (
                  <div
                    className='h-48 w-full bg-cover bg-center'
                    style={{ backgroundImage: `url(${post.featured_image})` }}
                  />
                )}
                <div className='p-6'>
                  <h2 className='text-xl font-semibold text-white mb-2 group-hover:text-red-500 transition-colors'>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className='text-gray-400 mb-4 line-clamp-2'>
                      {post.excerpt}
                    </p>
                  )}
                  <div className='flex items-center text-sm text-gray-500'>
                    <span>
                      {post.profiles?.full_name || post.profiles?.username}
                    </span>
                    <span className='mx-2'>•</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString('en-ZA')}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
