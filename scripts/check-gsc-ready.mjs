/**
 * Crawl-readiness check for Google Search Console (production by default).
 *
 * Does not log into GSC. Confirms robots / sitemap / gtag / sitemap URLs
 * are fetchable so the site owner can verify via Google Analytics and submit
 * the sitemap in one sitting. See docs/gsc-setup.md.
 *
 * Usage:
 *   npm run check-gsc
 *   node scripts/check-gsc-ready.mjs --origin=https://universum-sliver.vercel.app
 */
import { readFileSync } from 'node:fs';

const GA_ID = readGaId();
const originArg = process.argv.find((a) => a.startsWith('--origin='));
const origin = (originArg ? originArg.slice('--origin='.length) : readSiteOrigin()).replace(
  /\/$/,
  ''
);

function readSiteOrigin() {
  const src = readFileSync('js/site.js', 'utf8');
  const m = src.match(/export const SITE_ORIGIN = '([^']+)'/);
  if (!m) throw new Error('SITE_ORIGIN not found in js/site.js');
  return m[1];
}

function readGaId() {
  const src = readFileSync('js/site.js', 'utf8');
  const m = src.match(/export const GA_MEASUREMENT_ID = '([^']+)'/);
  if (!m) throw new Error('GA_MEASUREMENT_ID not found in js/site.js');
  return m[1];
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { url, status: res.status, type: res.headers.get('content-type') || '', text, finalUrl: res.url };
}

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  return false;
}

function ok(msg) {
  console.log(`OK    ${msg}`);
  return true;
}

function parseSitemapLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].trim());
  return locs;
}

let passed = true;

console.log(`GSC readiness  origin=${origin}`);
console.log('');

const robots = await fetchText(`${origin}/robots.txt`);
if (robots.status !== 200) passed = fail(`robots.txt HTTP ${robots.status}`);
else {
  ok(`robots.txt ${robots.status}`);
  if (!/User-agent:\s*\*/i.test(robots.text)) passed = fail('robots.txt missing User-agent: *');
  else ok('robots.txt allows *');
  if (!/Allow:\s*\//i.test(robots.text)) passed = fail('robots.txt missing Allow: /');
  else ok('robots.txt Allow: /');
  const sitemapLine = robots.text.match(/Sitemap:\s*(\S+)/i);
  if (!sitemapLine) passed = fail('robots.txt missing Sitemap:');
  else if (sitemapLine[1].replace(/\/$/, '') !== `${origin}/sitemap.xml`) {
    passed = fail(`robots.txt Sitemap is ${sitemapLine[1]} (expected ${origin}/sitemap.xml)`);
  } else ok(`robots.txt Sitemap ${sitemapLine[1]}`);
}

const sitemap = await fetchText(`${origin}/sitemap.xml`);
if (sitemap.status !== 200) passed = fail(`sitemap.xml HTTP ${sitemap.status}`);
else {
  ok(`sitemap.xml ${sitemap.status} ${sitemap.type || ''}`.trim());
  if (!/<urlset/i.test(sitemap.text)) passed = fail('sitemap.xml is not a urlset');
}

const locs = sitemap.status === 200 ? parseSitemapLocs(sitemap.text) : [];
if (!locs.length) passed = fail('sitemap.xml has no <loc>');
else ok(`sitemap.xml ${locs.length} URLs`);

if (locs.some((u) => /shopping\.html/i.test(u))) {
  passed = fail('sitemap.xml includes shopping.html (should stay noindex / excluded)');
} else ok('sitemap.xml excludes shopping');

const home = await fetchText(`${origin}/`);
if (home.status !== 200) passed = fail(`homepage HTTP ${home.status}`);
else {
  ok(`homepage ${home.status}`);
  const head = home.text.split(/<\/head>/i)[0] || '';
  if (!head.includes(`gtag/js?id=${GA_ID}`) || !head.includes(`gtag('config', '${GA_ID}')`)) {
    passed = fail(`homepage <head> missing gtag ${GA_ID} (needed for GSC Google Analytics verification)`);
  } else ok(`homepage <head> has gtag ${GA_ID}`);
  if (!/rel=["']canonical["']/i.test(head)) passed = fail('homepage missing canonical');
  else ok('homepage has canonical');
}

const shopping = await fetchText(`${origin}/shopping.html`);
if (shopping.status !== 200) passed = fail(`shopping.html HTTP ${shopping.status}`);
else if (!/name=["']robots["'][^>]*content=["']noindex/i.test(shopping.text)) {
  passed = fail('shopping.html missing noindex');
} else ok('shopping.html noindex');

console.log('');
console.log('Sitemap URL check');
for (const loc of locs) {
  if (!loc.startsWith(`${origin}/`)) {
    passed = fail(`${loc} not under ${origin}/`);
    continue;
  }
  const page = await fetchText(loc);
  const head = page.text.split(/<\/head>/i)[0] || '';
  const noindex = /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(head);
  if (page.status !== 200) {
    passed = fail(`${page.status} ${loc}`);
    continue;
  }
  if (noindex) {
    passed = fail(`noindex on indexed sitemap URL ${loc}`);
    continue;
  }
  ok(`${page.status} ${loc}`);
}

console.log('');
if (passed) {
  console.log('Ready for Search Console.');
  console.log('Next (site owner, same Google account as GA4):');
  console.log('  1. https://search.google.com/search-console → URL prefix');
  console.log(`     ${origin}/`);
  console.log('  2. Verify with Google Analytics (do not use Domain property on *.vercel.app)');
  console.log(`  3. Sitemaps → add sitemap.xml`);
  console.log('  4. URL inspection → Hub + one trip → Request indexing');
  console.log('Details: docs/gsc-setup.md');
  process.exit(0);
}

console.error('Not ready. Fix FAIL lines before submitting the sitemap.');
process.exit(1);
