/**
 * Vite preview server entry point.
 * Used by the Windows service (node-windows) to serve the built frontend.
 * Runs: node preview-server.mjs
 */
import { preview } from 'vite';

const server = await preview({
  preview: {
    port: 3003,
    host: true,
  },
});

server.printUrls();

process.on('SIGINT', () => {
  server.httpServer?.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.httpServer?.close();
  process.exit(0);
});
