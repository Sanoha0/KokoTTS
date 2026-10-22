import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  worker: { format: 'es' },
  build: { target: 'es2022' },
  plugins: [{
    name: 'kokotts-karaoke-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('/src/main.js', '/src/karaoke-entry.js');
      },
    },
  }],
});

