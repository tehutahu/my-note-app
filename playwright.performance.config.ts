import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({ ...config, testDir: './tests/performance', timeout: 300000,
  outputDir: 'artifacts/playwright-performance', reporter: [['list'], ['json', { outputFile: 'artifacts/performance-results.json' }]] });
