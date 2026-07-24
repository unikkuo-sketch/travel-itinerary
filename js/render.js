import { icon, iconFromEmoji, resolveTimelineIcon, stripTagEmoji } from './icons.js';
import { photoHtml, tripAssetUrl } from './photo.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

const TICKET_STATUS = {
  purchased: { label: '已購', cls: 'ticket-status--purchased' },
  pending: { label: '待購', cls: 'ticket-status--pending' },
  reservation: { label: '免費但需預約', cls: 'ticket-status--reservation' },
};

const TICKET_STATUS_ORDER = ['purchased', 'pending', 'reservation'];

function ticketStatusKey(tripId) {
  return `travelTicketStatus:${tripId}`;
}

function loadTicketStatusOverrides(tripId) {
  if (!tripId) return {};
  try {
    return JSON.parse(localStorage.getItem(ticketStatusKey(tripId)) || '{}');
  } catch {
    return {};
  }
}

function saveTicketStatus(tripId, index, status) {
  const all = loadTicketStatusOverrides(tripId);
  all[String(index)] = status;
  localStorage.setItem(ticketStatusKey(tripId), JSON.stringify(all));
}

function nextTicketStatus(current) {
  const i = TICKET_STATUS_ORDER.indexOf(current);
  return TICKET_STATUS_ORDER[(i + 1) % TICKET_STATUS_ORDER.length];
}

function resolveTicketStatus(ticket, index, overrides) {
  const override = overrides[String(index)];
  if (override && TICKET_STATUS[override]) return override;
  return ticket.status;
}

function renderTicketStatus(status, index) {
  const st = TICKET_STATUS[status];
  if (!st) return '';
  return `<button type="button" class="ticket-status ${st.cls}" data-ticket-index="${index}" data-ticket-status="${status}" title="點擊切換狀態" aria-label="票券狀態：${st.label}，點擊切換">${st.label}</button>`;
}

