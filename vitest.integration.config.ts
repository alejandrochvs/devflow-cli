import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30000, // Longer timeout for git operations
    hookTimeout: 10000,
    globals: true,
    isolate: true, // Isolate test files
    fileParallelism: false, // Run tests sequentially to avoid git conflicts
  },
});
