const INDEX_LINKS = [
  { href: '#tickets', label: '🎫 票券' },
  { href: '#overview', label: '📋 總覽' },
  { href: '#route-map', label: '🗺️ 路線' },
  { href: '#day1', label: 'Day 1' },
  { href: '#day2', label: 'Day 2' },
  { href: '#day3', label: 'Day 3' },
  { href: '#day4', label: 'Day 4' },
  { href: '#day5', label: 'Day 5' },
  { href: '#day6', label: 'Day 6' },
  { href: '#budget', label: '💰 預算' },
  { href: 'shopping.html', label: '🛍️ 購物' },
];

function indexUrl(hash = '') {
  const base = import.meta.env.BASE_URL;
  return `${base}index.html${hash}`;
}

export function mountNav(page = 'index') {
  const container = document.getElementById('nav-container');
  if (!container) return;

  const links = page === 'shopping'
    ? [
        { href: indexUrl(), label: '🏠 首頁' },
        { href: indexUrl('#tickets'), label: '🎫 票券' },
        { href: indexUrl('#overview'), label: '📋 總覽' },
        { href: indexUrl('#day1'), label: 'Day 1' },
        { href: indexUrl('#day2'), label: 'Day 2' },
        { href: indexUrl('#day3'), label: 'Day 3' },
        { href: indexUrl('#day4'), label: 'Day 4' },
        { href: indexUrl('#day5'), label: 'Day 5' },
        { href: indexUrl('#day6'), label: 'Day 6' },
        { active: true, label: '🛍️ 購物' },
      ]
    : INDEX_LINKS.map((l) => ({
        ...l,
        href: l.href.startsWith('#') ? l.href : `${import.meta.env.BASE_URL}${l.href}`,
      }));

  container.innerHTML = links.map((l) => {
    if (l.active) return `<span class="nav-link active">${l.label}</span>`;
    return `<a href="${l.href}" class="nav-link">${l.label}</a>`;
  }).join('');
}

export function initNavScroll() {
  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      if (scrollY >= section.offsetTop - 200) current = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });
}
