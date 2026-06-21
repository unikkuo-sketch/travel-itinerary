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

async function init() {
  const root = document.getElementById('hub-grid');
  if (!root) return;

  try {
    const { trips } = await loadManifest();
    const sorted = sortTrips(trips);

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
  } catch (err) {
    root.innerHTML = `<p class="hub-empty">無法載入行程列表：${esc(err.message)}</p>`;
  }
}

init();
