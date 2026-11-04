import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'admin-audit.e2e.ts',
  timeout: 90000,
  workers: 1,
  reporter: 'line',
  outputDir: '../../../.next/admin-qa-audit-results',
  use: { baseURL: 'http://localhost:3001', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
