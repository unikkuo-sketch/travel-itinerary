import { writeFileSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const origin = 'https://universum-sliver.vercel.app';
const manifest = JSON.parse(readFileSync('trips/manifest.json', 'utf8'));
const trips = manifest.trips.map((t) => t.id);

function isoDay(filePath) {
  if (!existsSync(filePath)) return new Date().toISOString().slice(0, 10);
  return new Date(statSync(filePath).mtimeMs).toISOString().slice(0, 10);
}

function tripPath(id, page = 'trip') {
  const enc = encodeURIComponent(id);
  if (page === 'stories') return `${origin}/trips/${enc}/stories.html`;
  if (page === 'food') return `${origin}/trips/${enc}/food.html`;
  return `${origin}/trips/${enc}/`;
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

console.log('seo: sitemap urls', urls.length, '+ llms.txt + llms-full.txt');
