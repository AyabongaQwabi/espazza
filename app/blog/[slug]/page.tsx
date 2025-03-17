import BlogPostClient from './BlogPostClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Metadata } from 'next';

// This makes the page dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the generateMetadata function with proper typing
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, featured_image, tags')
    .eq('slug', params.slug)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `/blog/${params.slug}`,
      images: [
        {
          url: post.featured_image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      // Add these additional OpenGraph properties for better Facebook sharing
      publishedTime: post.created_at,
      authors: ['Espazza'], // Replace with actual author
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featured_image],
    },
    // Add Facebook-specific metadata
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

export default async function BlogPost({ params }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

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
