import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/travel-itinerary-2026/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shopping: resolve(__dirname, 'shopping.html'),
      },
    },
  },
});
