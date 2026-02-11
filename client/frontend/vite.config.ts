import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { versionPlugin } from './vite-plugins/version-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to log errors to terminal
const errorLoggerPlugin = () => {
  return {
    name: 'error-logger',
    configureServer(server: any) {
      server.ws.on('connection', () => {
        server.ws.on('error', (error: any) => {
          console.error('\n❌ WebSocket Error:', error);
        });
      });
      
      // Log HMR errors
      server.middlewares.use((err: any, _req: any, _res: any, next: any) => {
        if (err) {
          console.error('\n❌ Server Error:', err.message);
          console.error(err.stack);
        }
        next(err);
      });
    },
    transform(_code: any) {
      // This will catch transform errors
      return null;
    },
    handleHotUpdate({ file }: any) {
      console.log(`\n🔄 Hot update: ${path.relative(process.cwd(), file)}`);
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    versionPlugin(),
    react({
      // Log React errors to terminal
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy'],
        },
      },
    }),
    errorLoggerPlugin(),
    // bundle visualizer removed per request
  ],
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, '../../framework/frontend'),
    },
    // Prevent duplicate copies of common libs (avoid bundling framework's node_modules separately)
    dedupe: [
      'react',
      'react-dom',
      'scheduler',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      'recharts',
      'zustand',
      'axios',
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'react-grid-layout',
      'recharts',
      'react-router-dom',
      'immer',
      'zustand',
      'axios'
    ],
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces (IPv4 and IPv6)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      overlay: true, // Show error overlay in browser
    },
    fs: {
      allow: [
        '.',
        '../../framework/frontend',
        '../../node_modules',
      ],
    },
  },
  // Log errors to terminal
  clearScreen: false, // Don't clear terminal on rebuild
  logLevel: 'info', // Show info, warnings, and errors
  
  // Enhanced error handling
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      onwarn(warning, warn) {
        console.warn('\n⚠️  Build Warning:', warning.message);
        warn(warning);
      },
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        // Group vendor libraries into a small set of logical chunks.
        // This avoids creating a large number of vendor-* per-package files while still
        // separating heavy libraries from the app bundle.
        manualChunks(id: string) {
          // Normalize id and use posix paths for matching
          const normalizedId = id.replace(/\\\\/g, '/').replace(/\\/g, '/').toLowerCase();
          if (!normalizedId.includes('/node_modules/')) return;

          const nm = '/node_modules/';

          // React core: keep react and react-dom separate so react chunk stays smaller
          if (
            normalizedId.includes(`${nm}react${nm}`) ||
            normalizedId.includes('react.production') ||
            normalizedId.includes('react-jsx-runtime')
          ) {
            return 'vendor-react';
          }

          if (
            normalizedId.includes(`${nm}react-dom${nm}`) ||
            normalizedId.includes('react-dom-client.production') ||
            normalizedId.includes('react-dom.production')
          ) {
            return 'vendor-react-dom';
          }

          if (normalizedId.includes(`${nm}scheduler${nm}`) || normalizedId.includes('scheduler/cjs')) {
            return 'vendor-scheduler';
          }

          // Router
          if (normalizedId.includes(`${nm}react-router-dom${nm}`) || normalizedId.includes(`${nm}react-router${nm}`)) {
            return 'vendor-router';
          }

          // MUI + Emotion (UI libs)
          if (normalizedId.includes(`${nm}@mui${nm}`) || normalizedId.includes(`${nm}@material-ui${nm}`) || normalizedId.includes(`${nm}@emotion${nm}`)) {
            return 'vendor-mui';
          }

          // MUI icons (separate to keep icon code isolated)
          if (normalizedId.includes(`${nm}@mui${nm}icons-material${nm}`) || normalizedId.includes(`${nm}@material-ui${nm}icons${nm}`)) {
            return 'vendor-mui-icons';
          }

          // Charts: split recharts, d3, and victory into separate chunks
          if (
            normalizedId.includes(`${nm}recharts${nm}`) ||
            normalizedId.includes('client/frontend/node_modules/recharts') ||
            normalizedId.includes('framework/frontend/node_modules/recharts') ||
            (normalizedId.includes('recharts') && normalizedId.includes('production'))
          ) {
            return 'vendor-recharts';
          }

          if (
            normalizedId.includes(`${nm}d3${nm}`) ||
            normalizedId.includes('client/frontend/node_modules/d3') ||
            normalizedId.includes('framework/frontend/node_modules/d3')
          ) {
            return 'vendor-d3';
          }

          if (normalizedId.includes(`${nm}victory-vendor${nm}`) || normalizedId.includes('victory-vendor')) {
            return 'vendor-victory';
          }

          // Grid / layout libraries (react-grid-layout, react-resizable, react-draggable)
          if (normalizedId.includes(`${nm}react-grid-layout${nm}`) || normalizedId.includes(`${nm}react-resizable${nm}`) || normalizedId.includes(`${nm}react-draggable${nm}`)) {
            return 'vendor-grid';
          }

          // microlink / json viewers
          if (normalizedId.includes(`${nm}@microlink${nm}`) || normalizedId.includes(`${nm}microlink${nm}`) || normalizedId.includes(`${nm}react-json-view${nm}`)) {
            return 'vendor-microlink';
          }

          // State and utils
          if (normalizedId.includes(`${nm}zustand${nm}`) || normalizedId.includes(`${nm}immer${nm}`) || normalizedId.includes('zustand')) {
            return 'vendor-state';
          }

          // Utilities / misc heavy libs
          if (normalizedId.includes(`${nm}lodash${nm}`) || normalizedId.includes(`${nm}decimal.js${nm}`) || normalizedId.includes(`${nm}decimal.js-light${nm}`) || normalizedId.includes(`${nm}fast-equals${nm}`)) {
            return 'vendor-utils';
          }

          // Axios / network
          if (normalizedId.includes(`${nm}axios${nm}`)) {
            return 'vendor-axios';
          }
          // Framework-local modules (keep framework code separate)
          if (normalizedId.includes('/framework/frontend/') || normalizedId.includes('/framework/node_modules/')) {
            return 'vendor-framework';
          }

          // Misc commonly-large libraries - extract explicitly
          if (normalizedId.includes(`${nm}react-is${nm}`) || normalizedId.includes('react-is/')) {
            return 'vendor-react-is';
          }

          if (normalizedId.includes(`${nm}react-transition-group${nm}`) || normalizedId.includes('react-transition-group/')) {
            return 'vendor-rtg';
          }

          if (normalizedId.includes('popperjs/core') || normalizedId.includes(`${nm}@popperjs${nm}`)) {
            return 'vendor-popper';
          }

          if (normalizedId.includes('@emotion') || normalizedId.includes(`${nm}emotion${nm}`)) {
            return 'vendor-emotion';
          }

          // Default fallback
          return 'vendor-others';
        },
      },
    },
    // Increase warning limit slightly while we iterate on splitting
    chunkSizeWarningLimit: 600,
  },
  // Base path for production (leave empty for root domain)
  base: '/',
});
