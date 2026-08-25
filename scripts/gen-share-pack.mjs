import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectShareItems, withUtm } from './share-items.mjs';

const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'share-pack';

const KIND_LABEL = { trip: '行程', story: '風土', food: '飲食' };

function hashtags(item) {
  const tags = new Set(['日本旅遊', '行程筆記']);
  if (item.kind === 'food') tags.add('日本美食');
  if (item.kind === 'story') tags.add('日本風土');
  for (const part of String(item.kicker || '').split(/[・·、/×xX]+/u)) {
    const t = part.trim();
    if (t && t.length <= 8) tags.add(t);
  }
  return [...tags].slice(0, 5).map((t) => `#${t}`).join(' ');
}

function clip(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function captionsFor(item) {
  const tags = hashtags(item);
  const kicker = item.kicker ? `${item.kicker}　` : '';
  const threadsUrl = withUtm(item.url, { source: 'threads', content: item.utmContent });
  const lineUrl = withUtm(item.url, { source: 'line', medium: 'social', content: item.utmContent });
  const igUrl = withUtm(item.url, { source: 'instagram', content: item.utmContent });

  const threads = [
    `${kicker}${item.title}`,
    clip(item.body, 280),
    threadsUrl,
    tags,
  ]
    .filter(Boolean)
    .join('\n\n');

  const line = [
    `【${KIND_LABEL[item.kind] || item.kind}】${item.title}`,
    item.kicker ? `來自：${item.tripTitle}｜${item.kicker}` : `來自：${item.tripTitle}`,
    item.body,
    lineUrl,
  ]
    .filter(Boolean)
    .join('\n\n');

  const instagram = [
    `${item.title}`,
    item.kicker ? `${item.tripTitle} · ${item.kicker}` : item.tripTitle,
    '',
    item.body,
    '',
    item.imageCredit ? `照片：${item.imageCredit}` : '',
    igUrl,
    tags,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { threads, line, instagram, threadsUrl, lineUrl, igUrl };
}

function buildCalendar(items, weeks = 12, perWeek = 3) {
  const pool = items.filter((i) => i.kind !== 'trip');
  const tripOnce = items.filter((i) => i.kind === 'trip');
  const slots = [];
  let pi = 0;
  for (let w = 1; w <= weeks; w++) {
    const weekItems = [];
    for (let n = 0; n < perWeek; n++) {
      if (w % 6 === 0 && n === 0 && tripOnce.length) {
        weekItems.push(tripOnce[(Math.floor(w / 6) - 1) % tripOnce.length]);
        continue;
      }
      if (!pool.length) break;
      weekItems.push(pool[pi % pool.length]);
      pi += 1;
    }
    slots.push({ week: w, items: weekItems });
  }
  return slots;
}

const items = collectShareItems();
mkdirSync(OUT, { recursive: true });

const posts = items.map((item) => ({
  ...item,
  captions: captionsFor(item),
}));

writeFileSync(join(OUT, 'posts.json'), `${JSON.stringify(posts, null, 2)}\n`);

const calendar = buildCalendar(items);
const calLines = [
  '# 12 週輪播建議（每週 2～3 則）',
  '',
  '> 由 `itinerary.json` 風土／飲食自動排；每第 6 週插一則行程總覽。發前請改第一句口語。',
  '',
];
for (const week of calendar) {
  calLines.push(`## 第 ${week.week} 週`);
  for (const item of week.items) {
    calLines.push(
      `- [${KIND_LABEL[item.kind]}] ${item.title} — ${item.tripTitle}  \n  ${item.url}`
    );
  }
  calLines.push('');
}
writeFileSync(join(OUT, 'calendar.md'), `${calLines.join('\n')}\n`);

const capLines = ['# 分享文案（Threads／LINE／Instagram）', ''];
for (const post of posts) {
  const c = post.captions;
  capLines.push(`## ${KIND_LABEL[post.kind]} · ${post.title}`);
  capLines.push(`來源：${post.tripTitle}`);
  if (post.image) capLines.push(`配圖：${post.image}`);
  capLines.push('');
  capLines.push('### Threads');
  capLines.push('```');
  capLines.push(c.threads);
  capLines.push('```');
  capLines.push('');
  capLines.push('### LINE');
  capLines.push('```');
  capLines.push(c.line);
  capLines.push('```');
  capLines.push('');
  capLines.push('### Instagram');
  capLines.push('```');
  capLines.push(c.instagram);
  capLines.push('```');
  capLines.push('');
  capLines.push('---');
  capLines.push('');
}
writeFileSync(join(OUT, 'captions.md'), `${capLines.join('\n')}\n`);

const counts = items.reduce((acc, i) => {
  acc[i.kind] = (acc[i.kind] || 0) + 1;
  return acc;
}, {});

console.log(
  `share-pack: ${items.length} items (trip ${counts.trip || 0}, story ${counts.story || 0}, food ${counts.food || 0}) → ${OUT}/`
);
