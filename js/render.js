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
      <td><span class="day-badge">Day ${r.day}</span></td>
      <td>${esc(r.date)}</td>
      <td>${esc(r.places)}</td>
      <td>${esc(r.hotel)}</td>
      <td><span class="transport-tag${r.transportClass ? ' ' + r.transportClass : ''}">${esc(r.transport)}</span></td>
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
  const tipsHtml = day.tips.length
    ? `<div class="tips-box">
        <h4>💡 旅遊重點</h4>
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
      <div class="budget-icon">${cat.icon}</div>
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

export function renderItinerary(data) {
  const ticketsEl = document.getElementById('ticket-grid');
  const overviewEl = document.getElementById('overview-body');
  const daysEl = document.getElementById('days-root');
  const budgetEl = document.getElementById('budget-root');

  if (ticketsEl) ticketsEl.innerHTML = renderTickets(data.tickets);
  if (overviewEl) overviewEl.innerHTML = renderOverview(data.overview);
  if (daysEl) daysEl.innerHTML = data.days.map(renderDay).join('');
  if (budgetEl) budgetEl.innerHTML = renderBudgetHtml(data.budget);
}
