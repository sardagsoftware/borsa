/**
 * Sentry Integration Test Script
 * Tests error monitoring functionality
 */

const {
  captureExceptionWithContext,
  captureMessage,
  setUserContext,
  addBreadcrumb
} = require('./lib/monitoring/sentry-integration');

console.log('=== SENTRY ERROR MONITORING TEST ===\n');

// Check if Sentry is configured
if (!process.env.SENTRY_DSN) {
  console.log('⚠️ SENTRY_DSN not configured - Sentry disabled');
  console.log('To enable Sentry:');
  console.log('1. Create account at https://sentry.io/');
  console.log('2. Create new Node.js project');
  console.log('3. Add SENTRY_DSN to .env file');
  console.log('4. Set SENTRY_ENABLED=true in .env\n');
  process.exit(0);
}

console.log('✅ Sentry DSN configured\n');

// Test 1: Set User Context
console.log('Test 1: Setting User Context');
setUserContext({
  id: 'test-user-123',
  username: 'test-user',
  email: 'test@example.com'  // Will be filtered out (PII)
});
console.log('✅ User context set\n');

// Test 2: Add Breadcrumbs
console.log('Test 2: Adding Breadcrumbs');
addBreadcrumb('User navigated to dashboard', 'navigation', 'info', {
  from: '/home',
  to: '/dashboard'
});

addBreadcrumb('User clicked button', 'user-action', 'info', {
  buttonId: 'checkout-button',
  cartTotal: 149.99
});

addBreadcrumb('API call started', 'http', 'info', {
  method: 'POST',
  url: '/api/payment/process'
});

console.log('✅ Breadcrumbs added\n');

// Test 3: Capture Message (Info Level)
console.log('Test 3: Capturing Info Message');
captureMessage('Test info message from Node.js', 'info', {
  test: true,
  timestamp: Date.now(),
  environment: process.env.NODE_ENV
});
console.log('✅ Info message sent to Sentry\n');

// Test 4: Capture Message (Warning Level)
console.log('Test 4: Capturing Warning Message');
captureMessage('Test warning: High memory usage detected', 'warning', {
  test: true,
  memoryUsage: process.memoryUsage(),
  threshold: '500MB'
});
console.log('✅ Warning message sent to Sentry\n');

// Test 5: Capture Exception
console.log('Test 5: Capturing Exception');
try {
  // Simulate error
  throw new Error('Test error: Simulated database connection failure');
} catch (error) {
  captureExceptionWithContext(error, {
    operation: 'database-connection',
    database: 'postgresql',
    host: 'localhost',
    test: true,
    tags: {
      severity: 'high',
      component: 'database'
    }
  });
  console.log('✅ Exception sent to Sentry\n');
}

// Test 6: Capture Exception with Sensitive Data (should be redacted)
console.log('Test 6: Testing PII Redaction');
try {
  throw new Error('Test error with sensitive data');
} catch (error) {
  captureExceptionWithContext(error, {
    operation: 'test-pii-redaction',
    password: 'this-should-be-redacted',  // Will be redacted
    token: 'Bearer abc123',                // Will be redacted
    apiKey: 'sk-test-12345',               // Will be redacted
    userId: 'safe-user-id',                // Will be preserved
    test: true
  });
  console.log('✅ Exception with PII sent (PII should be redacted)\n');
}

// Test 7: Nested Error
console.log('Test 7: Capturing Nested Error');
try {
  try {
    throw new Error('Inner error: Invalid API response');
  } catch (innerError) {
    const outerError = new Error('Outer error: Failed to process API response');
    outerError.cause = innerError;
    throw outerError;
  }
} catch (error) {
  captureExceptionWithContext(error, {
    operation: 'api-processing',
    endpoint: '/api/external/data',
    test: true
  });
  console.log('✅ Nested error sent to Sentry\n');
}

// Summary
console.log('=== TEST SUMMARY ===');
console.log('✅ All test events sent to Sentry');
console.log('');
console.log('📊 Check your Sentry dashboard:');
console.log('https://sentry.io/');
console.log('');
console.log('You should see:');
console.log('- 2 info messages');
console.log('- 1 warning message');
console.log('- 3 error exceptions');
console.log('- User context: test-user-123');
console.log('- Breadcrumbs trail (navigation, user actions, API calls)');
console.log('');
console.log('🔒 PII redaction test:');
console.log('Check that password, token, apiKey are [REDACTED]');
console.log('');
console.log('⏱️ Events may take 5-10 seconds to appear in dashboard');
console.log('');

// Wait a moment for events to be sent
setTimeout(() => {
  console.log('✅ Test complete. Check Sentry dashboard.');
  process.exit(0);
}, 2000);
