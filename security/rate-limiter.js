/**
 * 🛡️ ENTERPRISE RATE LIMITER - DDoS Protection
 * =============================================
 *
 * Multi-layered rate limiting for SOC 2 & HIPAA compliance
 *
 * Features:
 * - Sliding Window Rate Limiting
 * - IP-based throttling
 * - User-based throttling
 * - Endpoint-specific limits
 * - Distributed rate limiting (Redis-ready)
 * - Automatic ban system
 * - Whitelist support
 * - Analytics & monitoring
 *
 * Protection against:
 * - DDoS attacks
 * - Brute force attacks
 * - API abuse
 * - Resource exhaustion
 */

const soc2 = require('./soc2-compliance');

class RateLimiter {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      // Global limits
      globalLimit: options.globalLimit || 100, // requests per window
      globalWindow: options.globalWindow || 60000, // 1 minute

      // IP-based limits
      ipLimit: options.ipLimit || 60,
      ipWindow: options.ipWindow || 60000,

      // User-based limits
      userLimit: options.userLimit || 200,
      userWindow: options.userWindow || 60000,

      // Endpoint-specific limits
      endpointLimits: options.endpointLimits || {
        '/api/auth/login': { limit: 5, window: 300000 }, // 5 per 5 min
        '/api/auth/register': { limit: 3, window: 3600000 }, // 3 per hour
        '/api/unified-ai': { limit: 30, window: 60000 }, // 30 per min
        '/api/medical/*': { limit: 20, window: 60000 }, // 20 per min
        '/api/rag': { limit: 10, window: 60000 }, // 10 per min
        '/api/telemetry/*': { limit: 100, window: 60000 } // 100 per min
      },

      // Ban configuration
      banThreshold: options.banThreshold || 10, // violations before ban
      banDuration: options.banDuration || 3600000, // 1 hour

      // Whitelist
      whitelist: options.whitelist || ['127.0.0.1', '::1'],

