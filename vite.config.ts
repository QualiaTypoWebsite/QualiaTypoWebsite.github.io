import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import path from 'node:path';

/**
 * GitHub Pages has no SPA rewrite rule: a deep link like /read/2 is a 404
 * unless a 404.html exists. Serving index.html as the 404 body lets the
 * client router take over and render the right route.
 */
function githubPagesSpaFallback(): Plugin {
  return {
    name: 'gh-pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const out = path.resolve('dist');
      copyFileSync(path.join(out, 'index.html'), path.join(out, '404.html'));
    },
  };
}

export default defineConfig({
  // The repo is QualiaTypoWebsite/QualiaTypoWebsite, an organisation site, so
  // Pages serves it from the domain root rather than a /repo-name/ subpath.
  base: '/',
  plugins: [react(), githubPagesSpaFallback()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
