import BlogPostClient from './BlogPostClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('title, excerpt, featured_image, created_at, updated_at, author_id, profiles(full_name, username)')
      .eq('slug', params.slug)
      .single();

    if (error || !post) {
      return {
        title: post === null ? 'Post Not Found | eSpazza' : 'eSpazza',
        description: 'Read the latest South African hip hop news and updates on eSpazza.',
      };
    }

    const ogImage = post.featured_image || '/default-og-image.jpg';
    const authorName = (post.profiles as any)?.full_name || 'eSpazza';
    const url = `https://espazza.xyz/blog/${params.slug}`;

    return {
      title: post.title,
      description: post.excerpt,
      keywords: [
        post.title,
        'South African hip hop news',
        'Xhosa hip hop',
        'SA music news',
        'eSpazza blog',
      ],
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        url,
        images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: [authorName],
        tags: ['hip-hop', 'south african music', 'xhosa hip hop', 'music news'],
        siteName: 'eSpazza',
        locale: 'en_ZA',
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
      },
      alternates: { canonical: url },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    };
  } catch {
    return {
      title: 'eSpazza',
      description: 'Read the latest South African hip hop news and updates on eSpazza.',
    };
  }
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const cookieStore = await cookies();
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

  if (postError || !post) notFound();

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

  const authorName = (post.profiles as any)?.full_name || 'eSpazza';
  const ogImage = post.featured_image || '/default-og-image.jpg';
  const url = `https://espazza.xyz/blog/${params.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: ogImage,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    url,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `https://espazza.xyz/artists/${(post.profiles as any)?.username || ''}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'eSpazza',
      url: 'https://espazza.xyz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://espazza.xyz/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: 'South African hip hop, Xhosa hip hop, SA music news',
    inLanguage: 'en-ZA',
    about: {
      '@type': 'Thing',
      name: 'South African Hip Hop Music',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} relatedArticles={randomRelatedArticles} />
    </>
  );
}
