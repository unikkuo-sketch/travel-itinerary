import { cpSync, createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const tripsDir = resolve(__dirname, 'trips');

function tripsStatic() {
  return {
    name: 'trips-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url?.split('?')[0] ?? '';
        const marker = '/trips/';
        const idx = raw.indexOf(marker);
        if (idx === -1) return next();

        const rel = decodeURIComponent(raw.slice(idx + marker.length));
        const file = resolve(tripsDir, rel);
        if (!file.startsWith(tripsDir) || !existsSync(file)) return next();

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      cpSync(tripsDir, resolve(__dirname, 'dist/trips'), { recursive: true });
    },
  };
}

export default defineConfig({
  base: '/travel-itinerary-2026/',
  plugins: [tripsStatic()],
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        trip: resolve(__dirname, 'trip.html'),
        shopping: resolve(__dirname, 'shopping.html'),
      },
    },
  },
});
