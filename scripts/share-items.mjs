import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/** Keep in sync with js/site.js SITE_ORIGIN. */
export const SITE_ORIGIN = 'https://universum-sliver.vercel.app';

export function xmlEscape(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function encodeTripId(id) {
  return encodeURIComponent(id);
}

export function tripPageUrl(id, page = 'trip') {
  const enc = encodeTripId(id);
  if (page === 'stories') return `${SITE_ORIGIN}/trips/${enc}/stories.html`;
  if (page === 'food') return `${SITE_ORIGIN}/trips/${enc}/food.html`;
  return `${SITE_ORIGIN}/trips/${enc}/`;
}

export function tripAssetUrl(id, rel) {
  if (!rel) return '';
  const clean = String(rel).replace(/^\.\//, '').replace(/^\/+/, '');
  return `${SITE_ORIGIN}/trips/${encodeTripId(id)}/${clean}`;
}

export function chapterAnchor(kind, index) {
  const prefix = kind === 'food' ? 'food' : 'story';
  return `${prefix}-${index + 1}`;
}

export function withUtm(url, { source, medium = 'social', content } = {}) {
  const u = new URL(url);
  if (source) u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', 'share');
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}

export function loadManifest() {
  return JSON.parse(readFileSync('trips/manifest.json', 'utf8'));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function yearFromTripId(id) {
  const m = String(id).match(/^(\d{4})_/);
  return m ? Number(m[1]) : 0;
}

/** Trip start as ISO; from manifest/meta dateRange, not filesystem mtime (snapshots may be epoch). */
export function tripStartIso(tripId, meta = {}, manifestTrip = {}) {
  const year = yearFromTripId(tripId) || 2020;
  const range = manifestTrip.dateRange || meta.dateRange || '';
  const withYear = String(range).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (withYear) {
    const [, y, mo, d] = withYear;
    return `${y}-${pad2(mo)}-${pad2(d)}T00:00:00.000Z`;
  }
  const md = String(range).match(/(\d{1,2})\/(\d{1,2})/);
  if (md) {
    return `${year}-${pad2(md[1])}-${pad2(md[2])}T00:00:00.000Z`;
  }
  return `${year}-01-01T00:00:00.000Z`;
}

export function gitIsoDay(filePath) {
  try {
    const day = execFileSync('git', ['log', '-1', '--format=%cs', '--', filePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  } catch {
    /* not a git checkout, or no history for the file */
  }
  if (existsSync(filePath)) {
    const t = statSync(filePath).mtimeMs;
    if (t >= Date.parse('2000-01-01')) return new Date(t).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Flatten trips + stories + foods into shareable units.
 * @returns {Array<object>}
 */
export function collectShareItems() {
  const manifest = loadManifest();
  const items = [];

  for (const trip of manifest.trips || []) {
    const id = trip.id;
    if (!id) continue;
    const itineraryPath = join('trips', id, 'itinerary.json');
    if (!existsSync(itineraryPath)) continue;

    const data = JSON.parse(readFileSync(itineraryPath, 'utf8'));
    const meta = data.meta || {};
    const tripTitle = meta.title || trip.title || id;
    const cover = tripAssetUrl(id, meta.cover?.src || trip.cover);
    const year = yearFromTripId(id);
    const startIso = tripStartIso(id, meta, trip);

    items.push({
      guid: tripPageUrl(id),
      kind: 'trip',
      tripId: id,
      tripTitle,
      title: tripTitle,
      kicker: meta.subtitle || trip.subtitle || trip.location || '',
      body: (meta.highlights || []).slice(0, 3).join(' ') || meta.subtitle || '',
      url: tripPageUrl(id),
      image: cover,
      imageCredit: meta.cover?.credit || trip.coverCredit || '',
      updated: startIso,
      year,
      index: 0,
      utmContent: `trip-${id}`,
    });

    (data.stories || []).forEach((story, index) => {
      const url = `${tripPageUrl(id, 'stories')}#${chapterAnchor('story', index)}`;
      items.push({
        guid: url,
        kind: 'story',
        tripId: id,
        tripTitle,
        title: story.title || `風土 ${index + 1}`,
        kicker: story.kicker || '',
        body: story.body || '',
        url,
        image: tripAssetUrl(id, story.photo?.src) || cover,
        imageCredit: story.photo?.credit || '',
        updated: startIso,
        year,
        index,
        utmContent: `story-${id}-${index + 1}`,
      });
    });

    (data.foods || []).forEach((food, index) => {
      const url = `${tripPageUrl(id, 'food')}#${chapterAnchor('food', index)}`;
      items.push({
        guid: url,
        kind: 'food',
        tripId: id,
        tripTitle,
        title: food.title || `飲食 ${index + 1}`,
        kicker: food.kicker || '',
        body: food.body || '',
        url,
        image: tripAssetUrl(id, food.photo?.src) || cover,
        imageCredit: food.photo?.credit || '',
        updated: startIso,
        year,
        index,
        utmContent: `food-${id}-${index + 1}`,
      });
    });
  }

  items.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.tripId !== b.tripId) return a.tripId.localeCompare(b.tripId, 'zh-Hant');
    const order = { trip: 0, story: 1, food: 2 };
    if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
    return a.index - b.index;
  });

  return items;
}
