import { tripUrl } from './load-trip.js';
import { icon } from './icons.js';

function linkHtml(l) {
  if (l.active) return `<span class="nav-link active">${l.label}</span>`;
  return `<a href="${l.href}" class="nav-link">${l.label}</a>`;
}

function dayLinks(tripId, days) {
  return (days || []).map((day) => ({
    href: `${tripUrl(tripId)}#${day.id}`,
    label: `Day ${day.number}`,
    dayId: day.id,
  }));
}

function sectionModels(tripId) {
  return [
    { href: `${tripUrl(tripId)}#overview`, label: '行程' },
    { href: `${tripUrl(tripId)}#highlights`, label: '亮點' },
    { href: `${tripUrl(tripId)}#tickets`, label: '票券' },
    { href: `${tripUrl(tripId)}#lodging`, label: '住宿' },
    { href: `${tripUrl(tripId)}#route-map`, label: '路線' },
    { href: `${tripUrl(tripId)}#budget`, label: '預算' },
    { href: tripUrl(tripId, 'stories'), label: '風土' },
    { href: tripUrl(tripId, 'food'), label: '飲食' },
    { href: tripUrl(tripId, 'shopping'), label: '購物' },
  ];
}

/** Same visibility as renderItinerary: highlights/lodging follow the data; the shell always shows the rest. */
export function sectionIsVisible(data, id) {
  const meta = data?.meta || {};
  if (id === 'highlights') {
    if (meta.highlightCards?.length) return true;
    return (meta.highlights || []).some(Boolean);
  }
  if (id === 'lodging') {
    return (data?.overview || []).some((r) => r.hotel && r.hotel !== '-');
  }
  return id === 'overview' || id === 'tickets' || id === 'route-map' || id === 'budget';
}

function buildTripSectionLinks(tripId, isVisible) {
  return sectionModels(tripId).filter((l) => {
    const hash = l.href.includes('#') ? l.href.slice(l.href.indexOf('#') + 1) : '';
    if (!hash) return true;
    return isVisible(hash);
  });
}

export function navSectionAnchorsHtml(tripId, isVisible) {
  return buildTripSectionLinks(tripId, isVisible).map(linkHtml).join('');
}

export function navDayAnchorsHtml(tripId, days) {
  return dayLinks(tripId, days)
    .map(
      (l) =>
        `<a href="${l.href}" class="nav-link nav-link--day" data-day="${l.dayId}">${l.label}</a>`
    )
    .join('');
}

export function heroBackAnchorHtml(href, label) {
  return `<a class="hero-back" href="${href}" aria-label="${label}">${icon('arrowLeft', 'icon icon--sm')}<span>${label}</span></a>`;
}

function ensureNavShell(container) {
  const nav = container.closest('.nav-sticky');
  if (!nav) return { sectionsEl: container, daysEl: null };

  let shell = nav.querySelector('.nav-shell');
  if (!shell) {
    shell = document.createElement('div');
    shell.className = 'nav-shell';
    container.replaceWith(shell);
    container.id = 'nav-container';
    container.classList.add('nav-row', 'nav-row--sections');
    shell.appendChild(container);

    const daysEl = document.createElement('div');
    daysEl.id = 'nav-days';
    daysEl.className = 'nav-row nav-row--days';
    daysEl.hidden = true;
    shell.appendChild(daysEl);
  }

  const sectionsEl = shell.querySelector('#nav-container') || container;
  const daysEl = shell.querySelector('#nav-days');
  return { sectionsEl, daysEl, shell };
}

export function mountNav(tripId, days = []) {
  const container = document.getElementById('nav-container');
  if (!container) return;

  const { sectionsEl, daysEl } = ensureNavShell(container);

  const isVisible = (id) => {
    const el = document.getElementById(id);
    return Boolean(el && !el.hidden);
  };
  sectionsEl.innerHTML = navSectionAnchorsHtml(tripId, isVisible);

  if (daysEl) {
    const html = navDayAnchorsHtml(tripId, days);
    if (html) {
      daysEl.hidden = false;
      daysEl.innerHTML = html;
    } else {
      daysEl.hidden = true;
      daysEl.innerHTML = '';
    }
  }
}

export function initNavScroll() {
  document.querySelectorAll('.nav-link[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const hash = href?.includes('#') ? href.slice(href.indexOf('#')) : '';
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const sectionLinks = document.querySelectorAll(
    '.nav-row--sections .nav-link[href*="#"]'
  );
  const dayLinkEls = [...document.querySelectorAll('.nav-link--day')];
  const daysRow = document.getElementById('nav-days');
  // only non-day sections for top-row spy (day-* also have .section)
  const sections = [...document.querySelectorAll('.section[id]:not(.day-section)')].filter(
    (el) => !el.hidden
  );
  const daySections = document.querySelectorAll('.day-section[id]');
  const offset = 220;
  let activeDay = '';
  let ticking = false;

  function syncActiveDay(currentDay) {
    if (currentDay === activeDay) return;
    activeDay = currentDay;
    let activeEl = null;
    dayLinkEls.forEach((link) => {
      const on = (link.getAttribute('data-day') || '') === currentDay;
      link.classList.toggle('active', on);
      if (on) activeEl = link;
    });
    // keep the active Day chip in view when the row overflows
    if (activeEl && daysRow) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }

  function onScroll() {
    let currentSection = '';
    sections.forEach((section) => {
      if (scrollY >= section.offsetTop - offset) currentSection = section.id;
    });
    sectionLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
      link.classList.toggle('active', hash === `#${currentSection}`);
    });

    let currentDay = '';
    daySections.forEach((section) => {
      if (scrollY >= section.offsetTop - offset) currentDay = section.id;
    });
    syncActiveDay(currentDay);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );

  onScroll();
}
