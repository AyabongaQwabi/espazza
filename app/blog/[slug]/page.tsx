import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ReactMarkdown from 'react-markdown';
import { MusicIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getBlogPost(slug: string) {
  const supabase = createServerComponentClient({ cookies });

  console.log('Fetching blog post with slug:', slug); // Debug log

  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        profiles (
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }

    if (!post) {
      console.log('No post found with slug:', slug);
      return null;
    }

    console.log('Fetched post:', post); // Debug log

    return post;
  } catch (error) {
    console.error('Error in getBlogPost:', error);
    return null;
  }
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  console.log('Rendering BlogPost component with slug:', params.slug); // Debug log

  const post = await getBlogPost(params.slug);

  if (!post) {
    console.log('Post not found, rendering not found page'); // Debug log
    return (
      <div className='min-h-screen bg-black flex items-center justify-center px-4'>
        <div className='text-center'>
          <MusicIcon className='h-12 w-12 text-red-600 mx-auto mb-6' />
          <h1 className='text-4xl font-bold text-white mb-4'>
            Ibali Alifumaneki
          </h1>
          <p className='text-gray-400 mb-8 max-w-md mx-auto'>
            The story you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link href='/blog'>Buyela kuMabali (Back to Stories)</Link>
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering post content'); // Debug log

  return (
    <div className='min-h-screen bg-black pt-24'>
      <article className='max-w-4xl mx-auto px-4'>
        {post.featured_image && (
          <div
            className='w-full h-[400px] rounded-lg bg-cover bg-center mb-8'
            style={{ backgroundImage: `url(${post.featured_image})` }}
          />
        )}

        <h1 className='text-4xl md:text-5xl font-bold text-white mb-6'>
          {post.title}
        </h1>

        <div className='flex items-center mb-8'>
          <div className='flex items-center'>
            {post.profiles.avatar_url && (
              <div
                className='w-10 h-10 rounded-full bg-cover bg-center mr-3'
                style={{ backgroundImage: `url(${post.profiles.avatar_url})` }}
              />
            )}
            <div>
              <p className='text-white font-medium'>
                {post.profiles.full_name || post.profiles.username}
              </p>
              <p className='text-gray-400 text-sm'>
                {new Date(post.created_at).toLocaleDateString('en-ZA')}
              </p>
            </div>
          </div>
        </div>

        <div className='prose prose-invert max-w-none'>
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
