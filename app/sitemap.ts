import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://espazza.xyz';

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const revalidate = 3600; // regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = supabase();

  const [
    { data: posts },
    { data: releases },
    { data: artists },
    { data: events },
    { data: products },
  ] = await Promise.all([
    db.from('blog_posts').select('slug, updated_at, created_at').eq('published', true),
    db.from('releases').select('short_unique_id, updated_at, created_at').not('short_unique_id', 'is', null),
    db.from('profiles').select('username, updated_at').eq('user_type', 'artist').not('username', 'is', null),
    db.from('events').select('id, updated_at, created_at'),
    db.from('products').select('code, updated_at').not('code', 'is', null),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/releases`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/artists`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/podcasts`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/producers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/playlists`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at || p.created_at || now),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const releasePages: MetadataRoute.Sitemap = (releases || [])
    .filter((r) => r.short_unique_id)
    .map((r) => ({
      url: `${BASE_URL}/r/${r.short_unique_id}`,
      lastModified: new Date(r.updated_at || r.created_at || now),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const artistPages: MetadataRoute.Sitemap = (artists || [])
    .filter((a) => a.username)
    .map((a) => ({
      url: `${BASE_URL}/artists/${a.username}`,
      lastModified: new Date(a.updated_at || now),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const eventPages: MetadataRoute.Sitemap = (events || []).map((e) => ({
    url: `${BASE_URL}/events/${e.id}`,
    lastModified: new Date(e.updated_at || e.created_at || now),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = (products || [])
    .filter((p) => p.code)
    .map((p) => ({
      url: `${BASE_URL}/merch-store/${p.code}`,
      lastModified: new Date(p.updated_at || now),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  return [
    ...staticPages,
    ...blogPages,
    ...releasePages,
    ...artistPages,
    ...eventPages,
    ...productPages,
  ];
}
