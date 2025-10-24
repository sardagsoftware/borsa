import baseConfig from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  testMatch: [
    'tests/smoke.spec.ts',
    'tests/production-smoke.spec.ts',
    'tests/comprehensive-smoke.spec.ts',
    'tests/verify-search.spec.ts',
    'tests/verify-search-live.spec.ts'
  ],
  retries: 0,
  fullyParallel: false
});
