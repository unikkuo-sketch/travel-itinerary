const base = import.meta.env.BASE_URL;

/** Trip id from ?trip= (legacy) or /trips/{id}/… path pages. */
export function getTripId() {
  const q = new URLSearchParams(location.search).get('trip');
  if (q) return q;

  const parts = location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('trips');
  if (i === -1 || !parts[i + 1]) return null;

  const id = decodeURIComponent(parts[i + 1]);
  if (!id || id === 'manifest.json' || id.startsWith('_')) return null;
  return id;
}

/**
 * Canonical trip page URLs (path-based). Shopping stays query-string (tool / noindex).
 * Legacy `*.html?trip=` shells still resolve via getTripId().
 */
export function tripUrl(id, page = 'trip', hash = '') {
  const enc = encodeURIComponent(id);
  if (page === 'shopping') {
    return `${base}shopping.html?trip=${enc}${hash}`;
  }
  if (page === 'stories') return `${base}trips/${enc}/stories.html${hash}`;
  if (page === 'food') return `${base}trips/${enc}/food.html${hash}`;
  return `${base}trips/${enc}/${hash}`;
}

export async function loadManifest() {
  const res = await fetch(`${base}trips/manifest.json`);
  if (!res.ok) throw new Error('manifest not found');
  return res.json();
}

export async function loadTrip(id) {
  const res = await fetch(`${base}trips/${encodeURIComponent(id)}/itinerary.json`);
  if (!res.ok) throw new Error(`trip not found: ${id}`);
  const data = await res.json();
  if (data.meta?.slug && data.meta.slug !== id) {
    console.warn(`slug mismatch: folder=${id}, meta.slug=${data.meta.slug}`);
  }
  return data;
}
