/**
 * 🔐 AUTHENTICATION SERVICE
 * Extracted from server.js as part of microservices architecture
 *
 * Responsibilities:
 * - JWT authentication and token management
 * - OAuth 2.0 (Google, Microsoft, GitHub, Apple)
 * - Session management
 * - Role-based access control (RBAC)
 * - Multi-tenant isolation
 * - API key generation and validation
 *
 * Dependencies:
 * - JWT (jsonwebtoken)
 * - OAuth providers
 * - Winston (logging)
 *
 * Endpoints:
 * - OAuth Authentication:
 *   GET  /api/auth/google - Google OAuth
 *   GET  /api/auth/google/callback - Google callback
 *   GET  /api/auth/microsoft - Microsoft OAuth
 *   GET  /api/auth/microsoft/callback - Microsoft callback
 *   GET  /api/auth/github - GitHub OAuth
 *   GET  /api/auth/github/callback - GitHub callback
 *   GET  /api/auth/apple - Apple OAuth
 *   POST /api/auth/apple/callback - Apple callback
 *
 * - JWT Authentication:
 *   POST /api/auth/login - Login with credentials
 *   POST /api/auth/register - Register new user
 *   POST /api/auth/refresh - Refresh access token
 *   POST /api/auth/logout - Logout
 *   GET  /api/auth/verify - Verify token
 *
 * - Utilities:
 *   POST /api/auth/check-email - Check if email exists
 *   POST /api/auth/generate-api-key - Generate API key
 */

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../lib/logger/production-logger');

// Import existing middleware
const {
  generateToken: jwtGenerateToken,
  verifyToken: jwtVerifyToken,
  generateApiKey,
  ROLES,
  RATE_LIMITS
} = require('../middleware/api-auth');

