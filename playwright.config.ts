import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', retries: 0, workers: 1,
  outputDir: 'artifacts/playwright',
  reporter: [['list'], ['json', { outputFile: 'artifacts/e2e-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1280, height: 800 }, trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
