const base = import.meta.env.BASE_URL;

export function getTripId() {
  return new URLSearchParams(location.search).get('trip');
}

export function tripUrl(id, page = 'trip', hash = '') {
  const file = page === 'shopping' ? 'shopping.html' : 'trip.html';
  return `${base}${file}?trip=${encodeURIComponent(id)}${hash}`;
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
