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

  // Fetch 2 random related articles
  const { data: relatedArticles } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt')
    .neq('id', post.id)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(10);

  const randomRelatedArticles = relatedArticles
    ? relatedArticles.sort(() => 0.5 - Math.random()).slice(0, 2)
    : [];

  return <BlogPostClient post={post} relatedArticles={randomRelatedArticles} />;
}
