import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({
  ...config,
  outputDir: 'artifacts/playwright-firefox',
  reporter: [['list'], ['json', { outputFile: 'artifacts/firefox-results.json' }]],
  projects: [{ name: 'firefox', use: { browserName: 'firefox' } }],
});
