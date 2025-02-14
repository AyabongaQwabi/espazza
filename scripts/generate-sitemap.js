const { globSync } = require('glob');
const fs = require('fs');
const path = require('path');

async function generateSitemap() {
  const baseUrl = 'https://espazza.co.za';
  const pages = globSync('app/**/page.tsx')
    .map((file) => {
      const route = file
        .replace('app/', '')
        .replace('/page.tsx', '')
        .replace(/\[.*\]/, '*');
      return route === '' ? '/' : `/${route}`;
    })
    .filter((route) => !route.includes('dashboard'));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
    <url>
      <loc>${baseUrl}${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${page === '/' ? '1.0' : '0.7'}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;

  fs.writeFileSync('public/sitemap.xml', sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap();
