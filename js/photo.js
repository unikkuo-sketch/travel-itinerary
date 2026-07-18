const base = import.meta.env.BASE_URL;

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text ?? '';
  return el.innerHTML;
}

/** Resolve a path relative to trips/{tripId}/ into a fetchable URL. */
export function tripAssetUrl(tripId, rel) {
  if (!rel) return '';
  if (/^https?:\/\//.test(rel)) return rel;
  return `${base}trips/${encodeURIComponent(tripId)}/${rel}`;
}

/**
 * Shared photo block: lazy loading, skeleton shimmer, fade-in,
 * graceful fallback and photographer credit overlay.
 *
 * photo: { src, alt, credit } — src must already be a full URL.
 */
export function photoHtml(photo, { className = '', eager = false, creditPosition = 'br' } = {}) {
  if (!photo?.src) return '';
  const credit = photo.credit
    ? `<span class="ph-credit ph-credit--${creditPosition}">${esc(photo.credit)}</span>`
    : '';
  return `
    <figure class="ph ${className}">
      <img
        class="ph-img"
        src="${esc(photo.src)}"
        alt="${esc(photo.alt || '')}"
        loading="${eager ? 'eager' : 'lazy'}"
        decoding="async"
        onload="this.closest('.ph').classList.add('ph--loaded')"
        onerror="this.closest('.ph').classList.add('ph--error')"
      >
      ${credit}
    </figure>
  `;
}
