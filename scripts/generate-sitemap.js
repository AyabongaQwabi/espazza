const { globSync } = require('glob');
const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function generateSitemap() {
  const baseUrl = 'https://espazza.co.za';
  console.log('baseUrl', baseUrl);
  console.log(
    'process.env.NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get static pages
  const pages = globSync('app/**/page.tsx')
    .map((file) => {
      const route = file
        .replace('app/', '')
        .replace('/page.tsx', '')
        .replace(/\[.*\]/, '*');
      return route === '' ? '/' : `/${route}`;
    })
    .filter(
      (route) => !route.includes('dashboard') && !route.includes('admin')
    );

  // Get dynamic data
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('published', true);

  const { data: releases } = await supabase.from('releases').select('id');

  const { data: artists } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_type', 'artist');

  const { data: products } = await supabase.from('products').select('code');

  const { data: events } = await supabase.from('events').select('id');

  // Add dynamic routes
  const dynamicRoutes = [
    ...(posts?.map((post) => `/blog/${post.slug}`) || []),
    ...(artists?.map((artist) => `/artists/${artist.username}`) || []),
    ...(events?.map((event) => `/events/${event.id}`) || []),
    ...(releases?.map((release) => `/releases/${release.id}`) || []),
    ...(products?.map((product) => `/merch-store/${product.code}`) || []),
  ];

  const allRoutes = [...pages, ...dynamicRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes
    .map(
      (route) => `
    <url>
      <loc>${baseUrl}${route}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
      <priority>${route === '/' ? '1.0' : '0.7'}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;

  fs.writeFileSync('public/sitemap.xml', sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(console.error);
