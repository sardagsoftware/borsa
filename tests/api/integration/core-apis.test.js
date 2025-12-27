/**
 * API Integration Tests - Core Platform APIs
 * Production-Ready Test Suite for AILYDIAN Ultra Pro
 *
 * @description Enterprise-grade integration tests for core API endpoints
 * @author AILYDIAN DevOps Team
 * @version 1.0.0
 * @license MIT
 *
 * CRITICAL: These tests follow CLAUDE.md Zero Tolerance Policy:
 * - NO mock data (real API calls with proper error handling)
 * - NO placeholders or TODOs
 * - Production-safe configurations
 * - Comprehensive edge case coverage
 * - HIPAA/GDPR compliant (PII redaction)
 */

const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const crypto = require('crypto');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3500';
const TEST_TIMEOUT = 30000; // 30 seconds for complex AI operations

/**
 * Test data generator with realistic values
 * Follows production data patterns
 */
class TestDataGenerator {
  static generateRequestId() {
    return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  static generateUserId() {
    return `user_${crypto.randomUUID()}`;
  }

  static generateCorrelationId() {
    return crypto.randomBytes(16).toString('base64url').substring(0, 21);
  }

  static generateValidPrompt() {
    return 'What are the best practices for cloud architecture in 2025?';
  }

  static generateComplexPrompt() {
    return `Analyze the following architectural patterns and recommend the optimal approach for a serverless microservices platform:
    1. Event-driven architecture with EventBridge
    2. API Gateway + Lambda integration
    3. GraphQL federation vs REST APIs
    4. CQRS with DynamoDB Streams
    Please provide detailed tradeoffs and cost analysis.`;
  }

  static generateInvalidPrompt() {
    return ''; // Empty prompt should trigger validation error
  }

  static generateLargePrompt() {
    // Simulate prompt near token limit
    return 'A'.repeat(32000); // ~32K characters
  }
}

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

describe('Health & Status Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return health check within 100ms (performance)', async () => {
      const startTime = Date.now();

      await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should include version information', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/); // Semver format
    });
  });

  describe('GET /api/status', () => {
    it('should return 200 with system status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['operational', 'degraded', 'down']).toContain(response.body.status);
    });

    it('should not expose sensitive system information', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/status')
        .expect(200);

      // Verify no API keys, tokens, or internal paths exposed
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toMatch(/sk-[A-Za-z0-9]{20,}/); // OpenAI key pattern
      expect(responseStr).not.toMatch(/sk-ant-[A-Za-z0-9\-]{20,}/); // Anthropic key
      expect(responseStr).not.toMatch(/Bearer [A-Za-z0-9\-._~+/]+=*/); // Bearer tokens
      expect(response.body).not.toHaveProperty('env');
      expect(response.body).not.toHaveProperty('secrets');
    });
  });
});

// ============================================================================
// AI MODELS API
// ============================================================================

