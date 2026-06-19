import { loadManifest, tripUrl } from './load-trip.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function sortTrips(trips) {
  const order = { upcoming: 0, past: 1 };
  return [...trips].sort((a, b) => {
    const sa = order[a.status] ?? 2;
    const sb = order[b.status] ?? 2;
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
        <div class="trip-card-emoji">${t.emoji || '✈️'}</div>
        <h2>${esc(t.title)}</h2>
        <p class="trip-card-sub">${esc(t.subtitle || '')}</p>
        <p class="trip-card-date">📅 ${esc(t.dateRange || '')}</p>
        ${t.status === 'past' ? '<span class="trip-card-badge past">已結束</span>' : '<span class="trip-card-badge">即將出發</span>'}
      </a>
    `).join('');
  } catch (err) {
    root.innerHTML = `<p class="hub-empty">無法載入行程列表：${esc(err.message)}</p>`;
  }
}

init();
