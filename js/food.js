import { getTripId, loadTrip, tripUrl } from './load-trip.js';
import { icon } from './icons.js';
import { photoHtml, tripAssetUrl } from './photo.js';

const root = document.getElementById('food-root');
const heroTitle = document.getElementById('food-trip-title');
const heroEl = document.querySelector('.hero-stories');

const THEME_LABEL = { food: '食物', sake: '酒' };

function mountHeroBack(tripId) {
  if (!heroEl || heroEl.querySelector('.hero-back')) return;
  const back = document.createElement('a');
  back.className = 'hero-back';
  back.href = tripUrl(tripId);
  back.setAttribute('aria-label', '返回行程');
  back.innerHTML = `${icon('arrowLeft', 'icon icon--sm')}<span>返回行程</span>`;
  heroEl.prepend(back);
}

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text ?? '';
  return el.innerHTML;
}

function showError(message) {
  document.body.innerHTML = `
    <main class="main-content" style="padding:4rem 1rem;text-align:center">
      <h1>找不到行程</h1>
      <p>${esc(message)}</p>
      <p><a href="${import.meta.env.BASE_URL}">返回行程總覽</a></p>
    </main>`;
}

function renderEmpty(tripId) {
  root.innerHTML = `
    <div class="stories-empty">
      <p class="stories-empty-title">這趟旅程尚未收藏飲食筆記</p>
      <p class="stories-empty-desc">當地的食物與酒，會在啟程之後慢慢補上。</p>
      <a class="btn-hero" href="${tripUrl(tripId)}">返回行程</a>
    </div>`;
}

function renderChapter(item, index, tripId) {
  const n = String(index + 1).padStart(2, '0');
  const theme = THEME_LABEL[item.theme] || '';
  const photo = item.photo
    ? {
        src: tripAssetUrl(tripId, item.photo.src),
        alt: item.photo.alt || item.title || '',
        credit: item.photo.credit || '',
      }
    : null;
  const media = photo
    ? photoHtml(photo, {
        className: 'ph--story',
        eager: index === 0,
        creditPosition: 'br',
        fetchPriority: index === 0 ? 'high' : undefined,
      })
    : '<div class="story-chapter-fallback" aria-hidden="true"></div>';
  const source =
    item.source?.url && item.source?.label
      ? `<a class="story-chapter-source" href="${esc(item.source.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source.label)}</a>`
      : '';

  return `
    <section class="story-chapter">
      ${media}
      <div class="story-chapter-scrim" aria-hidden="true"></div>
      <div class="story-chapter-copy">
        <div class="story-chapter-meta">
          <span class="story-chapter-index" aria-hidden="true">${n}</span>
          ${theme ? `<span class="story-chapter-theme">${esc(theme)}</span>` : ''}
          ${item.kicker ? `<span class="story-chapter-kicker">${esc(item.kicker)}</span>` : ''}
        </div>
        <h2 class="story-chapter-title">${esc(item.title || '')}</h2>
        <p class="story-chapter-body">${esc(item.body || '')}</p>
        ${source}
      </div>
    </section>`;
}

function initReveal() {
  const chapters = root.querySelectorAll('.story-chapter');
  if (!chapters.length) return;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    chapters.forEach((el) => el.classList.add('story-chapter--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('story-chapter--visible');
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );

  chapters.forEach((el) => observer.observe(el));
}

async function init() {
  const tripId = getTripId();
  if (!tripId) {
    window.location.replace(import.meta.env.BASE_URL);
    return;
  }

  try {
    const data = await loadTrip(tripId);
    if (data.meta?.theme) document.body.classList.add(`theme-${data.meta.theme}`);
    document.title = `飲食 | ${data.meta?.title || ''}`;
    if (heroTitle) {
      heroTitle.textContent = data.meta?.title
        ? `${data.meta.title} · 飲食`
        : '飲食';
    }

    mountHeroBack(tripId);

    const foods = data.foods || [];
    if (!foods.length) {
      renderEmpty(tripId);
      return;
    }

    root.innerHTML = foods.map((s, i) => renderChapter(s, i, tripId)).join('');
    initReveal();
  } catch (err) {
    showError(err.message);
  }
}

init();
