import { SITE_ORIGIN } from './site.js';

/**
 * Resolve document title + meta description for a trip shell page.
 * Optional overrides live on `meta.seo` (trip index) / `meta.seo.stories` / `meta.seo.food`.
 * Falls back to the historical generated strings so trips without seo stay unchanged.
 */
export function tripPageMeta(meta = {}, page = 'trip') {
  const seo = meta.seo || {};
  const title = meta.title || '';

  if (page === 'stories') {
    const pageSeo = seo.stories || {};
    return {
      title: pageSeo.title || `風土 | ${title}`,
      description:
        pageSeo.description ||
        (meta.subtitle
          ? `${meta.subtitle}——風土筆記`
          : `這趟旅程裡，值得收下的景點、歷史與文化——${title}`),
    };
  }

  if (page === 'food') {
    const pageSeo = seo.food || {};
    return {
      title: pageSeo.title || `飲食 | ${title}`,
      description:
        pageSeo.description ||
        (meta.subtitle
          ? `${meta.subtitle}——飲食筆記`
          : `這趟旅程裡，值得嚐一口的食物與酒——${title}`),
    };
  }

  return {
    title: seo.title || `${title} | ${meta.badge || '宇宙碎片集散地'}`,
    description: seo.description || meta.subtitle || title || '',
  };
}

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
