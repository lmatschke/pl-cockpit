import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts', 'web/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['server/src/**', 'shared/**'],
      exclude: ['**/*.test.ts', 'server/src/main.ts'],
    },
  },
});
