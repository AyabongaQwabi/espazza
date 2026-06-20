const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'https://espazza.xyz';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/releases', priority: '0.9', changefreq: 'daily' },
  { url: '/artists', priority: '0.9', changefreq: 'daily' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/events', priority: '0.8', changefreq: 'daily' },
  { url: '/podcasts', priority: '0.7', changefreq: 'weekly' },
  { url: '/videos', priority: '0.7', changefreq: 'weekly' },
  { url: '/producers', priority: '0.7', changefreq: 'weekly' },
  { url: '/playlists', priority: '0.6', changefreq: 'weekly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/contact', priority: '0.4', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
];

function urlEntry({ url, priority, changefreq, lastmod }) {
  const loc = `${BASE_URL}${url}`;
  const mod = lastmod ? `\n      <lastmod>${lastmod}</lastmod>` : '';
  return `
    <url>
      <loc>${loc}</loc>${mod}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
}

async function generateSitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const today = new Date().toISOString().split('T')[0];

  // Fetch dynamic data
  const [
    { data: posts },
    { data: releases },
    { data: artists },
    { data: events },
    { data: products },
  ] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('published', true),
    supabase
      .from('releases')
      .select('short_unique_id, updated_at, created_at')
      .not('short_unique_id', 'is', null),
    supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('user_type', 'artist')
      .not('username', 'is', null),
    supabase
      .from('events')
      .select('id, updated_at, created_at'),
    supabase
      .from('products')
      .select('code, updated_at')
      .not('code', 'is', null),
  ]);

  const staticEntries = STATIC_PAGES.map((p) =>
    urlEntry({ ...p, lastmod: today })
  );

  const blogEntries = (posts || []).map((p) =>
    urlEntry({
      url: `/blog/${p.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: (p.updated_at || p.created_at || today).split('T')[0],
    })
  );

  // Use short_unique_id for releases (canonical URL)
  const releaseEntries = (releases || [])
    .filter((r) => r.short_unique_id)
    .map((r) =>
      urlEntry({
        url: `/r/${r.short_unique_id}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: (r.updated_at || r.created_at || today).split('T')[0],
      })
    );

  const artistEntries = (artists || [])
    .filter((a) => a.username)
    .map((a) =>
      urlEntry({
        url: `/artists/${a.username}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: (a.updated_at || today).split('T')[0],
      })
    );

  const eventEntries = (events || []).map((e) =>
    urlEntry({
      url: `/events/${e.id}`,
      priority: '0.7',
      changefreq: 'daily',
      lastmod: (e.updated_at || e.created_at || today).split('T')[0],
    })
  );

  const productEntries = (products || [])
    .filter((p) => p.code)
    .map((p) =>
      urlEntry({
        url: `/merch-store/${p.code}`,
        priority: '0.6',
        changefreq: 'weekly',
        lastmod: (p.updated_at || today).split('T')[0],
      })
    );

  const allEntries = [
    ...staticEntries,
    ...blogEntries,
    ...releaseEntries,
    ...artistEntries,
    ...eventEntries,
    ...productEntries,
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>${allEntries.join('')}
</urlset>`;

  fs.writeFileSync('public/sitemap.xml', sitemap);
  console.log(
    `Sitemap generated: ${allEntries.length} URLs (${blogEntries.length} posts, ${releaseEntries.length} releases, ${artistEntries.length} artists, ${eventEntries.length} events, ${productEntries.length} products)`
  );
}

generateSitemap().catch(console.error);
