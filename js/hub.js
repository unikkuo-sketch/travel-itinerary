import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-icons.js';
import { loadManifest, tripUrl } from './load-trip.js';
import { icon } from './icons.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function parseTripEnd(dateRange) {
  if (!dateRange) return null;
  const [start, end] = dateRange.split(/\s*-\s*/);
  if (!start || !end) return null;
  const year = start.match(/^(\d{4})\//)?.[1] || String(new Date().getFullYear());
  const endFull = /^\d{4}\//.test(end) ? end : `${year}/${end.replace(/^\//, '')}`;
  const [y, mo, d] = endFull.split('/').map((n) => parseInt(n, 10));
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, 23, 59, 59, 999);
}

function tripIsPast(trip) {
  const end = parseTripEnd(trip.dateRange);
  if (end) return Date.now() > end.getTime();
  return trip.status === 'past';
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

function featuredPopupHtml(t) {
  const past = tripIsPast(t);
  return `
    <div class="featured-popup">
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

  const map = L.map(el, { scrollWheelZoom: false }).setView([20, 20], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  const markers = pinned.map((t) =>
    L.marker(t.coords).addTo(map).bindPopup(featuredPopupHtml(t))
  );

  if (markers.length === 1) {
    map.setView(pinned[0].coords, 5);
  } else {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 6 });
  }
}

function renderHubGrid(sorted) {
  const root = document.getElementById('hub-grid');
  if (!root) return;

  if (!sorted.length) {
    root.innerHTML = '<p class="hub-empty">尚無行程，請參考 docs/add-trip.md 新增。</p>';
    return;
  }

  root.innerHTML = sorted.map((t) => `
    <a class="trip-card" href="${tripUrl(t.id)}">
      <h2>${esc(t.title)}</h2>
      <p class="trip-card-sub">${esc(t.subtitle || '')}</p>
      <p class="trip-card-date">${icon('calendar')}<time>${esc(t.dateRange || '')}</time></p>
      ${tripIsPast(t) ? '<span class="trip-card-badge past">旅程結束</span>' : '<span class="trip-card-badge">即將出發</span>'}
    </a>
  `).join('');
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

  const featuredRoot = document.getElementById('featured-map');
  const hubRoot = document.getElementById('hub-grid');
  if (!featuredRoot && !hubRoot) return;

  try {
    const { trips } = await loadManifest();
    const sorted = sortTrips(trips);
    renderFeaturedMap(sorted);
    renderHubGrid(sorted);
  } catch (err) {
    if (hubRoot) hubRoot.innerHTML = `<p class="hub-empty">無法載入行程列表：${esc(err.message)}</p>`;
    if (featuredRoot) featuredRoot.innerHTML = '';
  }
}

init();
