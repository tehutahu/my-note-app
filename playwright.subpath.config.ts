import { defineConfig } from '@playwright/test';
import config from './playwright.config';
const baseURL = 'http://127.0.0.1:4173/my-note-app/';
export default defineConfig({
  ...config,
  testDir: './tests/subpath',
  outputDir: 'artifacts/playwright-subpath',
  reporter: [['list'], ['json', { outputFile: 'artifacts/subpath-results.json' }]],
  use: { ...config.use, baseURL },
  webServer: { command: 'node scripts/serve.mjs', url: baseURL, env: { BASE_PATH: '/my-note-app/' }, reuseExistingServer: false },
});
