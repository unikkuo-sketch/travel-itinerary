import { getTripId, loadTrip, tripUrl } from './load-trip.js';
import { renderItinerary } from './render.js';
import { mountNav, initNavScroll } from './nav.js';
import { initMap } from './map.js';

function initTimelineAnimation() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((item) => observer.observe(item));
}

function showError(message) {
  document.body.innerHTML = `
    <main class="main-content" style="padding:4rem 1rem;text-align:center">
      <h1>找不到行程</h1>
      <p>${message}</p>
      <p><a href="${import.meta.env.BASE_URL}">返回行程總覽</a></p>
    </main>`;
}

async function init() {
  const tripId = getTripId();
  if (!tripId) {
    window.location.replace(import.meta.env.BASE_URL);
    return;
  }

  try {
    const data = await loadTrip(tripId);
    const { meta } = data;

    document.title = `${meta.title} | ${meta.badge || ''}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = meta.subtitle || meta.title;

    mountNav('trip', tripId, data.days);
    renderItinerary(data);
    initMap(data.map);
    initNavScroll();
    initTimelineAnimation();
  } catch (err) {
    showError(err.message);
  }
}

init();
