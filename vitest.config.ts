import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8', reporter: ['text', 'json-summary'], reportsDirectory: 'artifacts/coverage',
      include: ['src/domain/**/*.ts', 'src/storage/**/*.ts'],
      thresholds: { perFile: true, lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
