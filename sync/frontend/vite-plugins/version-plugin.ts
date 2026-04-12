/**
 * Vite plugin to inject version information at build time.
 * Reads version.json from the repo root (../../version.json relative to sync/frontend).
 */

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',
    config() {
      const versionFilePath = path.resolve(process.cwd(), '../../version.json');
      let versionData = {
        version: 'dev',
        year: new Date().getFullYear(),
        week: 1,
        build: 0,
        timestamp: new Date().toISOString(),
        date: 'Development',
      };

      if (fs.existsSync(versionFilePath)) {
        try {
          versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
          console.log(`📦 Building with version: ${versionData.version}`);
        } catch {
          console.warn('⚠️  Could not read version file, using development version');
        }
      } else {
        console.log('📦 Building in development mode');
      }

      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionData.version),
        },
      };
    },
  };
}