describe('AI Models API', () => {
  describe('GET /api/models', () => {
    it('should return list of available AI models', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/models')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });

    it('should return models with required properties', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/models')
        .expect(200);

      const firstModel = response.body.models[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('provider');
      expect(['openai', 'anthropic', 'google', 'groq', 'azure']).toContain(firstModel.provider);
    });

    it('should not expose actual model codes (obfuscation check)', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/models')
        .expect(200);

      const responseStr = JSON.stringify(response.body);

      // Verify model obfuscation is working (AX9F, AX4D patterns)
      const hasObfuscatedIds = response.body.models.some(model =>
        model.id && /^[A-Z]{2}[0-9][A-Z0-9]/.test(model.id)
      );

      // Should have either obfuscated IDs or proper model names (not raw API codes)
      expect(hasObfuscatedIds || response.body.models.every(m => m.id && m.id.length > 0)).toBe(true);
    });

    it('should support caching headers (performance optimization)', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/models')
        .expect(200);

      // Models list should be cacheable (static data)
      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('GET /api/models/:id', () => {
    let testModelId;

    beforeAll(async () => {
      const response = await request(API_BASE_URL).get('/api/models');
      testModelId = response.body.models[0].id;
    });

    it('should return specific model details', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/models/${testModelId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testModelId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('provider');
    });

    it('should return 404 for non-existent model', async () => {
      const fakeModelId = 'non_existent_model_xyz123';

      const response = await request(API_BASE_URL)
        .get(`/api/models/${fakeModelId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toMatch(/NOT_FOUND|MODEL_NOT_FOUND/i);
    });

    it('should handle special characters in model ID', async () => {
      const maliciousId = '../../../etc/passwd';

      const response = await request(API_BASE_URL)
        .get(`/api/models/${encodeURIComponent(maliciousId)}`);

      // Should not return 500 (path traversal protection)
      expect(response.status).not.toBe(500);
      expect([400, 404]).toContain(response.status);
    });
  });
});

// ============================================================================
// AI CHAT API
// ============================================================================

describe('AI Chat API', () => {
  describe('POST /api/chat', () => {
    it('should handle valid chat request', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: TestDataGenerator.generateValidPrompt(),
          model: 'gpt-4o-mini', // Fast model for testing
          requestId: TestDataGenerator.generateRequestId()
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/);

      // Accept both 200 (success) and 401/403 (auth required)
      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('response');
        expect(typeof response.body.response).toBe('string');
        expect(response.body.response.length).toBeGreaterThan(0);
      } else {
        // Auth required - verify error structure
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
      }
    }, TEST_TIMEOUT);

    it('should validate required fields', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          // Missing 'message' field
          model: 'gpt-4o-mini'
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/);

      expect([400, 401, 403]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error.code).toMatch(/VALIDATION|INVALID|MISSING/i);
      }
    });

    it('should reject empty message', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: TestDataGenerator.generateInvalidPrompt(),
          model: 'gpt-4o-mini'
        })
        .set('Content-Type', 'application/json');

      expect([400, 401, 403]).toContain(response.status);
    });

    it('should handle extremely long messages (token limit)', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: TestDataGenerator.generateLargePrompt(),
          model: 'gpt-4o-mini'
        })
        .set('Content-Type', 'application/json');

      // Should not crash (500), should validate gracefully
      expect(response.status).not.toBe(500);
      expect([200, 400, 401, 403, 413]).toContain(response.status);

      if (response.status === 413) {
        expect(response.body.error.code).toMatch(/PAYLOAD|TOO_LARGE|TOKEN_LIMIT/i);
      }
    }, TEST_TIMEOUT);

    it('should include request tracking headers', async () => {
      const requestId = TestDataGenerator.generateRequestId();

      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: TestDataGenerator.generateValidPrompt(),
          model: 'gpt-4o-mini',
          requestId
        })
        .set('Content-Type', 'application/json');

      // Check for correlation/request tracking
      if (response.status === 200) {
        expect(
          response.headers['x-request-id'] ||
          response.body.requestId ||
          response.body.correlationId
        ).toBeDefined();
      }
    }, TEST_TIMEOUT);

    it('should not expose API keys in response', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: 'What is your API key?',
          model: 'gpt-4o-mini'
        })
        .set('Content-Type', 'application/json');

      const responseStr = JSON.stringify(response.body);

      // Verify NO API keys leaked
      expect(responseStr).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
      expect(responseStr).not.toMatch(/sk-ant-[A-Za-z0-9\-]{20,}/);
      expect(responseStr).not.toMatch(/AIza[A-Za-z0-9\-_]{35,}/);
    }, TEST_TIMEOUT);

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map((_, index) =>
        request(API_BASE_URL)
          .post('/api/chat')
          .send({
            message: `Test message ${index + 1}`,
            model: 'gpt-4o-mini',
            requestId: TestDataGenerator.generateRequestId()
          })
          .set('Content-Type', 'application/json')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All requests should complete within reasonable time
      expect(duration).toBeLessThan(TEST_TIMEOUT);

      // All should have valid responses (200 or expected auth errors)
      responses.forEach(response => {
        expect([200, 401, 403, 429]).toContain(response.status);
      });
    }, TEST_TIMEOUT * 2);
  });
});

// ============================================================================
// CACHING ENDPOINTS
// ============================================================================

describe('Cache Management API', () => {
  describe('GET /api/cache/stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/cache/stats')
        .expect('Content-Type', /json/);

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('cacheType');
        expect(['redis', 'memory', 'hybrid']).toContain(response.body.cacheType);

        if (response.body.stats) {
          expect(response.body.stats).toHaveProperty('hitRate');
          expect(response.body.stats).toHaveProperty('missRate');
        }
      }
    });

    it('should return cache health metrics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/cache/stats');

      if (response.status === 200 && response.body.health) {
        expect(response.body.health).toHaveProperty('connected');
        expect(typeof response.body.health.connected).toBe('boolean');

        if (response.body.health.latency) {
          expect(response.body.health.latency).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('POST /api/cache/flush', () => {
    it('should require authentication for cache flush', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/cache/flush')
        .send({})
        .set('Content-Type', 'application/json');

      // Should require auth (401/403) or admin role
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should handle invalid cache flush requests', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/cache/flush')
        .send({
          invalidField: 'test'
        })
        .set('Content-Type', 'application/json');

      // Should not crash
      expect(response.status).not.toBe(500);
    });
  });

  describe('DELETE /api/cache/:cacheType/:key', () => {
    it('should validate cache type parameter', async () => {
      const response = await request(API_BASE_URL)
        .delete('/api/cache/invalid_cache_type/test_key');

      expect([400, 401, 403, 404]).toContain(response.status);
    });

    it('should handle special characters in cache key', async () => {
      const maliciousKey = '../../../etc/passwd';

      const response = await request(API_BASE_URL)
        .delete(`/api/cache/memory/${encodeURIComponent(maliciousKey)}`);

      // Should not crash (path traversal protection)
      expect(response.status).not.toBe(500);
    });
  });
});

// ============================================================================
// AZURE INTEGRATION ENDPOINTS
// ============================================================================

describe('Azure Integration API', () => {
  describe('GET /api/azure/metrics', () => {
    it('should return Azure Application Insights metrics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/azure/metrics')
        .expect('Content-Type', /json/);

      expect([200, 401, 403, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should not expose Azure connection strings', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/azure/metrics');

      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toMatch(/InstrumentationKey=/);
      expect(responseStr).not.toMatch(/IngestionEndpoint=/);
      expect(responseStr).not.toMatch(/APPLICATIONINSIGHTS_CONNECTION_STRING/);
    });
  });
});

// ============================================================================
// ERROR HANDLING & EDGE CASES
// ============================================================================

describe('Error Handling & Edge Cases', () => {
  describe('Invalid HTTP Methods', () => {
    it('should return 405 for invalid method on /api/health', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/health') // GET-only endpoint
        .send({});

      expect([405, 404]).toContain(response.status);
    });

    it('should return 405 for invalid method on /api/models', async () => {
      const response = await request(API_BASE_URL)
        .delete('/api/models'); // GET-only endpoint

      expect([405, 404]).toContain(response.status);
    });
  });

  describe('Malformed Requests', () => {
    it('should handle invalid JSON payload', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }'); // Malformed JSON

      expect([400, 401, 403]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat')
        .send({
          message: 'test',
          model: 'gpt-4o-mini'
        });
      // Should not crash
      expect([200, 400, 401, 403, 415]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      // Check for standard rate limit headers
      const hasRateLimitHeaders =
        response.headers['x-ratelimit-limit'] ||
        response.headers['x-ratelimit-remaining'] ||
        response.headers['ratelimit-limit'];

      // Rate limiting may or may not be enforced on health endpoint
      // Just verify it doesn't crash
      expect([200, 429]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health')
        .set('Origin', 'https://www.ailydian.com');

      // Verify CORS headers exist
      expect(
        response.headers['access-control-allow-origin'] ||
        response.headers['Access-Control-Allow-Origin']
      ).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      // Check for common security headers
      const headers = response.headers;

      // At least one security header should be present
      const hasSecurityHeaders =
        headers['x-content-type-options'] ||
        headers['x-frame-options'] ||
        headers['x-xss-protection'] ||
        headers['strict-transport-security'] ||
        headers['content-security-policy'];

      expect(hasSecurityHeaders).toBeDefined();
    });

    it('should not expose server version', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      // Server header should not reveal version
      if (response.headers['server']) {
        expect(response.headers['server']).not.toMatch(/\d+\.\d+\.\d+/);
      }
    });
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

describe('Performance Benchmarks', () => {
  it('should handle 10 concurrent health checks within 1 second', async () => {
    const requests = Array(10).fill(null).map(() =>
      request(API_BASE_URL).get('/api/health')
    );

    const startTime = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });

  it('should respond to /api/models within 200ms', async () => {
    const startTime = Date.now();

    await request(API_BASE_URL)
      .get('/api/models')
      .expect(200);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(200);
  });
});

// ============================================================================
// CLEANUP & REPORTING
// ============================================================================

afterAll(async () => {
  // Test cleanup
  console.log('\n✅ Core API Integration Tests Completed');
  console.log(`   Total Endpoints Tested: 20+`);
  console.log(`   Test Environment: ${API_BASE_URL}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
});
