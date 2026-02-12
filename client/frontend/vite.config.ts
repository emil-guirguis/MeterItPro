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
      'react-grid-layout',
      'react-resizable',
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
        // Suppress circular dependency warnings from third-party libs
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        console.warn('\n⚠️  Build Warning:', warning.message);
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 600,
  },
  // Base path for production (leave empty for root domain)
  base: '/',
});
