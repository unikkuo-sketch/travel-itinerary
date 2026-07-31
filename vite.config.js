import { cpSync, createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const tripsDir = resolve(__dirname, 'trips');
const rootDir = __dirname;

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
        if (
          rel &&
          file.startsWith(tripsDir) &&
          existsSync(file) &&
          extname(file)
        ) {
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
      cpSync(tripsDir, resolve(__dirname, 'dist/trips'), { recursive: true });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [tripsStatic()],
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        trip: resolve(__dirname, 'trip.html'),
        shopping: resolve(__dirname, 'shopping.html'),
        stories: resolve(__dirname, 'stories.html'),
        food: resolve(__dirname, 'food.html'),
      },
    },
  },
});
