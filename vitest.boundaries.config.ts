import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { reporters: ['default', 'json'], outputFile: { json: 'artifacts/boundary-results.json' }, include: ['tests/boundaries/**/*.test.ts'], testTimeout: 120000, fileParallelism: false, maxWorkers: 1 },
});
