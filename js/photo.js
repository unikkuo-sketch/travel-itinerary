// ponytail: Vite inlines BASE_URL; Node `npm run check` sees import.meta.env as undefined
const base = typeof import.meta.env === 'undefined' ? '/' : import.meta.env.BASE_URL;

export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
 * photo: { src, alt, credit, fullSrc?, objectPosition?, objectFit?, aspectRatio? } — src must already be a full URL.
 * objectFit: omit／cover 維持裁切；contain 縮小整圖入鏡（酒瓶等直式特寫）。
 * aspectRatio: CSS 值（如 `3 / 4`），覆寫版面預設橫幅，讓直式主體完整入鏡。
 * zoomable: false | { group, index } — wrap in .ph-zoom-trigger for lodging lightbox (Phase 1.1).
 */
export function photoHtml(photo, { className = '', eager = false, creditPosition = 'br', fetchPriority, zoomable = false } = {}) {
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
  const figStyles = [];
  if (photo.aspectRatio) figStyles.push(`aspect-ratio: ${esc(photo.aspectRatio)}`);
  const figStyleAttr = figStyles.length ? ` style="${figStyles.join('; ')}"` : '';
  const extraClass = [fitContain ? 'ph--contain' : '', photo.aspectRatio ? 'ph--custom-ratio' : '']
    .filter(Boolean)
    .join(' ');
  const figure = `
    <figure class="ph ${className}${extraClass ? ` ${extraClass}` : ''}"${figStyleAttr}>
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

  if (!zoomable || typeof zoomable !== 'object' || zoomable.group == null || zoomable.index == null) {
    return figure;
  }

  const alt = photo.alt || '';
  const fullSrc = photo.fullSrc || photo.src;
  return `<button type="button" class="ph-zoom-trigger" aria-haspopup="dialog" aria-label="放大檢視：${esc(alt)}" data-ph-group="${esc(String(zoomable.group))}" data-ph-index="${esc(String(zoomable.index))}" data-ph-src="${esc(photo.src)}" data-ph-full-src="${esc(fullSrc)}" data-ph-alt="${esc(alt)}" data-ph-credit="${esc(photo.credit || '')}">${figure}</button>`;
}

const LIGHTBOX_HTML = `
<dialog class="ph-lightbox" aria-label="照片">
  <button type="button" class="ph-lightbox__close" aria-label="關閉">×</button>
  <button type="button" class="ph-lightbox__prev" aria-label="上一張">‹</button>
  <img class="ph-lightbox__img" alt="">
  <button type="button" class="ph-lightbox__next" aria-label="下一張">›</button>
  <p class="ph-lightbox__credit"></p>
</dialog>
`;

let lightboxBound = false;
let lightboxState = {
  items: [],
  index: 0,
  trigger: null,
};

function ensureLightbox() {
  let dialog = document.querySelector('dialog.ph-lightbox');
  if (dialog) return dialog;
  document.body.insertAdjacentHTML('beforeend', LIGHTBOX_HTML);
  return document.querySelector('dialog.ph-lightbox');
}

function collectGroup(group) {
  const selector = `.ph-zoom-trigger[data-ph-group="${CSS.escape(String(group))}"]`;
  return [...document.querySelectorAll(selector)]
    .filter((btn) => btn.dataset.phSrc || btn.dataset.phFullSrc)
    .sort((a, b) => Number(a.dataset.phIndex) - Number(b.dataset.phIndex))
    .map((btn) => ({
      src: btn.dataset.phFullSrc || btn.dataset.phSrc,
      alt: btn.dataset.phAlt || '',
      credit: btn.dataset.phCredit || '',
      trigger: btn,
    }));
}

function renderLightboxSlide(dialog) {
  const { items, index } = lightboxState;
  const item = items[index];
  if (!item) return;

  const img = dialog.querySelector('.ph-lightbox__img');
  const credit = dialog.querySelector('.ph-lightbox__credit');
  const prev = dialog.querySelector('.ph-lightbox__prev');
  const next = dialog.querySelector('.ph-lightbox__next');

  img.src = item.src;
  img.alt = item.alt;
  credit.textContent = item.credit || '';
  credit.hidden = !item.credit;

  const multi = items.length > 1;
  prev.hidden = !multi;
  next.hidden = !multi;
  prev.disabled = !multi;
  next.disabled = !multi;
}

function openLightbox(trigger) {
  const src = trigger.dataset.phFullSrc || trigger.dataset.phSrc;
  if (!src) return;

  const dialog = ensureLightbox();
  const group = trigger.dataset.phGroup;
  const items = collectGroup(group);
  if (!items.length) return;

  const start = Number(trigger.dataset.phIndex);
  const index = items.findIndex((item) => item.trigger === trigger);
  lightboxState = {
    items,
    index: index >= 0 ? index : Math.max(0, start),
    trigger,
  };

  renderLightboxSlide(dialog);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('.ph-lightbox__close')?.focus();
}

function stepLightbox(delta) {
  const { items } = lightboxState;
  if (items.length <= 1) return;
  lightboxState.index = (lightboxState.index + delta + items.length) % items.length;
  const dialog = ensureLightbox();
  renderLightboxSlide(dialog);
  lightboxState.trigger = items[lightboxState.index].trigger;
}

function closeLightbox() {
  const dialog = document.querySelector('dialog.ph-lightbox');
  if (dialog?.open) dialog.close();
}

/**
 * Mount one shared page-level photo lightbox (native dialog).
 * Safe to call once after lodging (or other zoom triggers) are in the DOM.
 */
export function initPhotoLightbox() {
  const dialog = ensureLightbox();
  if (lightboxBound) return;
  lightboxBound = true;

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('.ph-zoom-trigger');
    if (!trigger || !document.contains(trigger)) return;
    event.preventDefault();
    openLightbox(trigger);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeLightbox();
      return;
    }
    if (event.target.closest('.ph-lightbox__close')) {
      closeLightbox();
      return;
    }
    if (event.target.closest('.ph-lightbox__prev')) {
      stepLightbox(-1);
      return;
    }
    if (event.target.closest('.ph-lightbox__next')) {
      stepLightbox(1);
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (!dialog.open || lightboxState.items.length <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepLightbox(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepLightbox(1);
    }
  });

  dialog.addEventListener('close', () => {
    const trigger = lightboxState.trigger;
    lightboxState = { items: [], index: 0, trigger: null };
    const img = dialog.querySelector('.ph-lightbox__img');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }
    // Restore focus after native dialog teardown.
    queueMicrotask(() => {
      if (trigger && document.contains(trigger)) trigger.focus();
    });
  });
}
