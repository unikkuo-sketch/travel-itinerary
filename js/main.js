import itinerary from '../data/itinerary.json';
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

mountNav('index');
renderItinerary(itinerary);
initMap(itinerary.map);
initNavScroll();
initTimelineAnimation();
