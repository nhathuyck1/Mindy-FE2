import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: ['manager-audit.e2e.ts', 'manager-leave-fixed-clock.e2e.ts'],
  workers: 1,
  timeout: 90000,
  reporter: 'line',
  outputDir: '../../../.next/manager-qa-audit-results',
  use: { baseURL: 'http://localhost:3001', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