function renderTickets(tickets, overrides = {}) {
  return tickets.map((t, i) => {
    const status = resolveTicketStatus(t, i, overrides);
    return `
    <div class="ticket-card ${t.variant || ''}">
      <div class="ticket-header">
        <h3>${esc(t.title)}</h3>
        <div class="ticket-pills">
          <span class="ticket-badge">${esc(t.badge)}</span>
          ${renderTicketStatus(status, i)}
        </div>
      </div>
      <div class="ticket-price">${esc(t.price)}<span>${esc(t.priceSuffix)}</span></div>
      <div class="ticket-meta"><span>${esc(t.meta)}</span></div>
      <ul class="ticket-features">
        ${(t.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');
}

function mountTicketStatusControls(root, tripId) {
  if (!root || !tripId || root.dataset.ticketStatusBound === '1') return;
  root.dataset.ticketStatusBound = '1';
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ticket-status]');
    if (!btn || !root.contains(btn)) return;

    const index = Number(btn.dataset.ticketIndex);
    const current = btn.dataset.ticketStatus;
    const next = nextTicketStatus(current);
    const st = TICKET_STATUS[next];
    if (!st) return;

    saveTicketStatus(tripId, index, next);
    btn.dataset.ticketStatus = next;
    btn.className = `ticket-status ${st.cls}`;
    btn.textContent = st.label;
    btn.setAttribute('aria-label', `票券狀態：${st.label}，點擊切換`);
    btn.classList.remove('ticket-status--pop');
    void btn.offsetWidth;
    btn.classList.add('ticket-status--pop');
  });
}

function renderTransportCell(r) {
  const raw = r.transport || '';
  const parts = String(raw).split('／').map((s) => s.trim()).filter(Boolean);
  const cls = `transport-tag${r.transportClass ? ` ${r.transportClass}` : ''}`;
  if (parts.length <= 1) {
    return `<span class="${cls}">${esc(raw)}</span>`;
  }
  return `<span class="transport-stack">${parts.map((p) => `<span class="${cls}">${esc(p)}</span>`).join('')}</span>`;
}

function renderOverview(rows) {
  return rows
    .map((r, i) => {
      const tone = i % 2 === 0 ? 'overview-day--a' : 'overview-day--b';
      return `
    <tr class="overview-meta ${tone}">
      <td data-label="天數"><span class="day-badge">${r.day}</span></td>
      <td data-label="日期">${esc(r.date)}</td>
      <td data-label="主要地點">${esc(r.places)}</td>
      <td data-label="住宿">${esc(r.hotel)}</td>
      <td data-label="交通重點">${renderTransportCell(r)}</td>
    </tr>`;
    })
    .join('');
}

function mountOverviewHeader() {
  const thead = document.querySelector('#overview .overview-table thead tr');
  if (!thead) return;
  thead.innerHTML = `
    <th>天數</th>
    <th>日期</th>
    <th>主要地點</th>
    <th>住宿</th>
    <th>交通重點</th>`;
}

function highlightCardsFromMeta(meta) {
  if (meta?.highlightCards?.length) return meta.highlightCards;
  return (meta?.highlights || [])
    .filter(Boolean)
    .map((h) => {
      const text = String(h);
      const parts = text.split(/[：:]/);
      if (parts.length > 1) {
        return { icon: 'sparkle', title: parts[0].trim(), desc: parts.slice(1).join('：').trim() };
      }
      return { icon: 'sparkle', title: text, desc: '' };
    });
}

function renderHighlights(meta) {
  const cards = highlightCardsFromMeta(meta);
  if (!cards.length) return '';
  return cards
    .map((card, i) => {
      const n = String(i + 1).padStart(2, '0');
      return `
    <article class="highlight-card">
      <div class="highlight-card-top">
        <span class="highlight-num" aria-hidden="true">${n}</span>
        <span class="highlight-icon">${icon(card.icon || 'sparkle', 'icon')}</span>
      </div>
      <h3>${esc(card.title || '')}</h3>
      ${card.desc ? `<p>${esc(card.desc)}</p>` : ''}
    </article>`;
    })
    .join('');
}

function routeLabelForRow(row) {
  if (row.routeLabel) return row.routeLabel;
  const base = String(row.places || '').split('（')[0];
  const parts = base
    .split('→')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || base || `Day ${row.day}`;
}

function renderRouteStrip(overview, meta) {
  const rows = overview || [];
  if (!rows.length) return '';
  const regions = meta?.routeRegions
    ? `<p class="route-strip-regions">${esc(meta.routeRegions)}</p>`
    : '';
  const chips = rows
    .map((r, i) => {
      const label = routeLabelForRow(r);
      const arrow =
        i < rows.length - 1 ? '<span class="route-strip-arrow" aria-hidden="true">→</span>' : '';
      return `
      <a class="route-chip" href="#day${r.day}">
        <span class="route-chip-day">D${r.day}</span>
        <span class="route-chip-label">${esc(label)}</span>
      </a>${arrow}`;
    })
    .join('');
  return `${regions}<div class="route-strip-track" role="list">${chips}</div>`;
}

function renderLodging(overview) {
  const stays = (overview || []).filter((r) => r.hotel && r.hotel !== '-');
  if (!stays.length) return '';
  return stays
    .map((r) => {
      const note = r.hotelNote
        ? `<p class="lodging-note">${esc(r.hotelNote)}</p>`
        : '';
      return `
    <article class="lodging-card">
      <div class="lodging-icon">${icon('hotel', 'icon')}</div>
      <div class="lodging-body">
        <div class="lodging-meta">
          <span class="lodging-day">D${r.day}</span>
          <span class="lodging-date">${esc(r.date || '')}</span>
        </div>
        <h3>${esc(r.hotel)}</h3>
        ${note}
      </div>
    </article>`;
    })
    .join('');
}

function renderTimelineItem(item) {
  const classes = ['timeline-item'];
  if (item.highlight) classes.push('highlight');
  const iconName = resolveTimelineIcon(item);
  if (iconName) classes.push('timeline-item--icon');

  const timeHtml = item.time ? `<div class="timeline-time">${esc(item.time)}</div>` : '';
  const iconHtml = iconName
    ? `<span class="timeline-icon" aria-hidden="true">${icon(iconName, 'icon')}</span>`
    : '';
  const detailHtml = item.detail ? `<p class="timeline-detail">${esc(item.detail)}</p>` : '';
  const tagLabel = stripTagEmoji(item.tag);
  const tagHtml = tagLabel ? `<span class="timeline-tag">${esc(tagLabel)}</span>` : '';

  return `
    <div class="${classes.join(' ')}">
      ${iconHtml}
      ${timeHtml}
      <div class="timeline-content">
        <h4>${esc(item.place)}</h4>
        <p>${esc(item.desc)}</p>
        ${detailHtml}
        ${tagHtml}
      </div>
    </div>
  `;
}

/** Parse NT$/¥ display strings; ranges use midpoint. */
function parseMoneyAmount(str) {
  if (!str) return 0;
  const nums = [...String(str).matchAll(/[\d,]+/g)]
    .map((m) => parseInt(m[0].replace(/,/g, ''), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (!nums.length) return 0;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[nums.length - 1]) / 2);
}

function renderDay(day, tripId) {
  const tipsHtml = day.tips?.length
    ? `<div class="tips-box">
        <h4>${icon('lightbulb')} 旅遊重點</h4>
        <ul>${day.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>`
    : '';
  const photo = day.photo?.src
    ? photoHtml(
        { ...day.photo, src: tripAssetUrl(tripId, day.photo.src) },
        { className: 'ph--day' }
      )
    : '';
  return `
    <section id="${day.id}" class="section day-section${photo ? ' day-section--photo' : ''}">
      ${photo}
      <div class="day-body">
        <div class="day-header">
          <div class="day-number">${day.number}</div>
          <div class="day-info">
            <span class="day-date">${esc(day.date)}</span>
            <h2>${esc(day.title)}</h2>
          </div>
        </div>
        <div class="timeline">
          ${day.timeline.map(renderTimelineItem).join('')}
        </div>
        ${tipsHtml}
      </div>
    </section>
  `;
}

function renderBudgetHtml(budget) {
  const categories = budget.categories || [];
  const amounts = categories.map((cat) => parseMoneyAmount(cat.subtotal));
  const total = amounts.reduce((sum, n) => sum + n, 0);

  const cards = categories
    .map((cat, i) => {
      const share = total > 0 ? Math.round((amounts[i] / total) * 100) : 0;
      return `
    <div class="budget-card" style="--budget-share: ${share}%">
      <div class="budget-icon">${iconFromEmoji(cat.icon, 'icon icon--lg')}</div>
      <h3>${esc(cat.title)}</h3>
      <div class="budget-share-row">
        <div class="budget-bar" role="presentation" aria-hidden="true">
          <span class="budget-bar-fill"></span>
        </div>
        <span class="budget-share-label">${share}%</span>
      </div>
      <div class="budget-items">
        ${(cat.items || [])
          .map(
            (item) => `
          <div class="budget-item"><span>${esc(item.label)}</span><span>${esc(item.amount)}</span></div>
        `
          )
          .join('')}
      </div>
      <div class="budget-subtotal"><span>小計</span><span>${esc(cat.subtotal)}</span></div>
    </div>
  `;
    })
    .join('');

  const t = budget.total || {};
  const fx = budget.fx;
  const fxNote =
    fx?.month && fx?.jpyToTwd != null
      ? `<p class="budget-fx-note">匯率：${esc(fx.month)} ${esc(fx.basis || '台銀即期賣出月平均')} 1 日圓 = NT$${esc(String(fx.jpyToTwd))}${fx.provisional ? '（暫代）' : ''}</p>`
      : '';
  const summary = `
    <div class="budget-summary">
      <div class="budget-summary-card">
        <div class="total-label">每人</div>
        <div class="total-amount">${esc(t.amount || '')}</div>
      </div>
    </div>
    ${fxNote}`;

  const stack =
    total > 0
      ? `<div class="budget-stack" role="img" aria-label="預算類別比例">
      ${categories
        .map((cat, i) => {
          const share = Math.round((amounts[i] / total) * 100);
          return `<span class="budget-stack-seg" style="flex-grow: ${amounts[i]}" title="${esc(cat.title)} ${share}%"></span>`;
        })
        .join('')}
    </div>
    <ul class="budget-stack-legend">
      ${categories
        .map((cat, i) => {
          const share = Math.round((amounts[i] / total) * 100);
          return `<li><span class="budget-stack-swatch"></span>${esc(cat.title)} ${share}%</li>`;
        })
        .join('')}
    </ul>`
      : '';

  return `
    ${stack}
    <div class="budget-grid">${cards}</div>
    ${summary}`;
}

export function renderHero(meta, days = []) {
  const root = document.getElementById('hero-root');
  if (!root || !meta) return;

  const tripId = meta.slug || '';
  const dayCount = days.length
    ? `<div class="info-item"><span class="info-icon">${icon('sun')}</span><span>${days.length} 天</span></div>`
    : '';
  const ticket = meta.ticketSummary
    ? `<div class="info-item"><span class="info-icon">${icon('ticket')}</span><span>${esc(meta.ticketSummary)}</span></div>`
    : '';

  // Dedicated #highlights section replaces the hero · line when cards/highlights exist.
  const hasHighlightSection = highlightCardsFromMeta(meta).length > 0;

  const cover = meta.cover?.src
    ? photoHtml(
        {
          src: tripAssetUrl(tripId, meta.cover.src),
          alt: meta.cover.alt || meta.title || '',
          credit: meta.cover.credit,
          objectPosition: meta.cover.objectPosition,
        },
        { className: 'ph--hero', eager: true, creditPosition: 'hero', fetchPriority: 'high' }
      )
    : '';
  root.classList.toggle('hero-photo', Boolean(cover));

  const hub = import.meta.env.BASE_URL;
  const back = `<a class="hero-back" href="${hub}" aria-label="返回行程總覽">${icon('arrowLeft', 'icon icon--sm')}<span>返回總覽</span></a>`;

  root.innerHTML = `
    ${cover ? `${cover}<div class="hero-photo-overlay"></div>` : ''}
    ${back}
    <div class="hero-content">
      <span class="hero-badge">${esc(meta.badge || '')}</span>
      <h1>${esc(meta.title || '')}</h1>
      <p class="hero-subtitle">${esc(meta.subtitle || '')}</p>
      <div class="hero-info">
        <div class="info-item"><span class="info-icon">${icon('calendar')}</span><span>${esc(meta.dateRange || '')}</span></div>
        ${dayCount}
        ${ticket}
      </div>
      ${
        hasHighlightSection
          ? ''
          : (meta.highlights || []).filter(Boolean).length
            ? `<p class="hero-highlights">${(meta.highlights || []).map((h) => esc(h)).join(' · ')}</p>`
            : ''
      }
    </div>`;
}

function showSection(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = !visible;
}

export function renderExtras(data) {
  const eventsEl = document.getElementById('events-root');
  const weatherEl = document.getElementById('weather-root');
  const footerEl = document.getElementById('footer-root');

  if (eventsEl && data.events?.length) {
    eventsEl.innerHTML = data.events
      .map(
        (e) => `
      <div class="event-card">
        <h3>${esc(e.region)}</h3>
        <ul>${e.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      </div>
    `
      )
      .join('');
  }

  if (weatherEl && data.weather) {
    const w = data.weather;
    weatherEl.innerHTML = `
      <div class="weather-card">
        <div class="weather-icon">${icon('flower', 'icon icon--lg')}</div>
        <h3>氣溫概況</h3>
        <div class="weather-info">
          <div class="temp-row"><span>${icon('sun')} 白天高溫</span><span class="temp high">${esc(w.temps?.high || '')}</span></div>
          <div class="temp-row"><span>${icon('moon')} 夜晚低溫</span><span class="temp low">${esc(w.temps?.low || '')}</span></div>
        </div>
        <p class="weather-note">${esc(w.note || '')}</p>
      </div>
      <div class="weather-card">
        <div class="weather-icon">${icon('coat', 'icon icon--lg')}</div>
        <h3>穿著建議</h3>
        <ul class="weather-tips">
          ${(w.tips || []).map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}
        </ul>
      </div>`;
  }

  if (footerEl && data.meta?.footerDate) {
    footerEl.innerHTML = `<p class="footer-date">${esc(data.meta.footerDate)}</p>`;
  }
}

export function renderItinerary(data) {
  renderHero(data.meta, data.days || []);

  const tripId = data.meta?.slug || '';
  const ticketsEl = document.getElementById('ticket-grid');
  const overviewEl = document.getElementById('overview-body');
  const daysEl = document.getElementById('days-root');
  const budgetEl = document.getElementById('budget-root');
  const highlightsEl = document.getElementById('highlights-root');
  const routeStripEl = document.getElementById('route-strip');
  const lodgingEl = document.getElementById('lodging-root');

  const highlightHtml = renderHighlights(data.meta);
  if (highlightsEl) highlightsEl.innerHTML = highlightHtml;
  showSection('highlights', Boolean(highlightHtml));

  if (ticketsEl) {
    const tickets = data.tickets || [];
    const overrides = loadTicketStatusOverrides(tripId);
    ticketsEl.innerHTML = renderTickets(tickets, overrides);
    mountTicketStatusControls(ticketsEl, tripId);
  }

  mountOverviewHeader();
  if (overviewEl) overviewEl.innerHTML = renderOverview(data.overview || []);

  const stripHtml = renderRouteStrip(data.overview || [], data.meta);
  if (routeStripEl) routeStripEl.innerHTML = stripHtml;

  const lodgingHtml = renderLodging(data.overview || []);
  if (lodgingEl) lodgingEl.innerHTML = lodgingHtml;
  showSection('lodging', Boolean(lodgingHtml));

  if (daysEl) daysEl.innerHTML = (data.days || []).map((d) => renderDay(d, tripId)).join('');
  if (budgetEl && data.budget) budgetEl.innerHTML = renderBudgetHtml(data.budget);

  renderExtras(data);
}
