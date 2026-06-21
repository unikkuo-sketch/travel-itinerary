import { parseYen, formatYen } from './recap-storage.js';
import { tripUrl } from './load-trip.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text ?? '';
  return el.innerHTML;
}

function diffClass(planned, actual) {
  const p = parseYen(planned);
  const a = parseYen(actual);
  if (p == null || a == null) return '';
  if (a < p) return 'recap-diff--under';
  if (a > p) return 'recap-diff--over';
  return 'recap-diff--even';
}

function diffText(planned, actual) {
  const p = parseYen(planned);
  const a = parseYen(actual);
  if (p == null || a == null || !actual) return '—';
  const d = a - p;
  if (d === 0) return '±0';
  const sign = d > 0 ? '+' : '-';
  return `${sign}${formatYen(Math.abs(d))}`;
}

function groupPhotosByDay(photos, days) {
  const groups = new Map();
  (days || []).forEach((d) => groups.set(d.number, { day: d.number, title: d.title, photos: [] }));
  groups.set(0, { day: 0, title: '其他', photos: [] });

  (photos || []).forEach((p) => {
    const key = groups.has(p.day) ? p.day : 0;
    groups.get(key).photos.push(p);
  });

  return [...groups.values()].filter((g) => g.photos.length > 0);
}

async function resolvePhotoUrls(photos, photoResolver) {
  const resolved = [];
  for (const p of photos || []) {
    const url = typeof photoResolver === 'function'
      ? await photoResolver(p)
      : photoResolver;
    if (url) resolved.push({ ...p, url });
  }
  return resolved;
}

function renderPhotoGrid(photosWithUrl) {
  if (!photosWithUrl.length) {
    return '<p class="recap-empty-inline">尚無旅後照片</p>';
  }
  return `<div class="recap-photo-grid">${photosWithUrl.map((p, i) => `
    <button type="button" class="recap-photo-card" data-lightbox-index="${i}" aria-label="${esc(p.caption || `Day ${p.day} 照片`)}">
      <img src="${esc(p.url)}" alt="${esc(p.caption || '')}" loading="lazy">
      ${p.caption ? `<span class="recap-photo-caption">${esc(p.caption)}</span>` : ''}
    </button>
  `).join('')}</div>`;
}

function renderPhotoSections(groups, photosWithUrl) {
  if (!photosWithUrl.length) {
    return '<p class="recap-empty-inline">尚無旅後照片</p>';
  }

  const indexById = new Map(photosWithUrl.map((p, i) => [p.id, i]));

  return groups.map((g) => {
    const grid = g.photos.map((p) => {
      const resolved = photosWithUrl[indexById.get(p.id)];
      if (!resolved) return '';
      return `
      <button type="button" class="recap-photo-card" data-lightbox-index="${indexById.get(p.id)}" aria-label="${esc(p.caption || `Day ${g.day} 照片`)}">
        <img src="${esc(resolved.url)}" alt="${esc(p.caption || '')}" loading="lazy">
        ${p.caption ? `<span class="recap-photo-caption">${esc(p.caption)}</span>` : ''}
      </button>`;
    }).join('');

    return `
      <div class="recap-day-group">
        <h3 class="recap-day-title"><span class="day-badge">${g.day || '?'}</span> ${esc(g.title)}</h3>
        <div class="recap-photo-grid">${grid}</div>
      </div>`;
  }).join('');
}

