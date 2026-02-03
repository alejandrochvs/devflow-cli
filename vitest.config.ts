import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.d.ts'],
      // Coverage thresholds - increase as we add more tests
      // Current: ~7% | Next target: 15% | Long-term: 40%
      thresholds: {
        statements: 6,
        branches: 6,
        functions: 8,
        lines: 6,
      },
    },
  },
});
