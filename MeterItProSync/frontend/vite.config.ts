import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_APP_VERSION is injected at build time via Docker build-arg → ENV.
// Vite automatically exposes VITE_* env vars to import.meta.env, so no plugin needed.

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 3003,
    host: true,
  },
  preview: {
    port: 3003,
    host: true,
  },
  build: {
    sourcemap: true,
    // Split vendor libs into separate chunks to avoid a single huge bundle
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('@mui') || id.includes('@material-ui')) return 'vendor-mui';
            if (id.includes('@mui/icons-material') || id.includes('material-design-icons')) return 'vendor-mui-icons';
            if (id.includes('lodash')) return 'vendor-lodash';
            if (id.includes('zustand')) return 'vendor-zustand';
            if (id.includes('axios')) return 'vendor-axios';
            return 'vendor';
          }
        },
      },
    },
    // reduce noise while we iterate on splitting; keep under ~600KB for warnings
    chunkSizeWarningLimit: 600,
  },
});
