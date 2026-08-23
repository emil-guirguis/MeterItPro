import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['worker/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-worker'],
    testTimeout: 10000,
  },
});
