/**
 * Post-build: write per-trip HTML under dist/trips/{id}/ with correct meta + readable body.
 * Templates are the Vite-built trip.html / stories.html / food.html (hashed assets).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://universum-sliver.vercel.app';
const DIST = 'dist';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function coverUrl(tripId, coverSrc) {
  if (!coverSrc) return `${ORIGIN}/images/hub-hero.webp`;
  if (/^https?:\/\//.test(coverSrc)) return coverSrc;
  return `${ORIGIN}/trips/${encodeURIComponent(tripId)}/${coverSrc}`;
}

function assetUrl(tripId, rel) {
  if (!rel) return '';
  if (/^https?:\/\//.test(rel)) return rel;
  return `/trips/${encodeURIComponent(tripId)}/${rel}`;
}

function injectHead(html, { title, description, url, image }) {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);

  const metas = [
    ['name', 'description', description],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', '宇宙碎片集散地'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
  ];

  for (const [attr, key, content] of metas) {
    const re = new RegExp(
      `<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`,
      'i'
    );
    const tag = `<meta ${attr}="${key}" content="${esc(content)}">`;
    if (re.test(out)) out = out.replace(re, tag);
    else out = out.replace('</head>', `    ${tag}\n</head>`);
  }

  const canonical = `<link rel="canonical" href="${esc(url)}">`;
  if (/rel="canonical"/i.test(out)) {
    out = out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonical);
  } else {
    out = out.replace('</head>', `    ${canonical}\n</head>`);
  }

  return out;
}

function overviewRows(overview) {
  return (overview || [])
    .map((r, i) => {
      const tone = i % 2 === 0 ? 'overview-day--a' : 'overview-day--b';
      const transport = esc(r.transport || '');
      return `
    <tr class="overview-meta ${tone}">
      <td data-label="天數"><span class="day-badge">${esc(r.day)}</span></td>
      <td data-label="日期">${esc(r.date)}</td>
      <td data-label="主要地點">${esc(r.places)}</td>
      <td data-label="住宿">${esc(r.hotel)}</td>
      <td data-label="交通重點"><span class="transport-tag">${transport}</span></td>
    </tr>`;
    })
    .join('');
}

function daySections(days, tripId) {
  return (days || [])
    .map((day) => {
      const items = (day.timeline || [])
        .map(
          (item) => `
        <div class="timeline-item">
          ${item.time ? `<div class="timeline-time">${esc(item.time)}</div>` : ''}
          <div class="timeline-content">
            <h4>${esc(item.place)}</h4>
            <p>${esc(item.desc)}</p>
            ${item.detail ? `<p class="timeline-detail">${esc(item.detail)}</p>` : ''}
          </div>
        </div>`
        )
        .join('');
      const photo = day.photo?.src
        ? `<figure class="ph ph--day ph--loaded"><img class="ph-img" src="${esc(assetUrl(tripId, day.photo.src))}" alt="${esc(day.photo.alt || day.title || '')}" loading="lazy" decoding="async"></figure>`
        : '';
      return `
    <section id="${esc(day.id || `day${day.number}`)}" class="section day-section${photo ? ' day-section--photo' : ''}">
      ${photo}
      <div class="day-body">
        <div class="day-header">
          <div class="day-number">${esc(day.number)}</div>
          <div class="day-info">
            <span class="day-date">${esc(day.date)}</span>
            <h2>${esc(day.title)}</h2>
          </div>
        </div>
        <div class="timeline">${items}</div>
      </div>
    </section>`;
    })
    .join('');
}

function heroHtml(meta, days, tripId) {
  const cover = meta.cover?.src
    ? `<figure class="ph ph--hero ph--loaded"><img class="ph-img" src="${esc(assetUrl(tripId, meta.cover.src))}" alt="${esc(meta.cover.alt || meta.title || '')}" fetchpriority="high" loading="eager" decoding="async">${meta.cover.credit ? `<span class="ph-credit ph-credit--hero">${esc(meta.cover.credit)}</span>` : ''}</figure><div class="hero-photo-overlay"></div>`
    : '';
  return `
    ${cover}
    <a class="hero-back" href="/" aria-label="返回行程總覽"><span>返回總覽</span></a>
    <div class="hero-content">
      <span class="hero-badge">${esc(meta.badge || '')}</span>
      <h1>${esc(meta.title || '')}</h1>
      <p class="hero-subtitle">${esc(meta.subtitle || '')}</p>
      <div class="hero-info">
        <div class="info-item"><span>${esc(meta.dateRange || '')}</span></div>
        ${days?.length ? `<div class="info-item"><span>${days.length} 天</span></div>` : ''}
        ${meta.ticketSummary ? `<div class="info-item"><span>${esc(meta.ticketSummary)}</span></div>` : ''}
      </div>
    </div>`;
}

const THEME_STORY = { place: '景點', history: '歷史', culture: '文化' };
const THEME_FOOD = { food: '食物', sake: '酒' };

function chaptersHtml(items, tripId, themeMap) {
  if (!items?.length) {
    return `<div class="stories-empty"><p class="stories-empty-title">尚無章節</p></div>`;
  }
  return items
    .map((story, index) => {
      const n = String(index + 1).padStart(2, '0');
      const theme = themeMap[story.theme] || '';
      const media = story.photo?.src
        ? `<figure class="ph ph--story ph--loaded"><img class="ph-img" src="${esc(assetUrl(tripId, story.photo.src))}" alt="${esc(story.photo.alt || story.title || '')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></figure>`
        : '<div class="story-chapter-fallback" aria-hidden="true"></div>';
      const source =
        story.source?.url && story.source?.label
          ? `<a class="story-chapter-source" href="${esc(story.source.url)}" target="_blank" rel="noopener noreferrer">${esc(story.source.label)}</a>`
          : '';
      return `
    <section class="story-chapter story-chapter--visible">
      ${media}
      <div class="story-chapter-scrim" aria-hidden="true"></div>
      <div class="story-chapter-copy">
        <div class="story-chapter-meta">
          <span class="story-chapter-index" aria-hidden="true">${n}</span>
          ${theme ? `<span class="story-chapter-theme">${esc(theme)}</span>` : ''}
          ${story.kicker ? `<span class="story-chapter-kicker">${esc(story.kicker)}</span>` : ''}
        </div>
        <h2 class="story-chapter-title">${esc(story.title || '')}</h2>
        <p class="story-chapter-body">${esc(story.body || '')}</p>
        ${source}
      </div>
    </section>`;
    })
    .join('');
}

function setBodyTheme(html, theme) {
  if (!theme) return html;
  return html.replace(/<body([^>]*)>/, (m, attrs) => {
    if (/class=/.test(attrs)) {
      return `<body${attrs.replace(/class="([^"]*)"/, `class="$1 theme-${theme}"`)}>`;
    }
    return `<body class="theme-${theme}"${attrs}>`;
  });
}

function writeTripPages(tripId, data, templates) {
  const meta = data.meta || {};
  const enc = encodeURIComponent(tripId);
  const dir = join(DIST, 'trips', tripId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const image = coverUrl(tripId, meta.cover?.src);
  const desc = meta.subtitle || meta.title || '';

  // trip index
  {
    const url = `${ORIGIN}/trips/${enc}/`;
    const title = `${meta.title || tripId} | ${meta.badge || '宇宙碎片集散地'}`;
    let html = injectHead(templates.trip, { title, description: desc, url, image });
    html = setBodyTheme(html, meta.theme);
    const hero = heroHtml(meta, data.days, tripId);
    html = html.replace(
      /<header id="hero-root" class="hero"><\/header>/,
      `<header id="hero-root" class="hero${meta.cover?.src ? ' hero-photo' : ''}">${hero}</header>`
    );
    html = html.replace(
      /<tbody id="overview-body"><\/tbody>/,
      `<tbody id="overview-body">${overviewRows(data.overview)}</tbody>`
    );
    html = html.replace(
      /<div id="days-root"><\/div>/,
      `<div id="days-root">${daySections(data.days, tripId)}</div>`
    );
    writeFileSync(join(dir, 'index.html'), html);
  }

  // stories
  {
    const url = `${ORIGIN}/trips/${enc}/stories.html`;
    const title = `風土 | ${meta.title || tripId}`;
    const sdesc = `這趟旅程裡，值得收下的景點、歷史與文化——${meta.title || ''}`;
    let html = injectHead(templates.stories, { title, description: sdesc, url, image });
    html = setBodyTheme(html, meta.theme);
    const h1 = meta.title ? `${esc(meta.title)} · 風土` : '風土';
    html = html.replace(
      /<h1 id="stories-trip-title">[^<]*<\/h1>/,
      `<h1 id="stories-trip-title">${h1}</h1>`
    );
    html = html.replace(
      /<main id="stories-root" class="stories-chapters" aria-label="風土"><\/main>/,
      `<main id="stories-root" class="stories-chapters" aria-label="風土">${chaptersHtml(data.stories, tripId, THEME_STORY)}</main>`
    );
    writeFileSync(join(dir, 'stories.html'), html);
  }

  // food
  {
    const url = `${ORIGIN}/trips/${enc}/food.html`;
    const title = `飲食 | ${meta.title || tripId}`;
    const fdesc = `這趟旅程裡，值得嚐一口的食物與酒——${meta.title || ''}`;
    let html = injectHead(templates.food, { title, description: fdesc, url, image });
    html = setBodyTheme(html, meta.theme);
    const h1 = meta.title ? `${esc(meta.title)} · 飲食` : '飲食';
    html = html.replace(
      /<h1 id="food-trip-title">[^<]*<\/h1>/,
      `<h1 id="food-trip-title">${h1}</h1>`
    );
    html = html.replace(
      /<main id="food-root" class="stories-chapters" aria-label="飲食"><\/main>/,
      `<main id="food-root" class="stories-chapters" aria-label="飲食">${chaptersHtml(data.foods, tripId, THEME_FOOD)}</main>`
    );
    writeFileSync(join(dir, 'food.html'), html);
  }
}

function main() {
  const tripTpl = join(DIST, 'trip.html');
  const storiesTpl = join(DIST, 'stories.html');
  const foodTpl = join(DIST, 'food.html');
  if (!existsSync(tripTpl)) {
    console.error('prerender: dist/trip.html missing — run vite build first');
    process.exit(1);
  }

  const templates = {
    trip: readFileSync(tripTpl, 'utf8'),
    stories: readFileSync(storiesTpl, 'utf8'),
    food: readFileSync(foodTpl, 'utf8'),
  };

  const manifest = JSON.parse(readFileSync('trips/manifest.json', 'utf8'));
  let n = 0;
  for (const t of manifest.trips) {
    const id = t.id;
    const path = join('trips', id, 'itinerary.json');
    if (!existsSync(path)) {
      console.warn('prerender: skip missing', path);
      continue;
    }
    const data = JSON.parse(readFileSync(path, 'utf8'));
    writeTripPages(id, data, templates);
    n += 1;
  }
  console.log('prerender: wrote trip/stories/food HTML for', n, 'trips');
}

main();
