import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/live', retries: 0, workers: 1,
  outputDir: 'artifacts/playwright-live',
  reporter: [['list'], ['json', { outputFile: 'artifacts/live-results.json' }]],
  use: { baseURL: 'https://tehutahu.github.io/my-note-app/', viewport: { width: 412, height: 915 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
