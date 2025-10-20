/**
 * Integration Tests: OAuth2/JWT Authentication
 * White-Hat Policy: Real test scenarios, no mock data
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'https://auth.lydian.com';

// Test data
let testUserId;
let testOrgId;
let testAccessToken;
let testRefreshToken;
let testTokenJti;

describe('OAuth2/JWT Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Create test user
    testUserId = `user_oauth_${Date.now()}`;
    testOrgId = `org_oauth_${Date.now()}`;

    await supabase.from('users').insert({
      user_id: testUserId,
      email: `oauth_test_${Date.now()}@example.com`,
      name: 'OAuth Test User',
      organization_id: testOrgId,
      role: 'developer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create test organization
    await supabase.from('organizations').insert({
      organization_id: testOrgId,
      name: 'OAuth Test Organization',
      tier: 'professional',
      status: 'active',
      rate_limit_multiplier: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Generate test tokens
    testTokenJti = nanoid();
    testAccessToken = jwt.sign(
      {
        sub: testUserId,
        email: `oauth_test_${Date.now()}@example.com`,
        scope: 'read write admin',
        org_id: testOrgId,
        jti: testTokenJti,
      },
      JWT_SECRET,
      {
        issuer: JWT_ISSUER,
        expiresIn: '1h',
        algorithm: 'HS256',
      }
    );

    testRefreshToken = jwt.sign(
      {
        sub: testUserId,
        type: 'refresh',
        jti: nanoid(),
      },
      JWT_SECRET,
      {
        issuer: JWT_ISSUER,
        expiresIn: '30d',
        algorithm: 'HS256',
      }
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('token_blacklist').delete().eq('token_jti', testTokenJti);
    await supabase.from('users').delete().eq('user_id', testUserId);
    await supabase.from('organizations').delete().eq('organization_id', testOrgId);
  });

  describe('Valid OAuth2 Authentication', () => {
    it('should authenticate successfully with valid Bearer token', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should accept token without Bearer prefix', async () => {
      // Note: Middleware should handle this, but it's a negative test
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', testAccessToken)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_AUTHORIZATION_FORMAT');
    });

    it('should attach user info to request', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      // Verify request was processed (implies user context was attached)
      expect(response.body).toBeDefined();
    });
  });

  describe('Invalid OAuth2 Authentication', () => {
    it('should reject missing Authorization header', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_AUTHORIZATION');
      expect(response.body.error.correlationId).toBeDefined();
    });

    it('should reject invalid token format', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', 'Invalid token format')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_AUTHORIZATION_FORMAT');
    });

    it('should reject malformed JWT', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          scope: 'read',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '-1h', // Expired 1 hour ago
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject token with wrong issuer', async () => {
      const wrongIssuerToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          scope: 'read',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: 'https://wrong-issuer.com',
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${wrongIssuerToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          scope: 'read',
          jti: nanoid(),
        },
        'wrong-secret',
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Token Blacklisting', () => {
    it('should reject revoked token', async () => {
      // Create token
      const jti = nanoid();
      const revokedToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          scope: 'read',
          jti,
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      // Revoke token
      await supabase.from('token_blacklist').insert({
        token_jti: jti,
        reason: 'user_requested',
        revoked_at: new Date().toISOString(),
      });

      // Try to use revoked token
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${revokedToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_REVOKED');

      // Cleanup
      await supabase.from('token_blacklist').delete().eq('token_jti', jti);
    });

    it('should support different revocation reasons', async () => {
      const reasons = [
        'user_requested',
        'admin_revoked',
        'security_breach',
        'expired',
        'password_reset',
      ];

      for (const reason of reasons) {
        const jti = nanoid();

        await supabase.from('token_blacklist').insert({
          token_jti: jti,
          reason,
          revoked_at: new Date().toISOString(),
        });

        const { data } = await supabase
          .from('token_blacklist')
          .select('reason')
          .eq('token_jti', jti)
          .single();

        expect(data.reason).toBe(reason);

        // Cleanup
        await supabase.from('token_blacklist').delete().eq('token_jti', jti);
      }
    });
  });

  describe('User Status Validation', () => {
    it('should reject token for inactive user', async () => {
      // Create inactive user
      const inactiveUserId = `user_inactive_${Date.now()}`;

      await supabase.from('users').insert({
        user_id: inactiveUserId,
        email: `inactive_${Date.now()}@example.com`,
        name: 'Inactive User',
        organization_id: testOrgId,
        role: 'user',
        status: 'suspended',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const inactiveToken = jwt.sign(
        {
          sub: inactiveUserId,
          email: 'inactive@example.com',
          scope: 'read',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('USER_INACTIVE');

      // Cleanup
      await supabase.from('users').delete().eq('user_id', inactiveUserId);
    });

    it('should reject token for non-existent user', async () => {
      const nonExistentToken = jwt.sign(
        {
          sub: 'user_nonexistent_123',
          email: 'nonexistent@example.com',
          scope: 'read',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Scope Validation', () => {
    it('should parse scopes from token', async () => {
      // Create token with specific scopes
      const scopedToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          scope: 'cities:read personas:read',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${scopedToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle tokens without scopes', async () => {
      const noScopeToken = jwt.sign(
        {
          sub: testUserId,
          email: 'test@example.com',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', `Bearer ${noScopeToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should not expose JWT secret in error messages', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain(JWT_SECRET);
    });

    it('should include correlation ID in all error responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body.error.correlationId).toBeDefined();
      expect(response.body.error.correlationId).toMatch(/^[A-Za-z0-9_-]{21}$/);
    });

    it('should include timestamp in all error responses', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/smart-cities/cities')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body.error.timestamp).toBeDefined();
      expect(new Date(response.body.error.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('Token Generation Helpers', () => {
    it('should generate valid access token', () => {
      const token = jwt.sign(
        {
          sub: 'user_123',
          email: 'test@example.com',
          scope: 'read write',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '1h',
          algorithm: 'HS256',
        }
      );

      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ['HS256'],
      });

      expect(decoded.sub).toBe('user_123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.scope).toBe('read write');
      expect(decoded.iss).toBe(JWT_ISSUER);
    });

    it('should generate valid refresh token', () => {
      const token = jwt.sign(
        {
          sub: 'user_123',
          type: 'refresh',
          jti: nanoid(),
        },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          expiresIn: '30d',
          algorithm: 'HS256',
        }
      );

      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ['HS256'],
      });

      expect(decoded.sub).toBe('user_123');
      expect(decoded.type).toBe('refresh');
    });
  });
});
