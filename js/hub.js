import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-icons.js';
import { loadManifest, tripUrl } from './load-trip.js';
import { icon } from './icons.js';
import { photoHtml, tripAssetUrl } from './photo.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

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

function tripIsPast(trip) {
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

function sortTrips(trips) {
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

function fragmentMarkerIcon() {
  return L.divIcon({
    className: 'hub-map-marker',
    html: `<span class="hub-map-marker-dot" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3-1.9 5.8L4 12l6.1 3.2L12 21l1.9-5.8L20 12l-6.1-3.2Z"/>
      </svg>
    </span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function featuredPopupHtml(t) {
  const past = tripIsPast(t);
  const thumb = t.cover
    ? `<div class="featured-popup-thumb">
        <img src="${esc(tripAssetUrl(t.id, t.cover))}" alt="" loading="lazy" decoding="async">
      </div>`
    : '';
  return `
    <div class="featured-popup">
      ${thumb}
      <span class="section-eyebrow">${past ? '旅程回顧' : '即將啟程'}</span>
      <h3>${esc(t.title)}</h3>
      <p class="trip-card-sub">${esc(t.subtitle || '')}</p>
      <p class="trip-card-date">${esc(t.dateRange || '')}</p>
      <a class="featured-popup-cta" href="${tripUrl(t.id)}">查看行程 →</a>
    </div>
  `;
}

function renderFeaturedMap(sorted) {
  const el = document.getElementById('featured-map');
  if (!el) return;

  const pinned = sorted.filter((t) => Array.isArray(t.coords) && t.coords.length === 2);
  if (!pinned.length) {
    el.innerHTML = '<p class="hub-empty">行程尚未標註地點座標。</p>';
    return;
  }

  const map = L.map(el, {
    scrollWheelZoom: false,
    minZoom: 1,
    maxZoom: 4,
  }).setView([20, 10], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 4,
  }).addTo(map);

  const pinIcon = fragmentMarkerIcon();
  pinned.forEach((t) => {
    L.marker(t.coords, { icon: pinIcon }).addTo(map).bindPopup(featuredPopupHtml(t), {
      className: 'featured-popup-wrap',
      maxWidth: 280,
    });
  });
}

function renderWelcomeGrid() {
  const root = document.getElementById('welcome-grid');
  if (!root) return;

  const items = [
    { name: 'map', title: '路線與日程', desc: '總覽與每日動線，方便對照自己的排程' },
    { name: 'landmark', title: '風土與飲食', desc: '景點、歷史、文化與在地吃喝筆記' },
    { name: 'budget', title: '預算參考', desc: '當時每人費用概估，非正式報價' },
    { name: 'shopping', title: '購物建議', desc: '在地清單可瀏覽；勾選僅存你的本機' },
  ];

  root.innerHTML = items
    .map(
      (item) => `
      <div class="welcome-card">
        <span class="welcome-card-icon">${icon(item.name, 'icon welcome-card-svg')}</span>
        <h3 class="welcome-card-title">${esc(item.title)}</h3>
        <p class="welcome-card-desc">${esc(item.desc)}</p>
      </div>
    `
    )
    .join('');
}

function tripCardHtml(t) {
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

function renderHubGrid(sorted) {
  const upcomingRoot = document.getElementById('hub-upcoming');
  const pastRoot = document.getElementById('hub-past');
  const upcomingWrap = document.getElementById('hub-upcoming-wrap');
  const pastWrap = document.getElementById('hub-past-wrap');
  const emptyEl = document.getElementById('hub-empty');
  if (!upcomingRoot && !pastRoot) return;

  const upcoming = sorted.filter((t) => !tripIsPast(t));
  const past = sorted.filter((t) => tripIsPast(t));

  if (upcomingRoot && upcomingWrap) {
    if (upcoming.length) {
      upcomingWrap.hidden = false;
      upcomingRoot.innerHTML = upcoming.map(tripCardHtml).join('');
    } else {
      upcomingWrap.hidden = true;
      upcomingRoot.innerHTML = '';
    }
  }

  if (pastRoot && pastWrap) {
    if (past.length) {
      pastWrap.hidden = false;
      pastRoot.innerHTML = past.map(tripCardHtml).join('');
    } else {
      pastWrap.hidden = true;
      pastRoot.innerHTML = '';
    }
  }

  if (emptyEl) {
    emptyEl.hidden = Boolean(upcoming.length || past.length);
  }
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((item) => observer.observe(item));
}

async function init() {
  initReveal();
  renderWelcomeGrid();

  const featuredRoot = document.getElementById('featured-map');
  const hubRoot = document.getElementById('hub-upcoming') || document.getElementById('hub-past');
  if (!featuredRoot && !hubRoot) return;

  try {
    const { trips } = await loadManifest();
    const sorted = sortTrips(trips);
    renderFeaturedMap(sorted);
    renderHubGrid(sorted);
  } catch (err) {
    const emptyEl = document.getElementById('hub-empty');
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = `無法載入行程列表：${err.message}`;
    }
    if (featuredRoot) featuredRoot.innerHTML = '';
  }
}

init();
