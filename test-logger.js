/**
 * Logger Test Script
 * Tests Winston production logger functionality
 */

const logger = require('./lib/logger/production-logger');

console.log('=== WINSTON LOGGER TEST ===\n');

// Test 1: Basic logging
console.log('Test 1: Basic Logging');
logger.info('Server starting', { port: 3100, env: 'development' });
logger.warn('High memory usage detected', { memoryMB: 512, threshold: 500 });
logger.error('Database connection failed', { error: new Error('Connection timeout'), host: 'localhost' });
logger.debug('Cache hit', { key: 'user:123', value: 'John Doe' });

// Test 2: PII Redaction
console.log('\nTest 2: PII/Secret Redaction');
logger.info('User login attempt', {
  username: 'john',
  password: 'secret123',  // Should be redacted
  token: 'Bearer sk-proj-abc123xyz',  // Should be redacted
  ssn: '123-45-6789',  // Should be redacted
  creditCard: '4532-1234-5678-9010',  // Should be redacted
  email: 'john@example.com'  // Should be preserved
});

// Test 3: Performance Timing
console.log('\nTest 3: Performance Timing');
const endTimer = logger.time('test-operation');
setTimeout(() => {
  const duration = endTimer();
  console.log(`Operation completed in ${duration}ms`);
}, 100);

// Test 4: Request/Response Logging
console.log('\nTest 4: Request/Response Logging');
const mockReq = {
  method: 'POST',
  url: '/api/users',
  path: '/api/users',
  query: { page: 1 },
  ip: '192.168.1.100',
  headers: {
    'user-agent': 'Mozilla/5.0',
    'content-type': 'application/json'
  },
  user: { id: 123 }
};

logger.request(mockReq, { action: 'create_user' });

const mockRes = {
  statusCode: 201,
  getHeader: (name) => {
    const headers = {
      'content-type': 'application/json',
      'content-length': '156'
    };
    return headers[name];
  }
};

logger.response(mockReq, mockRes, 45, { userId: 456 });

// Test 5: Error with Stack Trace
console.log('\nTest 5: Error with Stack Trace');
try {
  throw new Error('Test error with stack trace');
} catch (err) {
  logger.error('Caught test error', { error: err, context: 'test-script' });
}

// Test 6: Nested Object Logging
console.log('\nTest 6: Nested Object Logging');
logger.info('Complex data structure', {
  user: {
    id: 123,
    name: 'John Doe',
    credentials: {
      password: 'hashed_password',  // Should be redacted
      apiKey: 'sk-1234567890abcdef',  // Should be redacted
      twoFactorSecret: 'JBSWY3DPEHPK3PXP'  // Should be redacted
    },
    profile: {
      email: 'john@example.com',
      phone: '+1-555-0100'
    }
  }
});

console.log('\n=== TEST COMPLETE ===');
console.log('\nCheck logs/ directory for output files.');
console.log('In production with Azure Insights configured, logs would also be sent to Azure.\n');

// Allow time for async logging to complete
setTimeout(() => {
  process.exit(0);
}, 500);
