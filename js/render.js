import { icon, iconFromEmoji } from './icons.js';

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
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
      <td><span class="day-badge">${r.day}</span></td>
      <td>${esc(r.date)}</td>
      <td>${esc(r.places)}</td>
      <td>${esc(r.hotel)}</td>
      <td><span class="transport-tag${r.transportClass ? ` ${r.transportClass}` : ''}">${esc(r.transport)}</span></td>
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

function renderDay(day) {
  const tipsHtml = day.tips?.length
    ? `<div class="tips-box">
        <h4>${icon('lightbulb')} 旅遊重點</h4>
        <ul>${day.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>`
    : '';
  return `
    <section id="${day.id}" class="section day-section">
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

export function renderHero(meta) {
  const root = document.getElementById('hero-root');
  if (!root || !meta) return;

  const highlights = (meta.highlights || [])
    .map((h) => `<div class="info-item"><span class="info-icon">${icon('sparkle')}</span><span>${esc(h)}</span></div>`)
    .join('');

  root.innerHTML = `
    <div class="hero-content">
      <span class="hero-badge">${esc(meta.badge || '')}</span>
      <h1>${esc(meta.title || '')}</h1>
      <p class="hero-subtitle">${esc(meta.subtitle || '')}</p>
      <div class="hero-info">
        <div class="info-item"><span class="info-icon">${icon('calendar')}</span><span>${esc(meta.dateRange || '')}</span></div>
        <div class="info-item"><span class="info-icon">${icon('ticket')}</span><span>${esc(meta.ticketSummary || '')}</span></div>
        ${highlights}
      </div>
    </div>
    <div class="scroll-indicator"><span>向下滑動</span><div class="scroll-arrow"></div></div>`;
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
  renderHero(data.meta);

  const ticketsEl = document.getElementById('ticket-grid');
  const overviewEl = document.getElementById('overview-body');
  const daysEl = document.getElementById('days-root');
  const budgetEl = document.getElementById('budget-root');

  if (ticketsEl) ticketsEl.innerHTML = renderTickets(data.tickets || []);
  if (overviewEl) overviewEl.innerHTML = renderOverview(data.overview || []);
  if (daysEl) daysEl.innerHTML = (data.days || []).map(renderDay).join('');
  if (budgetEl && data.budget) budgetEl.innerHTML = renderBudgetHtml(data.budget);

  renderExtras(data);
}
