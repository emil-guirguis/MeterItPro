/**
 * Vite plugin: emit dist/404.html as a copy of dist/index.html — but only
 * for a non-root base (GitHub Pages), NOT for the root-base Cloudflare build.
 *
 * GitHub Pages (base '/Synergy/') has no SPA rewrite — the public/_redirects
 * file is a Cloudflare-only convention and is ignored — so without a 404.html
 * any deep link loaded directly returns GitHub's default 404. GitHub serves
 * 404.html for unmatched paths, which lets the SPA boot and client-route.
 *
 * Cloudflare Pages (base '/') DOES honor _redirects (`/* /index.html 200`),
 * which returns a clean 200. But if a 404.html is also present, Cloudflare
 * serves THAT (status 404) for unmatched routes instead of the 200 rewrite.
 * So we skip 404.html when base === '/', letting _redirects win on CF.
 */

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function spaFallbackPlugin(): Plugin {
  let base = '/';
  return {
    name: 'spa-fallback-plugin',
    // Run after other closeBundle hooks so index.html is already written.
    enforce: 'post',
    configResolved(config) {
      base = config.base;
    },
    closeBundle() {
      // Root base = Cloudflare (uses _redirects → 200). Only GitHub Pages
      // (non-root base) needs the 404.html fallback.
      if (base === '/' || base === './') {
        console.log('🧭 spa-fallback: root base — skipping 404.html (Cloudflare uses _redirects)');
        return;
      }
      const distDir = path.resolve(process.cwd(), 'dist');
      const index = path.join(distDir, 'index.html');
      const fallback = path.join(distDir, '404.html');
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, fallback);
        console.log(`🧭 spa-fallback: wrote dist/404.html (base ${base})`);
      }
    },
  };
}
