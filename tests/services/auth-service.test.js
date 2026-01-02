/**
 * Auth Service Tests
 * Tests for the extracted authentication microservice
 */

const request = require('supertest');
const AuthService = require('../../services/auth-service');

describe('Auth Service', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with test configuration
    service = new AuthService({
      port: 0, // Random port for testing
      jwtSecret: 'test-secret-key-for-testing-only-minimum-32-characters-long',
      jwtExpiry: '1h',
      enableOAuth: false // Disable OAuth for basic tests
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Service Information', () => {
    it('should return service info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('jwt');
      expect(response.body.endpoints).toHaveProperty('utilities');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).toHaveProperty('role', 'USER');
    });

    it('should reject registration without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Another User'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login Test User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
    });

    it('should reject login without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/verify', () => {
    let token;

    beforeAll(async () => {
      // Register and login to get a token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'verify@example.com',
          password: 'password123',
          name: 'Verify Test User'
        });

      token = response.body.accessToken;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('email', 'verify@example.com');
    });

    it('should reject verification without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'password123',
          name: 'Refresh Test User'
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn', 3600);
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Refresh token required');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'password123',
          name: 'Logout Test User'
        });

      token = response.body.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should allow logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/auth/check-email', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        });
    });

    it('should return true for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/check-email')
        .send({
          email: 'existing@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('exists', true);
      expect(response.body).toHaveProperty('provider', 'local');
    });

    it('should return false for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/check-email')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('exists', false);
    });

    it('should reject without email', async () => {
      const response = await request(app)
        .post('/api/auth/check-email')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/generate-api-key', () => {
    let token;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'apikey@example.com',
          password: 'password123',
          name: 'API Key Test User'
        });

      token = response.body.accessToken;
    });

    it('should generate API key for authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/generate-api-key')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toHaveLength(64);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject API key generation without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/generate-api-key')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/auth/unknown-endpoint');
    });
  });

  describe('Service Management', () => {
    it('should start and stop service', async () => {
      const testService = new AuthService({
        port: 0,
        jwtSecret: 'test-secret-key-for-testing-only-minimum-32-characters-long',
        enableOAuth: false
      });

      const server = await testService.start();
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);

      await testService.stop();
      expect(server.listening).toBe(false);
    });

    it('should provide access to Express app', () => {
      const testService = new AuthService({
        jwtSecret: 'test-secret-key-for-testing-only-minimum-32-characters-long',
        enableOAuth: false
      });

      const app = testService.getApp();
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });

    it('should throw error with short JWT secret', () => {
      expect(() => {
        new AuthService({
          jwtSecret: 'short',
          enableOAuth: false
        });
      }).toThrow('JWT_SECRET must be at least 32 characters long');
    });
  });
});

describe('Auth Service with OAuth', () => {
  let service;
  let app;

  beforeAll(async () => {
    service = new AuthService({
      port: 0,
      jwtSecret: 'test-secret-key-for-testing-only-minimum-32-characters-long',
      enableOAuth: true // Enable OAuth for these tests
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('OAuth Endpoints', () => {
    it('should have OAuth endpoints in service info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.endpoints).toHaveProperty('oauth');
      expect(response.body.endpoints.oauth).toHaveProperty('google');
      expect(response.body.endpoints.oauth).toHaveProperty('microsoft');
      expect(response.body.endpoints.oauth).toHaveProperty('github');
      expect(response.body.endpoints.oauth).toHaveProperty('apple');
    });

    it('should return error when OAuth not configured (Google)', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not configured');
    });

    it('should return error when OAuth not configured (Microsoft)', async () => {
      const response = await request(app)
        .get('/api/auth/microsoft')
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not configured');
    });

    it('should return error when OAuth not configured (GitHub)', async () => {
      const response = await request(app)
        .get('/api/auth/github')
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not configured');
    });

    it('should return error when OAuth not configured (Apple)', async () => {
      const response = await request(app)
        .get('/api/auth/apple')
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not configured');
    });
  });
});
