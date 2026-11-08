import { tripUrl } from './load-trip.js';
import { esc, photoHtml, tripAssetUrl } from './photo.js';

function parseRangeDate(dateStr, fallbackYear) {
  if (!dateStr) return null;
  const full = /^\d{4}\//.test(dateStr) ? dateStr : `${fallbackYear}/${dateStr.replace(/^\//, '')}`;
  const [y, mo, d] = full.split('/').map((n) => parseInt(n, 10));
  if (!y || !mo || !d) return null;
  return { y, mo, d };
}

function parseTripStart(dateRange) {
  if (!dateRange) return null;
  const [start] = dateRange.split(/\s*-\s*/);
  const p = parseRangeDate(start, String(new Date().getFullYear()));
  return p ? new Date(p.y, p.mo - 1, p.d) : null;
}

function parseTripEnd(dateRange) {
  if (!dateRange) return null;
  const [start, end] = dateRange.split(/\s*-\s*/);
  if (!start || !end) return null;
  const year = start.match(/^(\d{4})\//)?.[1] || String(new Date().getFullYear());
  const p = parseRangeDate(end, year);
  return p ? new Date(p.y, p.mo - 1, p.d, 23, 59, 59, 999) : null;
}

export function tripIsPast(trip) {
  const end = parseTripEnd(trip.dateRange);
  if (end) return Date.now() > end.getTime();
  return trip.status === 'past';
}

function tripStatusLabel(trip) {
  if (tripIsPast(trip)) return { text: '旅程結束', cls: 'past' };
  const start = parseTripStart(trip.dateRange);
  const end = parseTripEnd(trip.dateRange);
  const now = Date.now();
  if (start && end && now >= start.getTime() && now <= end.getTime()) {
    return { text: '旅行中', cls: 'active' };
  }
  if (start) {
    const daysLeft = Math.ceil((start.getTime() - now) / 86400000);
    if (daysLeft <= 60) return { text: `${daysLeft} 天後出發`, cls: '' };
  }
  return { text: '即將出發', cls: '' };
}

export function sortTrips(trips) {
  const order = { upcoming: 0, past: 1 };
  return [...trips].sort((a, b) => {
    const sa = order[tripIsPast(a) ? 'past' : 'upcoming'] ?? 2;
    const sb = order[tripIsPast(b) ? 'past' : 'upcoming'] ?? 2;
    if (sa !== sb) return sa - sb;
    return (b.dateRange || '').localeCompare(a.dateRange || '');
  });
}

function tripMonthTag(dateRange) {
  const start = parseTripStart(dateRange);
  if (!start) return '';
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}`;
}

function tripPlaceTag(t) {
  if (/日本/.test(t.title || '') || /日本/.test(t.id || '')) return '日本';
  if (!t.location) return '';
  return t.location.split(/[・·,，]/)[0].trim();
}

export function tripCardHtml(t) {
  const status = tripStatusLabel(t);
  const cover = t.cover
    ? photoHtml(
        { src: tripAssetUrl(t.id, t.cover), alt: t.coverAlt || t.title, credit: t.coverCredit },
        { className: 'ph--card' }
      )
    : `<div class="ph ph--card ph--fallback"><span class="ph-fallback-emoji">${esc(t.emoji || '🌏')}</span></div>`;

  const tags = [
    tripMonthTag(t.dateRange),
    tripPlaceTag(t),
    t.days ? `${t.days}天` : '',
  ].filter(Boolean);

  const tagHtml = tags
    .map((tag) => `<span class="trip-card-tag">${esc(tag)}</span>`)
    .join('');

  return `
      <a class="trip-card" href="${tripUrl(t.id)}">
        <div class="trip-card-media">
          ${cover}
          <span class="trip-card-badge ${status.cls}">${status.text}</span>
        </div>
        <div class="trip-card-body">
          <h2>${esc(t.title)}</h2>
          <p class="trip-card-sub">${esc(t.subtitle || '')}</p>
          <div class="trip-card-tags">${tagHtml}</div>
        </div>
      </a>
    `;
}
