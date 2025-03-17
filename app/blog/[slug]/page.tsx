import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import BlogContent from '@/components/blog/blog-content';
import type { Post } from '@/types';

// Metadata function
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
    title: post.title, // Just the post title without any suffix
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.featured_image }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featured_image],
    },
    keywords: post.tags?.join(', ') || '',
    alternates: {
      canonical: `https://espazza.co.za/blog/${params.slug}`,
    },
  };
}

async function getPost(slug: string): Promise<Post | null> {
  const supabase = createServerComponentClient({ cookies });

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  return post;
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return <BlogContent post={post} />;
}
