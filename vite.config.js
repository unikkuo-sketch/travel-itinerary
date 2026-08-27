import { cpSync, createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const tripsDir = resolve(rootDir, 'trips');

const MIME = {
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.md': 'text/markdown; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};

function decodePath(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isInsideTrips(file) {
  const root = tripsDir.endsWith(sep) ? tripsDir : tripsDir + sep;
  return file === tripsDir || file.startsWith(root);
}

/** Map /trips/{id}/… to shell HTML when no static file exists (dev). */
function tripPageShell(pathname) {
  const path = decodePath(pathname.split('?')[0]);
  const m = path.match(/^\/trips\/([^/]+)\/?(index\.html|stories\.html|food\.html)?$/);
  if (!m) return null;
  const id = m[1];
  if (!id || id === 'manifest.json' || id.startsWith('_')) return null;
  if (m[2] === 'stories.html') return 'stories.html';
  if (m[2] === 'food.html') return 'food.html';
  return 'trip.html';
}

function tripsStatic() {
  return {
    name: 'trips-static',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawPath = (req.url || '').split('?')[0];
        const decoded = decodePath(rawPath);
        if (!decoded.startsWith('/trips/')) return next();

        const rel = decoded.slice('/trips/'.length).replace(/\/$/, '');
        const file = resolve(tripsDir, rel);

        // Real trip assets (json / photos / …)
        if (rel && isInsideTrips(file) && existsSync(file) && extname(file)) {
          const ext = extname(file).toLowerCase();
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
          createReadStream(file).pipe(res);
          return;
        }

        const shell = tripPageShell(decoded.endsWith('/') ? decoded : `${decoded}/`)
          || tripPageShell(decoded);
        if (shell) {
          try {
            const html = readFileSync(resolve(rootDir, shell), 'utf8');
            const transformed = await server.transformIndexHtml(req.url || `/${shell}`, html);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(transformed);
            return;
          } catch (err) {
            next(err);
            return;
          }
        }

        res.statusCode = 404;
        res.end('Not found');
      });
    },
    closeBundle() {
      cpSync(tripsDir, resolve(rootDir, 'dist/trips'), { recursive: true });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [tripsStatic()],
  build: {
    rollupOptions: {
      input: {
        hub: resolve(rootDir, 'index.html'),
        trip: resolve(rootDir, 'trip.html'),
        shopping: resolve(rootDir, 'shopping.html'),
        stories: resolve(rootDir, 'stories.html'),
        food: resolve(rootDir, 'food.html'),
      },
    },
  },
});
