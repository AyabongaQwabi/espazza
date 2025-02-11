import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { MusicIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const POSTS_PER_PAGE = 9;

export const revalidate = 60; // Revalidate this page every 60 seconds

async function getBlogPosts(page = 1) {
  const supabase = createServerComponentClient({ cookies });
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;

  console.log('Fetching blog posts...'); // Debug log

  const {
    data: posts,
    count,
    error,
  } = await supabase
    .from('blog_posts')
    .select(
      `
      id,
      title,
      excerpt,
      slug,
      featured_image,
      created_at,
      published,
      profiles (
        username,
        full_name
      )
    `,
      { count: 'exact' }
    )
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw new Error(`Failed to fetch blog posts: ${error.message}`);
  }

  console.log('Fetched posts:', posts); // Debug log
  console.log('Total count:', count); // Debug log
  console.log(
    'SQL query:',
    supabase.from('blog_posts').select().eq('published', true).toSQL()
  ); // Debug log

  return { posts, count };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  let posts, count, error;

  try {
    ({ posts, count } = await getBlogPosts(currentPage));
  } catch (e) {
    console.error('Error in BlogPage:', e);
    error = e instanceof Error ? e.message : 'An unknown error occurred';
  }

  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);

  if (error) {
    return (
      <div className='min-h-screen bg-black pt-24'>
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
              Oops! Something went wrong.
            </h2>
            <p className='text-gray-400 mb-8'>
              We're having trouble loading the blog posts. Please try again
              later.
            </p>
            <p className='text-gray-500'>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className='min-h-screen bg-black pt-24'>
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
    <div className='min-h-screen bg-black pt-24'>
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
              <article className='bg-zinc-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors'>
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

        {totalPages > 1 && (
          <div className='flex justify-center mt-12'>
            {currentPage > 1 && (
              <Button asChild variant='outline' className='mr-2'>
                <Link href={`/blog?page=${currentPage - 1}`}>Previous</Link>
              </Button>
            )}
            {currentPage < totalPages && (
              <Button asChild variant='outline'>
                <Link href={`/blog?page=${currentPage + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
