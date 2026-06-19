import { tripUrl } from './load-trip.js';

const base = import.meta.env.BASE_URL;

function hubUrl() {
  return base;
}

function buildTripNavLinks(tripId, days) {
  const links = [
    { href: hubUrl(), label: '🏠 總覽' },
    { href: `${tripUrl(tripId)}#tickets`, label: '🎫 票券' },
    { href: `${tripUrl(tripId)}#overview`, label: '📋 總覽' },
    { href: `${tripUrl(tripId)}#route-map`, label: '🗺️ 路線' },
  ];

  (days || []).forEach((day) => {
    links.push({
      href: `${tripUrl(tripId)}#${day.id}`,
      label: `Day ${day.number}`,
    });
  });

  links.push(
    { href: `${tripUrl(tripId)}#budget`, label: '💰 預算' },
    { href: tripUrl(tripId, 'shopping'), label: '🛍️ 購物' }
  );

  return links;
}

function buildShoppingNavLinks(tripId, days) {
  const links = [
    { href: hubUrl(), label: '🏠 總覽' },
    { href: `${tripUrl(tripId)}#tickets`, label: '🎫 票券' },
    { href: `${tripUrl(tripId)}#overview`, label: '📋 總覽' },
  ];

  (days || []).forEach((day) => {
    links.push({
      href: `${tripUrl(tripId)}#${day.id}`,
      label: `Day ${day.number}`,
    });
  });

  links.push({ active: true, label: '🛍️ 購物' });
  return links;
}

export function mountNav(page, tripId, days = []) {
  const container = document.getElementById('nav-container');
  if (!container) return;

  const links = page === 'shopping'
    ? buildShoppingNavLinks(tripId, days)
    : buildTripNavLinks(tripId, days);

  container.innerHTML = links.map((l) => {
    if (l.active) return `<span class="nav-link active">${l.label}</span>`;
    return `<a href="${l.href}" class="nav-link">${l.label}</a>`;
  }).join('');
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

  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href*="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      if (scrollY >= section.offsetTop - 200) current = section.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
      link.classList.toggle('active', hash === `#${current}`);
    });
  });
}
