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
 * photo: { src, alt, credit, objectPosition?, objectFit? } — src must already be a full URL.
 * objectFit: omit／cover 維持裁切；contain 縮小整圖入鏡（酒瓶等直式特寫）。
 */
export function photoHtml(photo, { className = '', eager = false, creditPosition = 'br', fetchPriority } = {}) {
  if (!photo?.src) return '';
  const credit = photo.credit
    ? `<span class="ph-credit ph-credit--${creditPosition}">${esc(photo.credit)}</span>`
    : '';
  const fp = fetchPriority ? ` fetchpriority="${esc(fetchPriority)}"` : '';
  const fitContain = photo.objectFit === 'contain';
  const styles = [];
  if (photo.objectPosition) styles.push(`object-position: ${esc(photo.objectPosition)}`);
  if (fitContain) styles.push('object-fit: contain');
  const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
  const containClass = fitContain ? ' ph--contain' : '';
  return `
    <figure class="ph ${className}${containClass}">
      <img
        class="ph-img"
        src="${esc(photo.src)}"
        alt="${esc(photo.alt || '')}"
        loading="${eager ? 'eager' : 'lazy'}"
        decoding="async"${fp}${styleAttr}
        onload="this.closest('.ph').classList.add('ph--loaded')"
        onerror="this.closest('.ph').classList.add('ph--error')"
      >
      ${credit}
    </figure>
  `;
}