function renderExpenseTable(items) {
  if (!items?.length) {
    return '<p class="recap-empty-inline">尚無花費紀錄</p>';
  }

  const rows = items.map((item) => `
    <tr class="recap-expense-row">
      <td class="recap-expense-label" data-label="項目">
        <span class="recap-expense-cat">${esc(item.categoryTitle)}</span>
        ${esc(item.label)}
      </td>
      <td data-label="規劃">${esc(item.planned)}</td>
      <td data-label="實際">${esc(item.actual || '—')}</td>
      <td data-label="差異" class="recap-diff ${diffClass(item.planned, item.actual)}">${esc(diffText(item.planned, item.actual))}</td>
    </tr>
  `).join('');

  return `
    <div class="recap-expense-wrap">
      <table class="recap-expense-table">
        <thead>
          <tr><th>項目</th><th>規劃</th><th>實際</th><th>差異</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderCompareCards(items, budget, recap) {
  if (!items?.length) {
    return '<p class="recap-empty-inline">尚無對照資料</p>';
  }

  const cards = items.filter((i) => i.actual).map((item) => `
    <article class="recap-compare-card">
      <p class="recap-compare-cat">${esc(item.categoryTitle)}</p>
      <h4 class="recap-compare-label">${esc(item.label)}</h4>
      <div class="recap-compare-row">
        <div><span class="recap-compare-tag">規劃</span><strong>${esc(item.planned)}</strong></div>
        <div><span class="recap-compare-tag">實際</span><strong>${esc(item.actual)}</strong></div>
        <div class="recap-diff ${diffClass(item.planned, item.actual)}">${esc(diffText(item.planned, item.actual))}</div>
      </div>
    </article>
  `).join('');

  const actual = recap?.expenses?.totalActual;

  return `
    <div class="recap-compare-grid">${cards || '<p class="recap-empty-inline">填寫實際花費後可在此對照</p>'}</div>
    <div class="recap-totals">
      <div class="recap-total-card">
        <span class="recap-total-label">規劃總預算</span>
        <strong>${esc(budget?.total?.amount || '—')}</strong>
        ${budget?.total?.twd ? `<span class="recap-total-sub">${esc(budget.total.twd)}</span>` : ''}
      </div>
      <div class="recap-total-card recap-total-card--actual">
        <span class="recap-total-label">實際總計</span>
        <strong>${esc(actual?.amount || '—')}</strong>
        ${actual?.twd ? `<span class="recap-total-sub">${esc(actual.twd)}</span>` : ''}
      </div>
    </div>`;
}

function renderTotals(recap, budget) {
  const actual = recap?.expenses?.totalActual;
  return `
    <div class="recap-totals">
      <div class="recap-total-card">
        <span class="recap-total-label">規劃總預算</span>
        <strong>${esc(budget?.total?.amount || '—')}</strong>
        ${budget?.total?.twd ? `<span class="recap-total-sub">${esc(budget.total.twd)}</span>` : ''}
      </div>
      <div class="recap-total-card recap-total-card--actual">
        <span class="recap-total-label">實際總計</span>
        <strong>${esc(actual?.amount || '—')}</strong>
        ${actual?.twd ? `<span class="recap-total-sub">${esc(actual.twd)}</span>` : ''}
      </div>
    </div>
    ${recap?.expenses?.notes ? `<p class="recap-notes">${esc(recap.expenses.notes)}</p>` : ''}`;
}

function renderEmptyState(tripId) {
  return `
    <div class="recap-empty">
      <p class="recap-empty-title">旅後可在此記錄真實模樣</p>
      <p class="recap-empty-desc">上傳照片、記錄實際花費，與出發前的規劃並陳對照。</p>
      <a href="${tripUrl(tripId, 'recap')}" class="btn-recap">開始記錄</a>
    </div>`;
}

export function initRecapTabs(root) {
  const tabs = root.querySelectorAll('.recap-tab');
  const panels = root.querySelectorAll('.recap-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
}

export function initLightbox(root, photosWithUrl) {
  if (!photosWithUrl.length) return;

  let index = 0;
  const overlay = document.createElement('div');
  overlay.className = 'recap-lightbox';
  overlay.hidden = true;
  overlay.innerHTML = `
    <button type="button" class="recap-lightbox-close" aria-label="關閉">&times;</button>
    <button type="button" class="recap-lightbox-prev" aria-label="上一張">‹</button>
    <button type="button" class="recap-lightbox-next" aria-label="下一張">›</button>
    <figure class="recap-lightbox-figure">
      <img class="recap-lightbox-img" alt="">
      <figcaption class="recap-lightbox-caption"></figcaption>
    </figure>`;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.recap-lightbox-img');
  const caption = overlay.querySelector('.recap-lightbox-caption');

  function show(i) {
    index = (i + photosWithUrl.length) % photosWithUrl.length;
    const p = photosWithUrl[index];
    img.src = p.url;
    img.alt = p.caption || '';
    caption.textContent = p.caption || '';
    overlay.hidden = false;
    document.body.classList.add('recap-lightbox-open');
  }

  function hide() {
    overlay.hidden = true;
    document.body.classList.remove('recap-lightbox-open');
    img.src = '';
  }

  root.querySelectorAll('[data-lightbox-index]').forEach((btn) => {
    btn.addEventListener('click', () => show(Number(btn.dataset.lightboxIndex)));
  });

  overlay.querySelector('.recap-lightbox-close').addEventListener('click', hide);
  overlay.querySelector('.recap-lightbox-prev').addEventListener('click', () => show(index - 1));
  overlay.querySelector('.recap-lightbox-next').addEventListener('click', () => show(index + 1));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hide(); });

  let touchX = 0;
  overlay.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].screenX; }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchX;
    if (Math.abs(dx) > 50) show(dx > 0 ? index - 1 : index + 1);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

export async function renderRecapSection(root, { tripId, tripData, displayData, editLink = true }) {
  if (!displayData) {
    root.innerHTML = renderEmptyState(tripId);
    return;
  }

  const { recap, localDraft, photoResolver } = displayData;
  const photosWithUrl = await resolvePhotoUrls(recap.photos, photoResolver);
  const groups = groupPhotosByDay(recap.photos, tripData.days);
  const items = recap.expenses?.items || [];

  const draftBadge = localDraft && displayData.source === 'published'
    ? '<span class="recap-draft-badge">本機草稿 · 匯出後可公開分享</span>'
    : displayData.source === 'local'
      ? '<span class="recap-draft-badge">本機草稿 · 僅此裝置可見</span>'
      : '';

  const editBtn = editLink
    ? `<a href="${tripUrl(tripId, 'recap')}" class="btn-recap btn-recap--ghost">編輯旅後紀錄</a>`
    : '';

  root.innerHTML = `
    <div class="recap-header-row">
      ${draftBadge}
      ${editBtn}
    </div>
    <div class="recap-tabs" role="tablist">
      <button type="button" class="recap-tab active" data-tab="all" role="tab">全部</button>
      <button type="button" class="recap-tab" data-tab="photos" role="tab">相片</button>
      <button type="button" class="recap-tab" data-tab="expenses" role="tab">花費</button>
      <button type="button" class="recap-tab" data-tab="compare" role="tab">對照</button>
    </div>
    <div class="recap-panels">
      <div class="recap-panel active" data-panel="all">
        ${renderPhotoSections(groups, photosWithUrl)}
        ${renderExpenseTable(items)}
        ${renderTotals(recap, tripData.budget)}
      </div>
      <div class="recap-panel" data-panel="photos">
        ${renderPhotoSections(groups, photosWithUrl)}
      </div>
      <div class="recap-panel" data-panel="expenses">
        ${renderExpenseTable(items)}
        ${renderTotals(recap, tripData.budget)}
      </div>
      <div class="recap-panel" data-panel="compare">
        ${renderCompareCards(items, tripData.budget, recap)}
      </div>
    </div>`;

  initRecapTabs(root);
  initLightbox(root, photosWithUrl);
}

export { groupPhotosByDay, resolvePhotoUrls, renderPhotoGrid, diffClass, diffText };
