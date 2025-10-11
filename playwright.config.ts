import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts', // Run all Playwright spec files
  testIgnore: [
    '**/integration/**/*.test.js',           // Ignore Jest-based integration tests
    '**/contract/**/*.spec.ts',              // Ignore Jest-based contract tests
    '**/e2e/connectors-real-endpoints.e2e.spec.ts', // Ignore Jest-based E2E test
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'NODE_ENV=test ENABLE_RATE_LIMITING=true PORT=3100 node server.js',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      ENABLE_RATE_LIMITING: 'true'
    }
  },
});
