import { SITE_ORIGIN } from './site.js';

function ensureMeta(attr, key, content) {
  if (!content) return;
  const sel = attr === 'property' ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let el = document.querySelector(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/** Absolute page URL for the current trip shell (path or legacy query). */
export function tripCanonicalUrl(tripId, page = 'trip') {
  const enc = encodeURIComponent(tripId);
  if (page === 'shopping') return `${SITE_ORIGIN}/shopping.html?trip=${enc}`;
  if (page === 'stories') return `${SITE_ORIGIN}/trips/${enc}/stories.html`;
  if (page === 'food') return `${SITE_ORIGIN}/trips/${enc}/food.html`;
  return `${SITE_ORIGIN}/trips/${enc}/`;
}

/**
 * Sync document title, description, canonical, and Open Graph / Twitter tags.
 * Helps JS-capable crawlers; build prerender covers non-JS / social crawlers.
 */
export function applyPageMeta({
  title,
  description,
  url,
  image,
  siteName = '宇宙碎片集散地',
}) {
  if (title) document.title = title;
  if (description) ensureMeta('name', 'description', description);
  if (url) {
    ensureCanonical(url);
    ensureMeta('property', 'og:url', url);
  }
  if (title) {
    ensureMeta('property', 'og:title', title);
    ensureMeta('name', 'twitter:title', title);
  }
  if (description) {
    ensureMeta('property', 'og:description', description);
    ensureMeta('name', 'twitter:description', description);
  }
  if (image) {
    ensureMeta('property', 'og:image', image);
    ensureMeta('name', 'twitter:image', image);
  }
  ensureMeta('property', 'og:site_name', siteName);
  ensureMeta('property', 'og:type', 'website');
  ensureMeta('name', 'twitter:card', 'summary_large_image');
}

export function tripOgImage(tripId, coverSrc) {
  if (coverSrc && !/^https?:\/\//.test(coverSrc)) {
    return `${SITE_ORIGIN}/trips/${encodeURIComponent(tripId)}/${coverSrc}`;
  }
  if (coverSrc) return coverSrc;
  return `${SITE_ORIGIN}/images/hub-hero.webp`;
}
