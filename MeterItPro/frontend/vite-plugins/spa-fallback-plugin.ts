/**
 * Vite plugin: emit dist/404.html as a copy of dist/index.html.
 *
 * GitHub Pages has no SPA rewrite (the public/_redirects file is a
 * Cloudflare-only convention and is ignored). Without a 404.html, any
 * deep link (e.g. /Synergy/support/documentations) loaded directly or
 * refreshed returns GitHub's default 404 instead of the app.
 *
 * GitHub Pages serves 404.html for any unmatched path; making it a copy
 * of index.html lets the SPA boot and hand off to the client router.
 */

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback-plugin',
    // Run after other closeBundle hooks so index.html is already written.
    enforce: 'post',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const index = path.join(distDir, 'index.html');
      const fallback = path.join(distDir, '404.html');
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, fallback);
        console.log('🧭 spa-fallback: wrote dist/404.html');
      }
    },
  };
}
