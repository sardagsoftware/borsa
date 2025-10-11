/**
 * 🔐 TEST API KEY GENERATOR
 *
 * WHITE-HAT COMPLIANCE:
 * - Test-only keys (never use in production)
 * - Limited permissions (read-only where possible)
 * - Easily identifiable (lyd_test_ prefix)
 * - Short expiration (24 hours)
 * - Revocable at any time
 * - No real user data access
 *
 * @version 1.0.0
 * @security WHITE-HAT
 */

const crypto = require('crypto');

/**
 * Test API key scopes (limited permissions)
 */
const TEST_SCOPES = {
  READ_ONLY: [
    'cities:read',
    'personas:read',
    'signals:read',
    'health:read'
  ],
  WRITE_TEST: [
    'cities:read',
    'cities:write',
    'personas:read',
    'personas:write',
    'signals:read',
    'signals:write'
  ],
  ADMIN_TEST: [
    'cities:*',
    'personas:*',
    'signals:*',
    'admin:read'
  ]
};

/**
 * Generate test API key
 * Format: lyd_test_[random_32_bytes]_[timestamp]
 */
function generateTestApiKey() {
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  const timestamp = Date.now();
  return `lyd_test_${randomBytes}_${timestamp}`;
}

/**
 * Hash API key for storage (SHA-256)
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Create test API key with metadata
 */
function createTestApiKey(options = {}) {
  const {
    name = 'Test API Key',
    scopes = TEST_SCOPES.READ_ONLY,
    expiresIn = 24 * 60 * 60 * 1000, // 24 hours
    userId = 'test_user_001',
    orgId = 'test_org_001',
    rateLimit = 100 // Low rate limit for tests
  } = options;

  const apiKey = generateTestApiKey();
  const keyHash = hashApiKey(apiKey);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn);

  return {
    // Plain key (only shown once)
    apiKey,

    // Metadata for database
    metadata: {
      key_hash: keyHash,
      user_id: userId,
      organization_id: orgId,
      name,
      scopes: JSON.stringify(scopes),
      rate_limit_per_hour: rateLimit,
      status: 'active',
      is_test_key: true, // WHITE-HAT: Mark as test key
      environment: 'test',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString()
    }
  };
}

/**
 * Validate test API key format
 */
function isTestApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Must start with lyd_test_
  if (!apiKey.startsWith('lyd_test_')) {
    return false;
  }

  // Must have valid structure: lyd_test_[random]_[timestamp]
  const parts = apiKey.split('_');
  if (parts.length !== 4) {
    return false;
  }

  // Timestamp must be valid number
  const timestamp = parseInt(parts[3], 10);
  if (isNaN(timestamp)) {
    return false;
  }

  return true;
}

/**
 * Check if test key is expired
 */
function isTestKeyExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Create standard test keys for E2E tests
 */
function createStandardTestKeys() {
  return {
    // Read-only key for GET requests
    readOnly: createTestApiKey({
      name: 'E2E Test - Read Only',
      scopes: TEST_SCOPES.READ_ONLY,
      userId: 'test_readonly_user',
      orgId: 'test_readonly_org',
      rateLimit: 50
    }),

    // Write key for POST/PUT requests
    readWrite: createTestApiKey({
      name: 'E2E Test - Read/Write',
      scopes: TEST_SCOPES.WRITE_TEST,
      userId: 'test_readwrite_user',
      orgId: 'test_readwrite_org',
      rateLimit: 100
    }),

    // Admin key for all operations
    admin: createTestApiKey({
      name: 'E2E Test - Admin',
      scopes: TEST_SCOPES.ADMIN_TEST,
      userId: 'test_admin_user',
      orgId: 'test_admin_org',
      rateLimit: 200
    })
  };
}

/**
 * Revoke test API key (mark as inactive)
 */
function revokeTestKey(keyHash) {
  return {
    key_hash: keyHash,
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Clean up expired test keys
 */
function getExpiredTestKeys(keys) {
  const now = new Date();
  return keys.filter(key => {
    return key.is_test_key === true &&
           key.expires_at &&
           new Date(key.expires_at) < now;
  });
}

/**
 * Generate test key documentation
 */
function generateTestKeyDocs(keys) {
  return {
    documentation: {
      format: 'lyd_test_[random_32_bytes]_[timestamp]',
      prefix: 'lyd_test_',
      security: 'Test keys only - never use in production',
      expiration: '24 hours from creation',
      rateLimit: 'Limited to 50-200 requests/hour',
      scopes: 'Limited to test operations only'
    },
    keys: {
      readOnly: {
        key: keys.readOnly.apiKey,
        scopes: TEST_SCOPES.READ_ONLY,
        usage: 'For GET requests in E2E tests',
        rateLimit: '50 req/hour'
      },
      readWrite: {
        key: keys.readWrite.apiKey,
        scopes: TEST_SCOPES.WRITE_TEST,
        usage: 'For POST/PUT requests in E2E tests',
        rateLimit: '100 req/hour'
      },
      admin: {
        key: keys.admin.apiKey,
        scopes: TEST_SCOPES.ADMIN_TEST,
        usage: 'For admin operations in E2E tests',
        rateLimit: '200 req/hour'
      }
    },
    exampleUsage: {
      curl: `curl -H "X-API-Key: lyd_test_..." http://localhost:3100/api/v1/smart-cities/cities`,
      playwright: `
test('API request with test key', async ({ request }) => {
  const response = await request.get('/api/v1/smart-cities/cities', {
    headers: {
      'X-API-Key': process.env.TEST_API_KEY_READ
    }
  });
  expect(response.status()).toBe(200);
});`
    },
    whiteHatPolicy: {
      rules: [
        '✅ Only use test keys in test environment',
        '✅ Never commit test keys to git (use .env)',
        '✅ Revoke keys after testing',
        '✅ Keys expire after 24 hours automatically',
        '✅ Test keys cannot access production data',
        '❌ Never use test keys in production',
        '❌ Never share test keys publicly'
      ]
    }
  };
}

module.exports = {
  generateTestApiKey,
  hashApiKey,
  createTestApiKey,
  isTestApiKey,
  isTestKeyExpired,
  createStandardTestKeys,
  revokeTestKey,
  getExpiredTestKeys,
  generateTestKeyDocs,
  TEST_SCOPES
};
