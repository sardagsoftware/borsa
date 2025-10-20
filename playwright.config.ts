import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts', // Run all Playwright spec files
  testIgnore: [
    '**/integration/**/*.test.js',           // Ignore Jest-based integration tests
    '**/contract/**/*.spec.ts',              // Ignore Jest-based contract tests
    '**/e2e/connectors-real-endpoints.e2e.spec.ts', // Ignore Jest-based E2E test
  ],
  fullyParallel: false, // Sequential to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once in dev too
  workers: 1, // Single worker for stability
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    actionTimeout: 10000, // 10s per action
    navigationTimeout: 30000, // 30s for page loads
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