class AuthService {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.AUTH_PORT || 3102,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
      jwtExpiry: config.jwtExpiry || process.env.JWT_EXPIRY || '24h',
      enableOAuth: config.enableOAuth !== false,
      ...config
    };

    // Validate JWT secret
    this.validateJwtSecret();

    // In-memory storage (replace with database in production)
    this.users = new Map();
    this.sessions = new Map();
    this.oauthStates = new Map();

    // OAuth Configuration
    this.oauthConfigs = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3102/api/auth/google/callback',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid email profile'
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3102/api/auth/microsoft/callback',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid email profile User.Read'
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3102/api/auth/github/callback',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        emailUrl: 'https://api.github.com/user/emails',
        scope: 'read:user user:email'
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:3102/api/auth/apple/callback',
        authUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        scope: 'name email'
      }
    };

    this.app = express();
    this.startTime = new Date().toISOString();

    this.init();
  }

  validateJwtSecret() {
    if (!this.config.jwtSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '❌ FATAL SECURITY ERROR: JWT_SECRET environment variable is required in production.'
        );
      }
      logger.warn('⚠️  WARNING: JWT_SECRET not set. Using temporary secret for DEVELOPMENT only.');
      this.config.jwtSecret = crypto.randomBytes(64).toString('hex');
    }

    if (this.config.jwtSecret.length < 32) {
      throw new Error('❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters long.');
    }
  }

  init() {
    logger.info('🔐 Initializing Auth Service...');

    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.request(req, { duration_ms: duration, statusCode: res.statusCode });
      });
      next();
    });

    // Setup routes
    this.setupRoutes();

    // Error handlers
    this.setupErrorHandlers();

    logger.info('✅ Auth Service initialized');
  }

  setupRoutes() {
    // ========================================
    // OAuth Routes
    // ========================================

    if (this.config.enableOAuth) {
      // Google OAuth
      this.app.get('/api/auth/google', this.handleGoogleAuth.bind(this));
      this.app.get('/api/auth/google/callback', this.handleGoogleCallback.bind(this));

      // Microsoft OAuth
      this.app.get('/api/auth/microsoft', this.handleMicrosoftAuth.bind(this));
      this.app.get('/api/auth/microsoft/callback', this.handleMicrosoftCallback.bind(this));

      // GitHub OAuth
      this.app.get('/api/auth/github', this.handleGithubAuth.bind(this));
      this.app.get('/api/auth/github/callback', this.handleGithubCallback.bind(this));

      // Apple OAuth
      this.app.get('/api/auth/apple', this.handleAppleAuth.bind(this));
      this.app.post('/api/auth/apple/callback', this.handleAppleCallback.bind(this));
    }

    // ========================================
    // JWT Authentication Routes
    // ========================================

    this.app.post('/api/auth/login', this.handleLogin.bind(this));
    this.app.post('/api/auth/register', this.handleRegister.bind(this));
    this.app.post('/api/auth/refresh', this.handleRefresh.bind(this));
    this.app.post('/api/auth/logout', this.handleLogout.bind(this));
    this.app.get('/api/auth/verify', this.handleVerify.bind(this));

    // ========================================
    // Utility Routes
    // ========================================

    this.app.post('/api/auth/check-email', this.handleCheckEmail.bind(this));
    this.app.post('/api/auth/generate-api-key', this.handleGenerateApiKey.bind(this));

    // Service info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'auth-service',
        version: '1.0.0',
        description: 'Authentication and authorization service',
        endpoints: {
          oauth: this.config.enableOAuth ? {
            google: 'GET /api/auth/google',
            microsoft: 'GET /api/auth/microsoft',
            github: 'GET /api/auth/github',
            apple: 'GET /api/auth/apple'
          } : 'disabled',
          jwt: {
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            verify: 'GET /api/auth/verify'
          },
          utilities: {
            checkEmail: 'POST /api/auth/check-email',
            generateApiKey: 'POST /api/auth/generate-api-key'
          }
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
  }

  // ========================================
  // OAuth Handlers
  // ========================================

  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  createOrUpdateUser(profile, provider) {
    const userId = `${provider}_${profile.id || profile.sub}`;

    let user = this.users.get(userId);

    if (!user) {
      user = {
        id: userId,
        email: profile.email,
        name: profile.name || profile.displayName || profile.login,
        avatar: profile.picture || profile.avatar_url,
        provider: provider,
        role: 'USER',
        tenantId: 'default',
        permissions: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };
      this.users.set(userId, user);
      logger.info('New user created', { userId, email: profile.email, provider });
    } else {
      user.lastLogin = new Date();
      user.name = profile.name || user.name;
      user.avatar = profile.picture || profile.avatar_url || user.avatar;
      logger.info('User logged in', { userId, provider });
    }

    return user;
  }

  async handleGoogleAuth(req, res) {
    if (!this.oauthConfigs.google.clientId) {
      return res.status(503).json({
        success: false,
        error: 'Google OAuth not configured'
      });
    }

    const state = this.generateState();
    this.oauthStates.set(state, { provider: 'google', timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: this.oauthConfigs.google.clientId,
      redirect_uri: this.oauthConfigs.google.redirectUri,
      response_type: 'code',
      scope: this.oauthConfigs.google.scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    res.redirect(`${this.oauthConfigs.google.authUrl}?${params.toString()}`);
  }

  async handleGoogleCallback(req, res) {
    const { code, state } = req.query;

    if (!state || !this.oauthStates.has(state)) {
      return res.status(400).json({ success: false, message: 'Invalid state parameter' });
    }

    this.oauthStates.delete(state);

    try {
      const tokenResponse = await axios.post(this.oauthConfigs.google.tokenUrl, {
        code,
        client_id: this.oauthConfigs.google.clientId,
        client_secret: this.oauthConfigs.google.clientSecret,
        redirect_uri: this.oauthConfigs.google.redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get(this.oauthConfigs.google.userInfoUrl, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const user = this.createOrUpdateUser(userResponse.data, 'google');
      const token = jwtGenerateToken(user);

      res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
    } catch (error) {
      logger.error('Google OAuth error', { error });
      res.redirect('/auth.html?error=google_auth_failed');
    }
  }

  async handleMicrosoftAuth(req, res) {
    if (!this.oauthConfigs.microsoft.clientId) {
      return res.status(503).json({
        success: false,
        error: 'Microsoft OAuth not configured'
      });
    }

    const state = this.generateState();
    this.oauthStates.set(state, { provider: 'microsoft', timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: this.oauthConfigs.microsoft.clientId,
      redirect_uri: this.oauthConfigs.microsoft.redirectUri,
      response_type: 'code',
      scope: this.oauthConfigs.microsoft.scope,
      state: state,
      response_mode: 'query'
    });

    res.redirect(`${this.oauthConfigs.microsoft.authUrl}?${params.toString()}`);
  }

  async handleMicrosoftCallback(req, res) {
    const { code, state } = req.query;

    if (!state || !this.oauthStates.has(state)) {
      return res.status(400).json({ success: false, message: 'Invalid state parameter' });
    }

    this.oauthStates.delete(state);

    try {
      const tokenResponse = await axios.post(
        this.oauthConfigs.microsoft.tokenUrl,
        new URLSearchParams({
          code,
          client_id: this.oauthConfigs.microsoft.clientId,
          client_secret: this.oauthConfigs.microsoft.clientSecret,
          redirect_uri: this.oauthConfigs.microsoft.redirectUri,
          grant_type: 'authorization_code'
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get(this.oauthConfigs.microsoft.userInfoUrl, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const profile = {
        id: userResponse.data.id,
        email: userResponse.data.mail || userResponse.data.userPrincipalName,
        name: userResponse.data.displayName,
        picture: null
      };

      const user = this.createOrUpdateUser(profile, 'microsoft');
      const token = jwtGenerateToken(user);

      res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
    } catch (error) {
      logger.error('Microsoft OAuth error', { error });
      res.redirect('/auth.html?error=microsoft_auth_failed');
    }
  }

  async handleGithubAuth(req, res) {
    if (!this.oauthConfigs.github.clientId) {
      return res.status(503).json({
        success: false,
        error: 'GitHub OAuth not configured'
      });
    }

    const state = this.generateState();
    this.oauthStates.set(state, { provider: 'github', timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: this.oauthConfigs.github.clientId,
      redirect_uri: this.oauthConfigs.github.redirectUri,
      scope: this.oauthConfigs.github.scope,
      state: state,
      allow_signup: 'true'
    });

    res.redirect(`${this.oauthConfigs.github.authUrl}?${params.toString()}`);
  }

  async handleGithubCallback(req, res) {
    const { code, state } = req.query;

    if (!state || !this.oauthStates.has(state)) {
      return res.status(400).json({ success: false, message: 'Invalid state parameter' });
    }

    this.oauthStates.delete(state);

    try {
      const tokenResponse = await axios.post(
        this.oauthConfigs.github.tokenUrl,
        {
          code,
          client_id: this.oauthConfigs.github.clientId,
          client_secret: this.oauthConfigs.github.clientSecret,
          redirect_uri: this.oauthConfigs.github.redirectUri
        },
        { headers: { Accept: 'application/json' } }
      );

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get(this.oauthConfigs.github.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json'
        }
      });

      let email = userResponse.data.email;
      if (!email) {
        const emailResponse = await axios.get(this.oauthConfigs.github.emailUrl, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
          }
        });
        const primaryEmail = emailResponse.data.find(e => e.primary);
        email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
      }

      const profile = {
        id: userResponse.data.id,
        email: email,
        name: userResponse.data.name || userResponse.data.login,
        login: userResponse.data.login,
        avatar_url: userResponse.data.avatar_url
      };

      const user = this.createOrUpdateUser(profile, 'github');
      const token = jwtGenerateToken(user);

      res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(user.name)}`);
    } catch (error) {
      logger.error('GitHub OAuth error', { error });
      res.redirect('/auth.html?error=github_auth_failed');
    }
  }

  async handleAppleAuth(req, res) {
    if (!this.oauthConfigs.apple.clientId) {
      return res.status(503).json({
        success: false,
        error: 'Apple OAuth not configured'
      });
    }

    const state = this.generateState();
    this.oauthStates.set(state, { provider: 'apple', timestamp: Date.now() });

    const params = new URLSearchParams({
      client_id: this.oauthConfigs.apple.clientId,
      redirect_uri: this.oauthConfigs.apple.redirectUri,
      response_type: 'code id_token',
      response_mode: 'form_post',
      scope: this.oauthConfigs.apple.scope,
      state: state
    });

    res.redirect(`${this.oauthConfigs.apple.authUrl}?${params.toString()}`);
  }

  async handleAppleCallback(req, res) {
    const { code, state, id_token, user } = req.body;

    if (!state || !this.oauthStates.has(state)) {
      return res.status(400).json({ success: false, message: 'Invalid state parameter' });
    }

    this.oauthStates.delete(state);

    try {
      const decodedToken = jwt.decode(id_token);

      let profile = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.email
      };

      if (user) {
        const userData = JSON.parse(user);
        profile.name = `${userData.name.firstName} ${userData.name.lastName}`;
      }

      const createdUser = this.createOrUpdateUser(profile, 'apple');
      const token = jwtGenerateToken(createdUser);

      res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(createdUser.name)}`);
    } catch (error) {
      logger.error('Apple OAuth error', { error });
      res.redirect('/auth.html?error=apple_auth_failed');
    }
  }

  // ========================================
  // JWT Authentication Handlers
  // ========================================

  async handleLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // TODO: Implement actual password verification with database
    // This is a placeholder implementation
    const user = Array.from(this.users.values()).find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = jwtGenerateToken(user);
    const refreshToken = jwtGenerateToken(user, { expiresIn: '7d' });

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      success: true,
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  async handleRegister(req, res) {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name required'
      });
    }

    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // TODO: Hash password with bcrypt before storing
    const userId = `local_${crypto.randomUUID()}`;
    const user = {
      id: userId,
      email,
      name,
      provider: 'local',
      role: 'USER',
      tenantId: 'default',
      permissions: [],
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(userId, user);

    const token = jwtGenerateToken(user);
    const refreshToken = jwtGenerateToken(user, { expiresIn: '7d' });

    logger.info('New user registered', { userId, email });

    res.status(201).json({
      success: true,
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  async handleRefresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    try {
      const decoded = jwtVerifyToken(refreshToken);
      const user = this.users.get(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const newToken = jwtGenerateToken(user, { expiresIn: '1h' });

      res.json({
        success: true,
        accessToken: newToken,
        expiresIn: 3600,
        tokenType: 'Bearer'
      });
    } catch (error) {
      logger.warn('Token refresh failed', { error: error.message });
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error.message
      });
    }
  }

  async handleLogout(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      this.sessions.delete(token);
      logger.info('User logged out');
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  async handleVerify(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      const decoded = jwtVerifyToken(token);
      const user = this.users.get(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            provider: user.provider
          }
        }
      });
    } catch (error) {
      logger.warn('Token verification failed', { error: error.message });
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }

  // ========================================
  // Utility Handlers
  // ========================================

  async handleCheckEmail(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required'
      });
    }

    const existingUser = Array.from(this.users.values()).find(u => u.email === email);

    res.json({
      success: true,
      exists: !!existingUser,
      provider: existingUser?.provider
    });
  }

  async handleGenerateApiKey(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    try {
      const decoded = jwtVerifyToken(token);
      const user = this.users.get(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const apiKey = generateApiKey();

      logger.info('API key generated', { userId: user.id });

      res.json({
        success: true,
        apiKey: apiKey,
        message: 'API key generated successfully. Store it securely - it will not be shown again.'
      });
    } catch (error) {
      logger.error('API key generation failed', { error });
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  setupErrorHandlers() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        service: 'auth-service'
      });
    });

    // General error handler
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, _next) => {
      logger.error('Unhandled error in auth service', {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack
        },
        request: {
          method: req.method,
          path: req.path,
          query: req.query
        }
      });

      res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        service: 'auth-service'
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          logger.info(`🔐 Auth Service started on port ${this.config.port}`);
          logger.info(`📊 OAuth Status: ${this.config.enableOAuth ? 'Enabled' : 'Disabled'}`);
          logger.info(`🔑 JWT Expiry: ${this.config.jwtExpiry}`);
          resolve(this.server);
        });

        this.server.on('error', (error) => {
          logger.error('Failed to start auth service', { error });
          reject(error);
        });

      } catch (error) {
        logger.error('Error starting auth service', { error });
        reject(error);
      }
    });
  }

  async stop() {
    logger.info('🛑 Stopping auth service...');

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('✅ Auth service stopped');
          resolve();
        });
      });
    }
  }

  // Expose Express app for integration with main server
  getApp() {
    return this.app;
  }

  // Expose user store for testing
  getUsers() {
    return this.users;
  }
}

// Export for both standalone and integrated use
module.exports = AuthService;

// Standalone mode - start service if run directly
if (require.main === module) {
  const service = new AuthService();
  service.start().catch((error) => {
    logger.error('Failed to start auth service', { error });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });
}
