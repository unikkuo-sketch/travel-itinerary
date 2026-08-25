import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SITE_ORIGIN,
  collectShareItems,
  gitIsoDay,
  loadManifest,
  tripPageUrl,
  xmlEscape,
} from './share-items.mjs';

const origin = SITE_ORIGIN;
const manifest = loadManifest();
const trips = manifest.trips.map((t) => t.id);

function isoDay(filePath) {
  return gitIsoDay(filePath);
}

function tripPath(id, page = 'trip') {
  return tripPageUrl(id, page);
}

/** Sitemap: Hub + trip / stories / food (no shopping). */
const urls = [{ loc: `${origin}/`, lastmod: isoDay('trips/manifest.json') }];
for (const id of trips) {
  const itinerary = join('trips', id, 'itinerary.json');
  const lastmod = isoDay(itinerary);
  for (const page of ['trip', 'stories', 'food']) {
    urls.push({ loc: tripPath(id, page), lastmod });
  }
}

const sitemapBody = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc.replace(/&/g, '&amp;')}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
  )
  .join('\n');

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapBody}\n</urlset>\n`
);

const llms = `# 宇宙碎片集散地
> 真實走過的日本行程與風土筆記——給同樣在排行程的人當參考（非訂票／非導購站）

## 機器可讀入口
- ${origin}/trips/manifest.json — 行程索引
- ${origin}/trips/{id}/itinerary.json — 單趟全文（source of truth）
- ${origin}/llms-full.txt — 各趟標題與 JSON／頁面連結表
- ${origin}/llms.txt — 本文件
- ${origin}/feed.xml — 行程／風土／飲食 RSS（分享與訂閱）

## 主要人類頁面
- ${origin}/ — Hub 總覽
- ${origin}/trips/{id}/ — 單趟行程
- ${origin}/trips/{id}/stories.html — 風土
- ${origin}/trips/{id}/food.html — 飲食
- ${origin}/shopping.html?trip={id} — 購物工具（noindex；勾選僅存本機）

## 注意
- 票券 status 與購物勾選為訪客本機狀態，勿當權威資料
- 照片授權見 https://github.com/unikkuo-sketch/travel-itinerary/blob/main/ATTRIBUTIONS.md；請保留 credit
- 舊網址 \`*.html?trip=\` 仍可用；正式 canonical 為 \`/trips/{id}/\` 路徑

## 可選
- Sitemap: ${origin}/sitemap.xml
`;

writeFileSync('public/llms.txt', llms);

const fullLines = [
  '# 宇宙碎片集散地 — 行程一覽',
  `> 產生自 trips/manifest.json；細節以各趟 itinerary.json 為準`,
  '',
  `Hub: ${origin}/`,
  `Manifest: ${origin}/trips/manifest.json`,
  `RSS: ${origin}/feed.xml`,
  '',
];

for (const t of manifest.trips) {
  const id = t.id;
  const enc = encodeURIComponent(id);
  fullLines.push(`## ${t.title}`);
  if (t.subtitle) fullLines.push(t.subtitle);
  if (t.dateRange) fullLines.push(`日期: ${t.dateRange}`);
  if (t.location) fullLines.push(`地區: ${t.location}`);
  fullLines.push(`- JSON: ${origin}/trips/${enc}/itinerary.json`);
  fullLines.push(`- 行程: ${origin}/trips/${enc}/`);
  fullLines.push(`- 風土: ${origin}/trips/${enc}/stories.html`);
  fullLines.push(`- 飲食: ${origin}/trips/${enc}/food.html`);
  fullLines.push('');
}

writeFileSync('public/llms-full.txt', `${fullLines.join('\n')}\n`);

function rfc822(iso) {
  return new Date(iso).toUTCString();
}

const shareItems = collectShareItems();
const feedItems = shareItems
  .map((item) => {
    const title = xmlEscape(
      item.kind === 'trip' ? item.title : `${item.title} · ${item.tripTitle}`
    );
    const desc = xmlEscape(item.body || item.kicker || '');
    const enclosure = item.image
      ? `\n      <enclosure url="${xmlEscape(item.image)}" type="image/webp" />`
      : '';
    return `    <item>
      <title>${title}</title>
      <link>${xmlEscape(item.url)}</link>
      <guid isPermaLink="true">${xmlEscape(item.guid)}</guid>
      <pubDate>${rfc822(item.updated)}</pubDate>
      <category>${xmlEscape(item.kind)}</category>
      <description>${desc}</description>${enclosure}
    </item>`;
  })
  .join('\n');

const newest = shareItems.reduce(
  (max, item) => (item.updated > max ? item.updated : max),
  shareItems[0]?.updated || '2026-01-01T00:00:00.000Z'
);
writeFileSync(
  'public/feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>宇宙碎片集散地</title>
    <link>${origin}/</link>
    <description>真實走過的日本行程與風土筆記——給同樣在排行程的人當參考。</description>
    <language>zh-TW</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
${feedItems}
  </channel>
</rss>
`
);

console.log(
  'seo: sitemap urls',
  urls.length,
  '+ llms.txt + llms-full.txt + feed.xml items',
  shareItems.length
);
