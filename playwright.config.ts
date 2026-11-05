import { defineConfig, devices } from '@playwright/test';

// Exercise Strict Mode's effect replay in development as well as production behavior.
const dev = process.env.MINDY_E2E_DEV === '1';
const baseURL = `http://${dev ? 'localhost' : '127.0.0.1'}:3103`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next ${dev ? 'dev' : 'start'} --port 3103`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      APP_ORIGIN: baseURL,
      ...(dev ? { MINDY_DIST_DIR: '.next-e2e-dev' } : {}),
    },
  },
});
