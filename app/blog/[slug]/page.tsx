import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { MusicIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getBlogPost(slug: string) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: post } = await supabase
      .from('blog_posts')
      .select(`
        *,
        profiles (
          username,
          full_name,
          avatar_url
        ),
        post_categories (
          blog_categories (
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();
    
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <MusicIcon className="h-12 w-12 text-red-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Ibali Alifumaneki
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The story you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link href="/blog">
              Buyela kuMabali (Back to Stories)
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <article className="max-w-4xl mx-auto px-4">
        {post.featured_image && (
          <div 
            className="w-full h-[400px] rounded-lg bg-cover bg-center mb-8"
            style={{ backgroundImage: `url(${post.featured_image})` }}
          />
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {post.title}
        </h1>

        <div className="flex items-center mb-8">
          <div className="flex items-center">
            {post.profiles.avatar_url && (
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center mr-3"
                style={{ backgroundImage: `url(${post.profiles.avatar_url})` }}
              />
            )}
            <div>
              <p className="text-white font-medium">
                {post.profiles.full_name || post.profiles.username}
              </p>
              <p className="text-gray-400 text-sm">
                {new Date(post.created_at).toLocaleDateString('en-ZA')}
              </p>
            </div>
          </div>
        </div>

        {post.post_categories?.length > 0 && (
          <div className="flex gap-2 mb-8">
            {post.post_categories.map(({ blog_categories }) => (
              <span 
                key={blog_categories.slug}
                className="px-3 py-1 bg-zinc-800 text-gray-300 rounded-full text-sm"
              >
                {blog_categories.name}
              </span>
            ))}
          </div>
        )}

        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}