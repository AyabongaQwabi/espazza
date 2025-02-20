import BlogPostClient from './BlogPostClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, featured_image, tags')
    .eq('slug', params.slug)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.title} | Your Blog Name`,
    description: post.excerpt,
    openGraph: {
      images: [{ url: post.featured_image }],
    },
    keywords: post.tags.join(', '),
  };
}

export default async function BlogPost({ params }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: post } = await supabase
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
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (!post) {
    return <div>Post not found</div>;
  }

  return <BlogPostClient post={post} />;
}
