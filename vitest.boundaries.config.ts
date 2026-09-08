import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/boundaries/**/*.test.ts'], testTimeout: 120000, fileParallelism: false, maxWorkers: 1 },
});
