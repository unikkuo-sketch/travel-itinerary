import { writeFileSync, readFileSync } from 'node:fs';

const origin = 'https://travel-itinerary.vercel.app';
const trips = JSON.parse(readFileSync('trips/manifest.json', 'utf8')).trips.map((t) => t.id);
const pages = ['trip.html', 'stories.html', 'food.html', 'shopping.html'];
const urls = [`${origin}/`];
for (const id of trips) {
  const q = encodeURIComponent(id);
  for (const p of pages) urls.push(`${origin}/${p}?trip=${q}`);
}
const body = urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n');
writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
);
console.log('sitemap urls', urls.length);
