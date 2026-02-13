import type { APIRoute } from 'astro';
import { getSheetEvents } from '../lib/supabase';
import { getCities, getTraditions } from '../lib/api';

export const GET: APIRoute = async () => {
  const events = await getSheetEvents();
  const cities = getCities();
  const traditions = getTraditions();

  const BASE = 'https://festivalsinmorocco.com';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/events', priority: '0.9', changefreq: 'weekly' },
    { url: '/cities', priority: '0.8', changefreq: 'monthly' },
    { url: '/traditions', priority: '0.8', changefreq: 'monthly' },
    { url: '/map', priority: '0.7', changefreq: 'monthly' },
    { url: '/search', priority: '0.6', changefreq: 'monthly' },
    { url: '/submit', priority: '0.4', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.2', changefreq: 'yearly' },
    { url: '/terms', priority: '0.2', changefreq: 'yearly' },
    { url: '/disclaimer', priority: '0.2', changefreq: 'yearly' },
    { url: '/intellectual-property', priority: '0.2', changefreq: 'yearly' },
  ];

  const urls = [
    ...staticPages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...events.map(e => `  <url>
    <loc>${BASE}/events/${e.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...cities.map(c => `  <url>
    <loc>${BASE}/cities/${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ...traditions.map(t => `  <url>
    <loc>${BASE}/traditions/${t.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
