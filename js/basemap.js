import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/**
 * OpenFreeMap Positron — keyless light basemap.
 * CARTO's cartocdn.com/light_all tiles now render an "API KEY REQUIRED" watermark.
 * This style is the OpenMapTiles port of that same Positron look.
 */
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/**
 * Attribution published on the OpenFreeMap planet TileJSON
 * (https://tiles.openfreemap.org/planet). MapLibre would add this after the
 * style loads; set it up front so the credit is visible even before then.
 */
const BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">&copy; OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

setWorkerUrl(workerUrl);

export function addBasemap(map) {
  // MapLibre's zoom is one level below Leaflet's. Zoom 0 desyncs the bridge.
  if (map.getMinZoom() < 1) map.setMinZoom(1);

  return maplibreGL({
    style: BASEMAP_STYLE,
    attributionControl: { customAttribution: BASEMAP_ATTRIBUTION },
  }).addTo(map);
}
