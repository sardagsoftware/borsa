/**
 * Jest Test Setup
 * Global configuration for all tests
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specific time
   */
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Generate random email
   */
  randomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,

  /**
   * Generate random string
   */
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Cleanup database records
   */
  cleanup: async (supabase, table, condition) => {
    try {
      await supabase.from(table).delete().match(condition);
    } catch (error) {
      console.error(`Cleanup failed for ${table}:`, error);
    }
  },
};

// Console suppression for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Deprecation'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
