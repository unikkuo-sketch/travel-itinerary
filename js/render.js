import { icon, iconFromEmoji } from './icons.js';
import { photoHtml, tripAssetUrl } from './photo.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function parseMonthDay(dateStr) {
  const m = dateStr?.match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return { mo: parseInt(m[1], 10), d: parseInt(m[2], 10) };
}

/** Find the day whose date matches today (for the 「今天」 quick link). */
function findTodayDay(days, badge) {
  const yearMatch = badge?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  const now = new Date();
  for (const day of days || []) {
    const md = parseMonthDay(day.date);
    if (!md) continue;
    let y = year;
    // handle trips crossing new year (e.g. 12/30 - 01/02)
    if (days[0]) {
      const first = parseMonthDay(days[0].date);
      if (first && md.mo < first.mo) y = year + 1;
    }
    const d = new Date(y, md.mo - 1, md.d);
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) return day;
  }
  return null;
}

function renderTickets(tickets) {
  return tickets.map((t) => `
    <div class="ticket-card ${t.variant}">
      <div class="ticket-header">
        <h3>${esc(t.title)}</h3><span class="ticket-badge">${esc(t.badge)}</span>
      </div>
      <div class="ticket-price">${esc(t.price)}<span>${esc(t.priceSuffix)}</span></div>
      <div class="ticket-meta"><span>${esc(t.meta)}</span></div>
      <ul class="ticket-features">
        ${t.features.map((f) => `<li>${esc(f)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

function renderOverview(rows) {
  return rows.map((r) => `
    <tr>
      <td data-label="天數"><span class="day-badge">${r.day}</span></td>
      <td data-label="日期">${esc(r.date)}</td>
      <td data-label="主要地點">${esc(r.places)}</td>
      <td data-label="住宿">${esc(r.hotel)}</td>
      <td data-label="交通重點"><span class="transport-tag${r.transportClass ? ` ${r.transportClass}` : ''}">${esc(r.transport)}</span></td>
    </tr>
  `).join('');
}

function renderTimelineItem(item) {
  const classes = ['timeline-item'];
  if (item.highlight) classes.push('highlight');
  const timeHtml = item.time ? `<div class="timeline-time">${esc(item.time)}</div>` : '';
  const tagHtml = item.tag ? `<span class="timeline-tag">${esc(item.tag)}</span>` : '';
  return `
    <div class="${classes.join(' ')}">
      ${timeHtml}
      <div class="timeline-content">
        <h4>${esc(item.place)}</h4>
        <p>${esc(item.desc)}</p>${tagHtml}
      </div>
    </div>
  `;
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
  const cards = budget.categories.map((cat) => `
    <div class="budget-card">
      <div class="budget-icon">${iconFromEmoji(cat.icon, 'icon icon--lg')}</div>
      <h3>${esc(cat.title)}</h3>
      <div class="budget-items">
        ${cat.items.map((i) => `
          <div class="budget-item"><span>${esc(i.label)}</span><span>${esc(i.amount)}</span></div>
        `).join('')}
      </div>
      <div class="budget-subtotal"><span>小計</span><span>${esc(cat.subtotal)}</span></div>
    </div>
  `).join('');
  return `
    <div class="budget-grid">${cards}</div>
    <div class="budget-total">
      <div class="total-label">總預算</div>
      <div class="total-amount">${esc(budget.total.amount)}</div>
      <div class="total-twd">${esc(budget.total.twd)}</div>
    </div>`;
}

export function renderHero(meta, days = []) {
  const root = document.getElementById('hero-root');
  if (!root || !meta) return;

  const tripId = meta.slug || '';
  const highlights = (meta.highlights || [])
    .map((h) => `<div class="info-item"><span class="info-icon">${icon('sparkle')}</span><span>${esc(h)}</span></div>`)
    .join('');
  const dayCount = days.length ? `<div class="info-item"><span class="info-icon">${icon('sun')}</span><span>${days.length} 天</span></div>` : '';

  const cover = meta.cover?.src
    ? {
        img: `
          <img class="hero-photo-img" src="${esc(tripAssetUrl(tripId, meta.cover.src))}" alt="${esc(meta.cover.alt || meta.title || '')}" fetchpriority="high" decoding="async">
          <div class="hero-photo-overlay"></div>`,
        credit: meta.cover.credit
          ? `<span class="ph-credit ph-credit--hero">${esc(meta.cover.credit)}</span>`
          : '',
      }
    : null;
  root.classList.toggle('hero-photo', Boolean(cover));

  const today = findTodayDay(days, meta.badge);
  const quickLinks = [
    today ? { href: `#${today.id}`, label: `今天 · Day ${today.number}`, icon: 'sparkle', primary: true } : null,
    { href: '#overview', label: '行程', icon: 'list' },
    { href: '#tickets', label: '票券', icon: 'ticket' },
    { href: '#budget', label: '預算', icon: 'budget' },
  ].filter(Boolean);
  const quickHtml = quickLinks
    .map((l) => `<a class="hero-quick-link${l.primary ? ' hero-quick-link--primary' : ''}" href="${l.href}">${icon(l.icon)}<span>${esc(l.label)}</span></a>`)
    .join('');

  root.innerHTML = `
    ${cover ? cover.img : ''}
    <div class="hero-content">
      <span class="hero-badge">${esc(meta.badge || '')}</span>
      <h1>${esc(meta.title || '')}</h1>
      <p class="hero-subtitle">${esc(meta.subtitle || '')}</p>
      <div class="hero-info">
        <div class="info-item"><span class="info-icon">${icon('calendar')}</span><span>${esc(meta.dateRange || '')}</span></div>
        ${dayCount}
        <div class="info-item"><span class="info-icon">${icon('ticket')}</span><span>${esc(meta.ticketSummary || '')}</span></div>
        ${highlights}
      </div>
      <div class="hero-quick">${quickHtml}</div>
    </div>
    ${cover ? cover.credit : ''}`;
}

export function renderExtras(data) {
  const eventsEl = document.getElementById('events-root');
  const weatherEl = document.getElementById('weather-root');
  const footerEl = document.getElementById('footer-root');

  if (eventsEl && data.events?.length) {
    eventsEl.innerHTML = data.events.map((e) => `
      <div class="event-card">
        <h3>${esc(e.region)}</h3>
        <ul>${e.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      </div>
    `).join('');
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

  if (ticketsEl) ticketsEl.innerHTML = renderTickets(data.tickets || []);
  if (overviewEl) overviewEl.innerHTML = renderOverview(data.overview || []);
  if (daysEl) daysEl.innerHTML = (data.days || []).map((d) => renderDay(d, tripId)).join('');
  if (budgetEl && data.budget) budgetEl.innerHTML = renderBudgetHtml(data.budget);

  renderExtras(data);
}
