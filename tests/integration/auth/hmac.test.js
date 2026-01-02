/**
 * Integration Tests: HMAC Signature Authentication
 * White-Hat Policy: Real test scenarios, no mock data
 */

const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { nanoid } = require('nanoid');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test data
let testUserId;
let testOrgId;
let testKeyId;
let testSecret;

/**
 * Calculate HMAC signature for a request
 */
function calculateSignature(method, path, timestamp, body, secret) {
  const bodyString = body ? JSON.stringify(body) : '';
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
  const canonical = `${method}\n${path}\n${timestamp}\n${bodyHash}`;
  const signature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return `sha256=${signature}`;
}

describe('HMAC Signature Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Create test user
    testUserId = `user_hmac_${Date.now()}`;
    testOrgId = `org_hmac_${Date.now()}`;

    await supabase.from('users').insert({
      user_id: testUserId,
      email: `hmac_test_${Date.now()}@example.com`,
      name: 'HMAC Test User',
      organization_id: testOrgId,
      role: 'developer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create test organization
    await supabase.from('organizations').insert({
      organization_id: testOrgId,
      name: 'HMAC Test Organization',
      tier: 'enterprise',
      status: 'active',
      rate_limit_multiplier: 2.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create test HMAC key
    testKeyId = `hmac_${nanoid(24)}`;
    testSecret = crypto.randomBytes(32).toString('hex');

    await supabase.from('hmac_keys').insert({
      key_id: testKeyId,
      secret: testSecret,
      user_id: testUserId,
      organization_id: testOrgId,
      name: 'Test HMAC Key',
      scopes: JSON.stringify(['cities:read', 'cities:write', 'signals:write']),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('hmac_signatures_used').delete().match({ key_id: testKeyId });
    await supabase.from('hmac_key_usage').delete().match({ key_id: testKeyId });
    await supabase.from('hmac_keys').delete().eq('key_id', testKeyId);
    await supabase.from('users').delete().eq('user_id', testUserId);
    await supabase.from('organizations').delete().eq('organization_id', testOrgId);
  });

  describe('Valid HMAC Authentication', () => {
    it('should authenticate successfully with valid HMAC signature (GET)', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should authenticate successfully with valid HMAC signature (POST)', async () => {
      const method = 'POST';
      const path = '/api/v1/lydian-iq/signals';
      const timestamp = Math.floor(Date.now() / 1000);
      const body = {
        signalType: 'test_signal',
        source: 'integration_test',
        payload: { test: true },
      };
      const signature = calculateSignature(method, path, timestamp, body, testSecret);

      const response = await request(API_BASE_URL)
        .post(path)
        .set('Content-Type', 'application/json')
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .send(body)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.signalId).toBeDefined();
    });

    it('should log HMAC key usage', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId);

      // Check usage log
      const { data: usageLogs } = await supabase
        .from('hmac_key_usage')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      expect(usageLogs).toHaveLength(1);
      expect(usageLogs[0].endpoint).toContain('/cities');
      expect(usageLogs[0].method).toBe('GET');
    });
  });

  describe('Invalid HMAC Authentication', () => {
    it('should reject missing HMAC headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_HMAC_HEADERS');
      expect(response.body.error.correlationId).toBeDefined();
    });

    it('should reject missing X-HMAC-Signature header', async () => {
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_HMAC_HEADERS');
    });

    it('should reject unsupported algorithm', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA512') // Wrong algorithm
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('UNSUPPORTED_ALGORITHM');
    });

    it('should reject invalid key ID', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', 'hmac_nonexistent_key')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_KEY_ID');
    });

    it('should reject invalid signature', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const wrongSignature = 'sha256=' + crypto.randomBytes(32).toString('hex');

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', wrongSignature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    });

    it('should reject signature with wrong secret', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const wrongSecret = crypto.randomBytes(32).toString('hex');
      const signature = calculateSignature(method, path, timestamp, null, wrongSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    });
  });

  describe('Timestamp Validation', () => {
    it('should reject timestamp older than 5 minutes', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000) - 301; // 301 seconds ago
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('TIMESTAMP_OUT_OF_RANGE');
    });

    it('should reject timestamp from the future (> 5 minutes)', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000) + 301; // 301 seconds in future
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('TIMESTAMP_OUT_OF_RANGE');
    });

    it('should accept timestamp within 5-minute window', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000) - 290; // 290 seconds ago (within window)
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject reused signature', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      // First request should succeed
      await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(200);

      // Second request with same signature should fail
      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('REPLAY_ATTACK_DETECTED');
    });

    it('should store used signatures in database', async () => {
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, testSecret);

      await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId);

      // Check signature was stored
      const signatureId = `${testKeyId}:${timestamp}:${signature.substring(7, 23)}`;
      const { data } = await supabase
        .from('hmac_signatures_used')
        .select('*')
        .eq('signature_id', signatureId)
        .single();

      expect(data).toBeDefined();
      expect(data.key_id).toBe(testKeyId);
    });
  });

  describe('Body Hashing', () => {
    it('should validate signature with request body', async () => {
      const method = 'POST';
      const path = '/api/v1/lydian-iq/signals';
      const timestamp = Math.floor(Date.now() / 1000);
      const body = {
        signalType: 'market_event',
        source: 'test',
        payload: { price: 100 },
      };
      const signature = calculateSignature(method, path, timestamp, body, testSecret);

      const response = await request(API_BASE_URL)
        .post(path)
        .set('Content-Type', 'application/json')
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .send(body)
        .expect(201);

      expect(response.body.signalId).toBeDefined();
    });

    it('should reject signature if body is modified', async () => {
      const method = 'POST';
      const path = '/api/v1/lydian-iq/signals';
      const timestamp = Math.floor(Date.now() / 1000);
      const originalBody = {
        signalType: 'market_event',
        source: 'test',
        payload: { price: 100 },
      };
      const modifiedBody = {
        signalType: 'market_event',
        source: 'test',
        payload: { price: 200 }, // Modified
      };

      // Calculate signature with original body
      const signature = calculateSignature(method, path, timestamp, originalBody, testSecret);

      // Send modified body
      const response = await request(API_BASE_URL)
        .post(path)
        .set('Content-Type', 'application/json')
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .send(modifiedBody)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    });
  });

  describe('Key Status Validation', () => {
    it('should reject inactive key', async () => {
      // Create inactive key
      const inactiveKeyId = `hmac_inactive_${nanoid(24)}`;
      const inactiveSecret = crypto.randomBytes(32).toString('hex');

      await supabase.from('hmac_keys').insert({
        key_id: inactiveKeyId,
        secret: inactiveSecret,
        user_id: testUserId,
        organization_id: testOrgId,
        name: 'Inactive HMAC Key',
        scopes: JSON.stringify(['cities:read']),
        status: 'revoked',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = calculateSignature(method, path, timestamp, null, inactiveSecret);

      const response = await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', signature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', inactiveKeyId)
        .expect(401);

      expect(response.body.error.code).toBe('HMAC_KEY_INACTIVE');

      // Cleanup
      await supabase.from('hmac_keys').delete().eq('key_id', inactiveKeyId);
    });
  });

  describe('Security', () => {
    it('should use timing-safe comparison', async () => {
      // This test verifies timing-safe comparison by ensuring
      // response time doesn't leak information about signature correctness
      const method = 'GET';
      const path = '/api/v1/smart-cities/cities';
      const timestamp = Math.floor(Date.now() / 1000);

      const validSignature = calculateSignature(method, path, timestamp, null, testSecret);
      const invalidSignature = 'sha256=' + crypto.randomBytes(32).toString('hex');

      // Both requests should take similar time
      const start1 = Date.now();
      await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', validSignature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(API_BASE_URL)
        .get(path)
        .set('X-HMAC-Signature', invalidSignature)
        .set('X-HMAC-Timestamp', timestamp.toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId);
      const time2 = Date.now() - start2;

      // Timing should be similar (within 50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });

    it('should not expose secret in error messages', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-HMAC-Signature', 'sha256=invalid')
        .set('X-HMAC-Timestamp', Math.floor(Date.now() / 1000).toString())
        .set('X-HMAC-Algorithm', 'HMAC-SHA256')
        .set('X-HMAC-Key-ID', testKeyId)
        .expect(401);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain(testSecret);
    });
  });
});
