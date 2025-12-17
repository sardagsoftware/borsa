/**
 * Advanced Rate Limiting & DDoS Protection
 * Multi-Layer Protection with Intelligent Threat Detection
 * Hospital-Grade Security for Medical Systems
 *
 * @module AdvancedRateLimiter
 * @version 2.0.0
 * @security-level CRITICAL
 */

const auditLogger = require('../security/audit-logger');

class AdvancedRateLimiter {
  constructor() {
    // Rate limit configurations
    this.limits = {
      global: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute per IP
        message: 'Too many requests from this IP, please try again later'
      },
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 login attempts per 15 minutes
        message: 'Too many login attempts. Please try again in 15 minutes'
      },
      medicalQuery: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 30, // 30 medical queries per hour
        message: 'Medical query limit reached. Please wait before making another query'
      },
      api: {
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 requests per minute per endpoint
        message: 'API rate limit exceeded. Please slow down your requests'
      },
      fileUpload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // 20 file uploads per hour
        message: 'File upload limit reached. Please try again later'
      }
    };

    // Request tracking (in-memory - use Redis for production clusters)
    this.requestCounts = new Map();
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();

    // Attack detection thresholds
    this.attackThresholds = {
      requestsPerSecond: 50, // Suspicious if > 50 req/s
      failedAuthAttempts: 10, // Block after 10 failed auth attempts
      invalidRequests: 20, // Block after 20 invalid requests
      suspiciousDuration: 5 * 60 * 1000 // 5 minutes
    };

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);

    console.log('✅ Advanced Rate Limiter initialized');
  }

  /**
   * Main rate limiting middleware
   */
  middleware(limitType = 'global') {
    return async (req, res, next) => {
      const ip = this.getClientIP(req);
      const userId = req.user?.id || null;
      const identifier = userId || ip;

      // Check if IP is blocked
      if (this.blockedIPs.has(ip)) {
        await this.logViolation(ip, 'BLOCKED_IP', req);
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_BLOCKED',
            message: 'Your IP has been blocked due to suspicious activity',
            severity: 'high'
          }
        });
      }

      // Check if suspicious
      if (this.suspiciousIPs.has(ip)) {
        await this.logViolation(ip, 'SUSPICIOUS_IP', req);
        // Apply stricter limits for suspicious IPs
        limitType = 'strict';
      }

      // Get limit configuration
      const limit = this.limits[limitType] || this.limits.global;

      // Track request
      const allowed = await this.checkLimit(identifier, limit, req);

      if (!allowed) {
        await this.logViolation(ip, 'RATE_LIMIT_EXCEEDED', req);

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: limit.message,
            severity: 'medium',
            retryAfter: Math.ceil(limit.windowMs / 1000)
          }
        });
      }

      // Detect potential attacks
      await this.detectAttacks(ip, req);

      next();
    };
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(identifier, limit, req) {
    const key = `${identifier}:${limit.windowMs}`;
    const now = Date.now();

    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, {
        count: 0,
        resetTime: now + limit.windowMs,
        requests: []
      });
    }

    const record = this.requestCounts.get(key);

    // Reset if window has expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + limit.windowMs;
      record.requests = [];
    }

    // Increment count
    record.count++;
    record.requests.push({
      timestamp: now,
      url: req.originalUrl,
      method: req.method
    });

    // Check if limit exceeded
    if (record.count > limit.max) {
      return false;
    }

    return true;
  }

  /**
   * Detect potential DDoS or brute force attacks
   */
  async detectAttacks(ip, req) {
    const now = Date.now();

    // Get request history for this IP
    const ipKey = `${ip}:attack-detection`;
    if (!this.requestCounts.has(ipKey)) {
      this.requestCounts.set(ipKey, {
        requests: [],
        failedAuth: 0,
        invalidRequests: 0,
        lastCheck: now
      });
    }

    const ipRecord = this.requestCounts.get(ipKey);

    // Add current request
    ipRecord.requests.push(now);

    // Keep only requests from last minute
    ipRecord.requests = ipRecord.requests.filter(
      timestamp => now - timestamp < 60 * 1000
    );

    // Calculate requests per second
    const requestsPerSecond = ipRecord.requests.length / 60;

    // Check for rapid-fire requests (potential DDoS)
    if (requestsPerSecond > this.attackThresholds.requestsPerSecond) {
      this.suspiciousIPs.add(ip);

      await auditLogger.log(
        'ddos-attack-detected',
        'security-incident',
        {
          ip,
          requestsPerSecond,
          threshold: this.attackThresholds.requestsPerSecond,
          action: 'FLAGGED_AS_SUSPICIOUS'
        }
      );

      console.error(`🚨 Potential DDoS attack from IP: ${ip} (${requestsPerSecond.toFixed(1)} req/s)`);
    }

    // Track failed authentication attempts
    if (req.path.includes('/login') || req.path.includes('/auth')) {
      if (req.authFailed) {
        ipRecord.failedAuth++;

        if (ipRecord.failedAuth >= this.attackThresholds.failedAuthAttempts) {
          this.blockIP(ip, 'BRUTE_FORCE_ATTACK');
        }
      }
    }

    // Track invalid requests (400, 403, 404 responses)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      ipRecord.invalidRequests++;

      if (ipRecord.invalidRequests >= this.attackThresholds.invalidRequests) {
        this.blockIP(ip, 'EXCESSIVE_INVALID_REQUESTS');
      }
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    this.suspiciousIPs.delete(ip);

    await auditLogger.log(
      'ip-blocked',
      'security-incident',
      {
        ip,
        reason,
        blockedAt: new Date().toISOString(),
        duration: 'permanent'
      }
    );

    console.error(`🚫 IP BLOCKED: ${ip} - Reason: ${reason}`);

    // TODO: In production, sync with firewall/WAF
    // - Update AWS WAF rules
    // - Update Cloudflare firewall rules
    // - Update nginx/Apache rules
  }

  /**
   * Unblock an IP address (manual intervention required)
   */
  async unblockIP(ip, reason) {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);

    await auditLogger.log(
      'ip-unblocked',
      'security-incident',
      {
        ip,
        reason,
        unblockedAt: new Date().toISOString()
      }
    );

    console.log(`✅ IP UNBLOCKED: ${ip} - Reason: ${reason}`);
  }

  /**
   * Get client IP address (handles proxies)
   */
  getClientIP(req) {
    // Check for IP in various headers (proxy-aware)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }

    const cloudflareIP = req.headers['cf-connecting-ip'];
    if (cloudflareIP) {
      return cloudflareIP;
    }

    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Log rate limit violation
   */
  async logViolation(ip, violationType, req) {
    await auditLogger.log(
      'rate-limit-violation',
      'security-incident',
      {
        ip,
        violationType,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Cleanup old request records
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.requestCounts.entries()) {
      if (record.resetTime && now > record.resetTime + 60000) {
        this.requestCounts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired rate limit records`);
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      totalTrackedIdentifiers: this.requestCounts.size,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
      blockedIPsList: Array.from(this.blockedIPs),
      suspiciousIPsList: Array.from(this.suspiciousIPs)
    };
  }

  /**
   * Whitelist an IP (bypass rate limiting)
   */
  whitelistedIPs = new Set();

  whitelistIP(ip) {
    this.whitelistedIPs.add(ip);
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    console.log(`✅ IP Whitelisted: ${ip}`);
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelisted(ip) {
    return this.whitelistedIPs.has(ip);
  }

  /**
   * Middleware for whitelisted IPs
   */
  whitelistMiddleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);

      if (this.isWhitelisted(ip)) {
        return next();
      }

      // Continue with regular rate limiting
      return this.middleware()(req, res, next);
    };
  }

  /**
   * Emergency mode - strict rate limiting
   */
  emergencyMode = false;

  enableEmergencyMode() {
    this.emergencyMode = true;

    // Apply strict limits
    this.limits.global.max = 20; // Reduce to 20 req/min
    this.limits.medicalQuery.max = 10; // Reduce to 10/hour

    console.warn('⚠️  EMERGENCY MODE ENABLED - Strict rate limits in effect');

    auditLogger.log('emergency-mode-enabled', 'security-incident', {
      enabledAt: new Date().toISOString(),
      reason: 'Manual activation or automated threat detection'
    });
  }

  disableEmergencyMode() {
    this.emergencyMode = false;

    // Restore normal limits
    this.limits.global.max = 100;
    this.limits.medicalQuery.max = 30;

    console.log('✅ Emergency mode disabled - Normal rate limits restored');

    auditLogger.log('emergency-mode-disabled', 'security-incident', {
      disabledAt: new Date().toISOString()
    });
  }
}

// Singleton instance
const advancedRateLimiter = new AdvancedRateLimiter();

module.exports = advancedRateLimiter;
