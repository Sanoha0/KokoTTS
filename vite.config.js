import { defineConfig } from 'vite';
<<<<<<< HEAD
export default defineConfig({ base: './', worker: { format: 'es' }, build: { target: 'es2022' } });
=======

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

>>>>>>> 544063aeada6b406102f5d474a0896e08148042d
