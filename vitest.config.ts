import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'client/frontend/vitest.config.ts',
      'client/api/vitest.config.ts',
      'sync/api/vitest.config.ts',
      'sync/mcp/vitest.config.ts',
    ],
  },
});
