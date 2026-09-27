import { getTripId, loadTrip, tripUrl } from './load-trip.js';
import { icon } from './icons.js';
import { esc, initPhotoLightbox, photoHtml, tripAssetUrl } from './photo.js';
import { applyPageMeta, tripCanonicalUrl, tripOgImage, tripPageMeta } from './seo.js';

const root = document.getElementById('food-root');
const heroTitle = document.getElementById('food-trip-title');
const heroEl = document.querySelector('.hero-stories');

const THEME_LABEL = { food: '食物', sake: '酒' };
const RELATED_MAX = 3;

function mountHeroBack(tripId) {
  if (!heroEl || heroEl.querySelector('.hero-back')) return;
  const back = document.createElement('a');
  back.className = 'hero-back';
  back.href = tripUrl(tripId);
  back.setAttribute('aria-label', '返回行程');
  back.innerHTML = `${icon('arrowLeft', 'icon icon--sm')}<span>返回行程</span>`;
  heroEl.prepend(back);
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

function resolvePhoto(photo, tripId, title) {
  if (!photo?.src) return null;
  return {
    src: tripAssetUrl(tripId, photo.src),
    alt: photo.alt || title || '',
    credit: photo.credit || '',
    objectPosition: photo.objectPosition,
    objectFit: photo.objectFit,
    aspectRatio: photo.aspectRatio,
  };
}

function metaHtml(item, index) {
  const n = String(index + 1).padStart(2, '0');
  const theme = THEME_LABEL[item.theme] || '';
  return `
    <div class="story-chapter-meta">
      <span class="story-chapter-index" aria-hidden="true">${n}</span>
      ${theme ? `<span class="story-chapter-theme">${esc(theme)}</span>` : ''}
      ${item.kicker ? `<span class="story-chapter-kicker">${esc(item.kicker)}</span>` : ''}
    </div>`;
}

function sourceHtml(item) {
  if (!(item.source?.url && item.source?.label)) return '';
  return `<a class="story-chapter-source" href="${esc(item.source.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source.label)}</a>`;
}

/** Immersive full-bleed chapter (default when no relatedPhotos / reflection). */
function renderImmersiveChapter(item, index, tripId) {
  const photo = resolvePhoto(item.photo, tripId, item.title);
  const media = photo
    ? photoHtml(photo, {
        className: 'ph--story',
        eager: index === 0,
        creditPosition: 'br',
        fetchPriority: index === 0 ? 'high' : undefined,
      })
    : '<div class="story-chapter-fallback" aria-hidden="true"></div>';

  return `
    <section class="story-chapter">
      ${media}
      <div class="story-chapter-scrim" aria-hidden="true"></div>
      <div class="story-chapter-copy">
        ${metaHtml(item, index)}
        <h2 class="story-chapter-title">${esc(item.title || '')}</h2>
        <p class="story-chapter-body">${esc(item.body || '')}</p>
        ${sourceHtml(item)}
      </div>
    </section>`;
}

function relatedGridHtml(item, index, tripId, zoomGroup) {
  const related = (Array.isArray(item.relatedPhotos) ? item.relatedPhotos : [])
    .slice(0, RELATED_MAX)
    .map((p) => resolvePhoto(p, tripId, item.title))
    .filter(Boolean);
  if (!related.length) return '';

  // Related cards start after main (index 0) in the same lightbox group.
  const cards = related
    .map((p, i) =>
      photoHtml(p, {
        className: 'ph--story-related',
        eager: false,
        creditPosition: 'br',
        zoomable: { group: zoomGroup, index: i + 1 },
      })
    )
    .join('');

  const countClass =
    related.length === 1
      ? 'story-related-grid--1'
      : related.length === 2
        ? 'story-related-grid--2'
        : 'story-related-grid--3';

  return `<div class="story-related-grid ${countClass}" role="list" aria-label="相關照片">${cards}</div>`;
}

/** Essay layout: meta → title → hero → reflection? → related grid → body → source. */
function renderEssayChapter(item, index, tripId) {
  const zoomGroup = `food-${index}`;
  const photo = resolvePhoto(item.photo, tripId, item.title);
  const hero = photo
    ? photoHtml(photo, {
        className: 'ph--story-hero',
        eager: index === 0,
        creditPosition: 'br',
        fetchPriority: index === 0 ? 'high' : undefined,
        zoomable: { group: zoomGroup, index: 0 },
      })
    : '';
  const reflection = item.reflection
    ? `<blockquote class="story-chapter-reflection">${esc(item.reflection)}</blockquote>`
    : '';

  return `
    <section class="story-chapter story-chapter--essay">
      <div class="story-chapter-essay">
        ${metaHtml(item, index)}
        <h2 class="story-chapter-title">${esc(item.title || '')}</h2>
        ${hero}
        ${reflection}
        ${relatedGridHtml(item, index, tripId, zoomGroup)}
        <p class="story-chapter-body">${esc(item.body || '')}</p>
        ${sourceHtml(item)}
      </div>
    </section>`;
}

function hasEssayLayout(item) {
  if (item.reflection) return true;
  const related = Array.isArray(item.relatedPhotos) ? item.relatedPhotos : [];
  return related.length > 0;
}

function renderChapter(item, index, tripId) {
  if (hasEssayLayout(item)) return renderEssayChapter(item, index, tripId);
  return renderImmersiveChapter(item, index, tripId);
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
    const pageMeta = tripPageMeta(data.meta, 'food');
    applyPageMeta({
      title: pageMeta.title,
      description: pageMeta.description,
      url: tripCanonicalUrl(tripId, 'food'),
      image: tripOgImage(tripId, data.meta?.cover?.src),
    });
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
    initPhotoLightbox();
  } catch (err) {
    showError(err.message);
  }
}

init();