      // Enable/disable features
      enableBanning: options.enableBanning !== false,
      enableLogging: options.enableLogging !== false
    };

    // In-memory storage (use Redis in production)
    this.storage = {
      ip: new Map(),
      user: new Map(),
      endpoint: new Map(),
      bans: new Map(),
      violations: new Map()
    };

    // Analytics
    this.analytics = {
      totalRequests: 0,
      blockedRequests: 0,
      bannedIPs: 0,
      violations: 0
    };

    // Cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  // ========================================
  // MAIN MIDDLEWARE
  // ========================================

  middleware() {
    return async (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const userId = req.user?.id || null;
      const endpoint = this.normalizeEndpoint(req.path);

      this.analytics.totalRequests++;

      // Check whitelist
      if (this.isWhitelisted(clientIP)) {
        return next();
      }

      // Check if IP is banned
      if (this.isBanned(clientIP)) {
        this.analytics.blockedRequests++;
        this.logRateLimit(clientIP, userId, endpoint, 'BANNED');

        return res.status(403).json({
          error: 'Too many violations. Your IP has been temporarily banned.',
          code: 'IP_BANNED',
          retryAfter: this.getBanTimeRemaining(clientIP)
        });
      }

      // Check rate limits (multiple layers)
      const ipCheck = this.checkIPLimit(clientIP);
      const userCheck = userId ? this.checkUserLimit(userId) : { allowed: true };
      const endpointCheck = this.checkEndpointLimit(clientIP, endpoint);

      // If any check fails
      if (!ipCheck.allowed || !userCheck.allowed || !endpointCheck.allowed) {
        this.analytics.blockedRequests++;

        // Record violation
        this.recordViolation(clientIP);

        // Log to SOC 2 compliance
        this.logRateLimit(clientIP, userId, endpoint, 'EXCEEDED');

        // Determine which limit was hit
        let limitType = 'RATE_LIMIT';
        let retryAfter = 60;

        if (!ipCheck.allowed) {
          limitType = 'IP_RATE_LIMIT';
          retryAfter = Math.ceil(ipCheck.resetIn / 1000);
        } else if (!userCheck.allowed) {
          limitType = 'USER_RATE_LIMIT';
          retryAfter = Math.ceil(userCheck.resetIn / 1000);
        } else if (!endpointCheck.allowed) {
          limitType = 'ENDPOINT_RATE_LIMIT';
          retryAfter = Math.ceil(endpointCheck.resetIn / 1000);
        }

        return res.status(429).json({
          error: 'Rate limit exceeded. Please slow down.',
          code: limitType,
          retryAfter,
          limit: ipCheck.limit || userCheck.limit || endpointCheck.limit,
          remaining: 0
        });
      }

      // Request allowed - add rate limit headers
      res.setHeader('X-RateLimit-Limit', ipCheck.limit);
      res.setHeader('X-RateLimit-Remaining', ipCheck.remaining);
      res.setHeader('X-RateLimit-Reset', ipCheck.resetAt);

      next();
    };
  }

  // ========================================
  // RATE LIMIT CHECKS
  // ========================================

  checkIPLimit(ip) {
    const key = `ip:${ip}`;
    const now = Date.now();
    const window = this.config.ipWindow;
    const limit = this.config.ipLimit;

    return this.checkLimit(key, now, window, limit, this.storage.ip);
  }

  checkUserLimit(userId) {
    const key = `user:${userId}`;
    const now = Date.now();
    const window = this.config.userWindow;
    const limit = this.config.userLimit;

    return this.checkLimit(key, now, window, limit, this.storage.user);
  }

  checkEndpointLimit(ip, endpoint) {
    const endpointConfig = this.getEndpointConfig(endpoint);
    if (!endpointConfig) {
      return { allowed: true };
    }

    const key = `endpoint:${ip}:${endpoint}`;
    const now = Date.now();
    const window = endpointConfig.window;
    const limit = endpointConfig.limit;

    return this.checkLimit(key, now, window, limit, this.storage.endpoint);
  }

  /**
   * Generic sliding window rate limit check
   */
  checkLimit(key, now, window, limit, storage) {
    let record = storage.get(key);

    if (!record) {
      record = { requests: [], createdAt: now };
      storage.set(key, record);
    }

    // Remove old requests outside the window
    record.requests = record.requests.filter(timestamp => now - timestamp < window);

    // Check if limit exceeded
    if (record.requests.length >= limit) {
      const oldestRequest = Math.min(...record.requests);
      const resetIn = window - (now - oldestRequest);

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetIn,
        resetAt: new Date(now + resetIn).toISOString()
      };
    }

    // Add current request
    record.requests.push(now);
    storage.set(key, record);

    return {
      allowed: true,
      limit,
      remaining: limit - record.requests.length,
      resetIn: window,
      resetAt: new Date(now + window).toISOString()
    };
  }

  // ========================================
  // BAN SYSTEM
  // ========================================

  isBanned(ip) {
    const banRecord = this.storage.bans.get(ip);

    if (!banRecord) {
      return false;
    }

    // Check if ban expired
    if (Date.now() > banRecord.expiresAt) {
      this.storage.bans.delete(ip);
      return false;
    }

    return true;
  }

  getBanTimeRemaining(ip) {
    const banRecord = this.storage.bans.get(ip);
    if (!banRecord) return 0;

    const remaining = banRecord.expiresAt - Date.now();
    return Math.ceil(remaining / 1000); // seconds
  }

  recordViolation(ip) {
    if (!this.config.enableBanning) {
      return;
    }

    let violations = this.storage.violations.get(ip) || 0;
    violations++;
    this.storage.violations.set(ip, violations);
    this.analytics.violations++;

    // Check if should ban
    if (violations >= this.config.banThreshold) {
      this.banIP(ip);
    }
  }

  banIP(ip) {
    const banRecord = {
      bannedAt: Date.now(),
      expiresAt: Date.now() + this.config.banDuration,
      violations: this.storage.violations.get(ip) || 0
    };

    this.storage.bans.set(ip, banRecord);
    this.storage.violations.delete(ip);
    this.analytics.bannedIPs++;

    // Log to SOC 2
    soc2.logSecurityEvent({
      type: 'IP_BANNED',
      severity: 'HIGH',
      ip,
      details: {
        violations: banRecord.violations,
        duration: this.config.banDuration / 1000,
        expiresAt: new Date(banRecord.expiresAt).toISOString()
      }
    });

    console.warn(`🚫 IP Banned: ${ip} (${banRecord.violations} violations)`);
  }

  unbanIP(ip) {
    this.storage.bans.delete(ip);
    this.storage.violations.delete(ip);
    console.log(`✅ IP Unbanned: ${ip}`);
  }

  // ========================================
  // HELPERS
  // ========================================

  getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const remoteAddr = req.socket?.remoteAddress || req.connection?.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return remoteAddr?.replace('::ffff:', '') || 'unknown';
  }

  normalizeEndpoint(path) {
    // Normalize paths like /api/medical/123 to /api/medical/*
    const patterns = [
      { regex: /^\/api\/medical\/[^\/]+/, replacement: '/api/medical/*' },
      { regex: /^\/api\/telemetry\/[^\/]+/, replacement: '/api/telemetry/*' },
      { regex: /^\/api\/legal\/[^\/]+/, replacement: '/api/legal/*' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(path)) {
        return pattern.replacement;
      }
    }

    return path;
  }

  getEndpointConfig(endpoint) {
    // Exact match first
    if (this.config.endpointLimits[endpoint]) {
      return this.config.endpointLimits[endpoint];
    }

    // Wildcard match
    for (const [pattern, config] of Object.entries(this.config.endpointLimits)) {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (endpoint.startsWith(prefix)) {
          return config;
        }
      }
    }

    return null;
  }

  isWhitelisted(ip) {
    return this.config.whitelist.includes(ip);
  }

  logRateLimit(ip, userId, endpoint, action) {
    if (!this.config.enableLogging) {
      return;
    }

    soc2.logSecurityEvent({
      type: 'RATE_LIMIT_' + action,
      severity: action === 'BANNED' ? 'HIGH' : 'MEDIUM',
      ip,
      details: {
        userId,
        endpoint,
        action,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ========================================
  // CLEANUP & MONITORING
  // ========================================

  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Clean up expired bans
    for (const [ip, banRecord] of this.storage.bans.entries()) {
      if (now > banRecord.expiresAt) {
        this.storage.bans.delete(ip);
        cleaned++;
      }
    }

    // Clean up old records
    const cleanStorage = (storage, maxAge) => {
      for (const [key, record] of storage.entries()) {
        if (now - record.createdAt > maxAge) {
          storage.delete(key);
          cleaned++;
        }
      }
    };

    cleanStorage(this.storage.ip, 3600000); // 1 hour
    cleanStorage(this.storage.user, 3600000);
    cleanStorage(this.storage.endpoint, 3600000);

    if (cleaned > 0) {
      console.log(`🧹 Rate Limiter Cleanup: ${cleaned} expired records removed`);
    }
  }

  getAnalytics() {
    return {
      ...this.analytics,
      currentBans: this.storage.bans.size,
      trackedIPs: this.storage.ip.size,
      trackedUsers: this.storage.user.size,
      trackedEndpoints: this.storage.endpoint.size,
      blockRate: this.analytics.totalRequests > 0
        ? (this.analytics.blockedRequests / this.analytics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  reset() {
    this.storage.ip.clear();
    this.storage.user.clear();
    this.storage.endpoint.clear();
    this.storage.bans.clear();
    this.storage.violations.clear();
    this.analytics = {
      totalRequests: 0,
      blockedRequests: 0,
      bannedIPs: 0,
      violations: 0
    };
    console.log('✅ Rate limiter reset');
  }

  // ========================================
  // ADMIN FUNCTIONS
  // ========================================

  getBannedIPs() {
    const banned = [];
    for (const [ip, record] of this.storage.bans.entries()) {
      banned.push({
        ip,
        bannedAt: new Date(record.bannedAt).toISOString(),
        expiresAt: new Date(record.expiresAt).toISOString(),
        violations: record.violations,
        timeRemaining: this.getBanTimeRemaining(ip)
      });
    }
    return banned;
  }

  getIPStats(ip) {
    const ipRecord = this.storage.ip.get(`ip:${ip}`);
    const violations = this.storage.violations.get(ip) || 0;
    const banned = this.isBanned(ip);

    return {
      ip,
      requests: ipRecord?.requests.length || 0,
      lastRequest: ipRecord?.requests[ipRecord.requests.length - 1] || null,
      violations,
      banned,
      banTimeRemaining: banned ? this.getBanTimeRemaining(ip) : 0
    };
  }
}

// Export singleton with default config
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
module.exports.RateLimiter = RateLimiter;
