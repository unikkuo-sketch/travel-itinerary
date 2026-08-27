import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-icons.js';

/** Per-day route colors (independent of trip theme sakura/ocean). */
const DAY_COLORS = [
  '#C4786A',
  '#6E8FA3',
  '#7A9B6D',
  '#B37E8E',
  '#C9A227',
  '#8B6F60',
  '#5B7C99',
  '#A67C52',
];

function dayColor(day) {
  const i = Math.max(1, Number(day) || 1) - 1;
  return DAY_COLORS[i % DAY_COLORS.length];
}

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numberedIcon(number, color) {
  return L.divIcon({
    className: 'map-marker-wrap',
    html: `<span class="map-marker" style="--marker-color:${esc(color)}">${esc(number)}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export function initMap(mapData) {
  const el = document.getElementById('leaflet-map');
  if (!el || !mapData?.locations?.length) return;

  const locs = mapData.locations;
  const map = L.map(el).setView(mapData.center, mapData.zoom);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(map);

  locs.forEach((loc) => {
    const num = loc.number ?? '';
    const color = dayColor(loc.day);
    const label = num !== '' ? `${num}. ${loc.name}` : loc.name;
    L.marker(loc.coords, { icon: numberedIcon(num, color) })
      .addTo(map)
      .bindPopup(`<b>${esc(label)}</b>`);
  });

  for (let i = 0; i < locs.length - 1; i++) {
    const from = locs[i];
    const to = locs[i + 1];
    const sameDay = Number(from.day) === Number(to.day);
    L.polyline([from.coords, to.coords], {
      color: dayColor(from.day),
      weight: 4,
      opacity: 0.75,
      dashArray: sameDay ? null : '8, 8',
    }).addTo(map);
  }

  map.fitBounds(L.latLngBounds(locs.map((l) => l.coords)), { padding: [50, 50] });

  const legendEl = document.getElementById('map-legend');
  if (!legendEl) return;

  const days = [...new Set(locs.map((l) => Number(l.day)).filter((d) => d > 0))].sort((a, b) => a - b);
  legendEl.innerHTML = days
    .map(
      (d) =>
        `<span class="map-legend-item"><span class="map-legend-dot" style="background:${dayColor(d)}"></span>Day ${d}</span>`
    )
    .join('');
}
