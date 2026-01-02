/**
 * Jest Configuration
 * Integration and Unit Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js'],

  // Ignore Playwright tests (*.spec.js)
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.spec\\.js$',
    '/playwright-report/',
    '/test-results/',
  ],

  // Coverage
  collectCoverageFrom: [
    'middleware/**/*.js',
    'api/**/*.js',
    'lib/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Globals
  globals: {
    NODE_ENV: 'test',
  },

  // Module paths
  modulePaths: ['<rootDir>'],

  // Max workers (parallel test execution)
  maxWorkers: '50%',

  // Bail on first failure (optional)
  bail: false,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,
};
