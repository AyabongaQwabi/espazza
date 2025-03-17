import BlogPostClient from './BlogPostClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// This makes the page dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the generateMetadata function with proper typing
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('title, excerpt, featured_image, created_at')
      .eq('slug', params.slug)
      .single();

    if (error) {
      console.error('Metadata fetch error:', error);
      return {
        title: 'Espazza',
        description: 'Read the latest news and updates',
      };
    }

    if (!post) {
      return {
        title: 'Post Not Found | Espazza',
        description: 'The requested post could not be found.',
      };
    }

    const ogImage = post.featured_image || '/default-og-image.jpg';

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
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        publishedTime: post.created_at,
        authors: ['Espazza'],
        tags: ['hip-hop', 'music', 'news'],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
      },
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
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: 'Espazza',
      description: 'Read the latest news and updates',
    };
  }
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: post, error: postError } = await supabase
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

    if (postError) {
      console.error('Post fetch error:', postError);
      throw new Error('Failed to fetch post');
    }

    if (!post) {
      notFound();
    }

    // Fetch 2 random related articles
    const { data: relatedArticles, error: relatedError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt')
      .neq('id', post.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (relatedError) {
      console.error('Related articles fetch error:', relatedError);
    }

    const randomRelatedArticles = relatedArticles
      ? relatedArticles.sort(() => 0.5 - Math.random()).slice(0, 2)
      : [];

    return (
      <BlogPostClient post={post} relatedArticles={randomRelatedArticles} />
    );
  } catch (error) {
    console.error('Page render error:', error);
    throw error; // Let Next.js handle the error
  }
}
