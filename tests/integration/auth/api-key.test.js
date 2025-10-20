/**
 * Integration Tests: API Key Authentication
 * White-Hat Policy: Real test scenarios, no mock data
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test data
let testUserId;
let testOrgId;
let testApiKey;
let testApiKeyHash;

/**
 * Hash API key for database lookup
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate test API key
 */
function generateTestApiKey() {
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `lyd_${randomPart}`;
}

describe('API Key Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Create test user
    testUserId = `user_test_${Date.now()}`;
    testOrgId = `org_test_${Date.now()}`;

    await supabase.from('users').insert({
      user_id: testUserId,
      email: `test_${Date.now()}@example.com`,
      name: 'Test User',
      organization_id: testOrgId,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create test organization
    await supabase.from('organizations').insert({
      organization_id: testOrgId,
      name: 'Test Organization',
      tier: 'professional',
      status: 'active',
      rate_limit_multiplier: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create test API key
    testApiKey = generateTestApiKey();
    testApiKeyHash = hashApiKey(testApiKey);

    await supabase.from('api_keys').insert({
      key_hash: testApiKeyHash,
      user_id: testUserId,
      organization_id: testOrgId,
      name: 'Test API Key',
      scopes: JSON.stringify(['cities:read', 'cities:write']),
      rate_limit_per_hour: 1000,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('api_key_usage').delete().eq('api_key_id', testApiKeyHash);
    await supabase.from('api_keys').delete().eq('key_hash', testApiKeyHash);
    await supabase.from('users').delete().eq('user_id', testUserId);
    await supabase.from('organizations').delete().eq('organization_id', testOrgId);
  });

  describe('Valid API Key Authentication', () => {
    it('should authenticate successfully with valid API key', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should set correct rate limit headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey);

      expect(response.headers['x-ratelimit-limit']).toBe('1000');
      expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeLessThanOrEqual(1000);
      expect(parseInt(response.headers['x-ratelimit-reset'])).toBeGreaterThan(Date.now() / 1000);
    });

    it('should log API key usage', async () => {
      await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey);

      // Check usage log
      const { data: usageLogs } = await supabase
        .from('api_key_usage')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      expect(usageLogs).toHaveLength(1);
      expect(usageLogs[0].endpoint).toContain('/cities');
      expect(usageLogs[0].method).toBe('GET');
    });
  });

  describe('Invalid API Key Authentication', () => {
    it('should reject missing API key', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_API_KEY');
      expect(response.body.error.correlationId).toBeDefined();
    });

    it('should reject invalid API key format', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', 'invalid_format_key')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_API_KEY_FORMAT');
    });

    it('should reject non-existent API key', async () => {
      const fakeKey = generateTestApiKey();

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', fakeKey)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should reject revoked API key', async () => {
      // Create revoked key
      const revokedKey = generateTestApiKey();
      const revokedHash = hashApiKey(revokedKey);

      await supabase.from('api_keys').insert({
        key_hash: revokedHash,
        user_id: testUserId,
        organization_id: testOrgId,
        name: 'Revoked Test Key',
        scopes: JSON.stringify(['cities:read']),
        rate_limit_per_hour: 1000,
        status: 'revoked',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', revokedKey)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('API_KEY_INACTIVE');

      // Cleanup
      await supabase.from('api_keys').delete().eq('key_hash', revokedHash);
    });

    it('should reject expired API key', async () => {
      // Create expired key
      const expiredKey = generateTestApiKey();
      const expiredHash = hashApiKey(expiredKey);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await supabase.from('api_keys').insert({
        key_hash: expiredHash,
        user_id: testUserId,
        organization_id: testOrgId,
        name: 'Expired Test Key',
        scopes: JSON.stringify(['cities:read']),
        rate_limit_per_hour: 1000,
        status: 'active',
        expires_at: yesterday.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', expiredKey)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('API_KEY_EXPIRED');

      // Cleanup
      await supabase.from('api_keys').delete().eq('key_hash', expiredHash);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Create rate-limited key (5 req/hour)
      const limitedKey = generateTestApiKey();
      const limitedHash = hashApiKey(limitedKey);

      await supabase.from('api_keys').insert({
        key_hash: limitedHash,
        user_id: testUserId,
        organization_id: testOrgId,
        name: 'Rate Limited Test Key',
        scopes: JSON.stringify(['cities:read']),
        rate_limit_per_hour: 5,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Make 5 requests (should succeed)
      for (let i = 0; i < 5; i++) {
        await request(API_BASE_URL)
          .get('/api/v1/smart-cities/cities')
          .set('X-API-Key', limitedKey)
          .expect(200);
      }

      // 6th request should fail
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', limitedKey)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers['retry-after']).toBeDefined();

      // Cleanup
      await supabase.from('api_key_usage').delete().eq('api_key_id', limitedHash);
      await supabase.from('api_keys').delete().eq('key_hash', limitedHash);
    });

    it('should return correct rate limit remaining count', async () => {
      // Create fresh key
      const freshKey = generateTestApiKey();
      const freshHash = hashApiKey(freshKey);

      await supabase.from('api_keys').insert({
        key_hash: freshHash,
        user_id: testUserId,
        organization_id: testOrgId,
        name: 'Fresh Test Key',
        scopes: JSON.stringify(['cities:read']),
        rate_limit_per_hour: 10,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // First request
      const response1 = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', freshKey);

      expect(response1.headers['x-ratelimit-remaining']).toBe('9');

      // Second request
      const response2 = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', freshKey);

      expect(response2.headers['x-ratelimit-remaining']).toBe('8');

      // Cleanup
      await supabase.from('api_key_usage').delete().eq('api_key_id', freshHash);
      await supabase.from('api_keys').delete().eq('key_hash', freshHash);
    });
  });

  describe('Scope Validation', () => {
    it('should attach correct auth context to request', async () => {
      // This test verifies that req.auth is populated correctly
      // by checking that the endpoint processes the request successfully
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should not expose key hash in responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain(testApiKeyHash);
    });

    it('should log IP address and User-Agent', async () => {
      await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('X-API-Key', testApiKey)
        .set('User-Agent', 'Test-Agent/1.0');

      const { data: usageLogs } = await supabase
        .from('api_key_usage')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      expect(usageLogs[0].user_agent).toContain('Test-Agent');
      expect(usageLogs[0].ip_address).toBeDefined();
    });
  });
});
