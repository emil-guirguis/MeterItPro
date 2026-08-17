import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, '../../framework/frontend'),
      // Force MUI and emotion to resolve from client node_modules to avoid CJS issues
      // from framework/frontend/node_modules in tests
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
      '@mui/system': path.resolve(__dirname, 'node_modules/@mui/system'),
      '@mui/styled-engine': path.resolve(__dirname, 'node_modules/@mui/styled-engine'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
      'react-grid-layout': path.resolve(__dirname, 'node_modules/react-grid-layout'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: [
          /react-grid-layout/,
          /@mui\//,
          /@emotion\//,
        ],
      },
    },
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});