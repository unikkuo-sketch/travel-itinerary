import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function initMap(mapData) {
  const el = document.getElementById('leaflet-map');
  if (!el || !mapData) return;

  const map = L.map(el).setView(mapData.center, mapData.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  const latlngs = mapData.locations.map((loc) => loc.coords);
  mapData.locations.forEach((loc) => {
    L.marker(loc.coords).addTo(map).bindPopup(`<b>${loc.name}</b>`);
  });

  const polyline = L.polyline(latlngs, {
    color: '#e63946',
    weight: 4,
    opacity: 0.7,
    dashArray: '10, 10',
  }).addTo(map);

  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}
