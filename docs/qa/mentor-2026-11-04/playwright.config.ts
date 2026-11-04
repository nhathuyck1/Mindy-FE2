import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/mentor-audit.e2e.ts',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  outputDir: '../../../.next/mentor-qa-audit-results',
  use: { baseURL: 'http://localhost:3001', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
