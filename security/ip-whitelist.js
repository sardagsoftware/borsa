/**
 * 🔐 IP WHITELISTING MIDDLEWARE
 * ===============================
 *
 * Enterprise-level IP whitelisting system
 * SOC 2 & HIPAA Compliant
 *
 * Features:
 * - IP Range Whitelisting
 * - Geo-blocking
 * - Dynamic whitelist management
 * - Audit logging
 * - Emergency override
 */

const geoip = require('geoip-lite');

class IPWhitelist {
  constructor(options = {}) {
    this.whitelist = options.whitelist || [];
    this.blacklist = options.blacklist || [];
    this.allowedCountries = options.allowedCountries || ['TR', 'US', 'GB', 'DE', 'FR'];
    this.blockedCountries = options.blockedCountries || ['CN', 'RU', 'KP'];
    this.auditLog = [];
    this.emergencyOverride = process.env.IP_WHITELIST_OVERRIDE === 'true';
  }

  /**
   * Check if IP is in CIDR range
   */
  isIPInRange(ip, range) {
    if (range.includes('/')) {
      // CIDR notation
      const [rangeIP, bits] = range.split('/');
      const mask = ~(2 ** (32 - bits) - 1);
      return (this.ip2int(ip) & mask) === (this.ip2int(rangeIP) & mask);
    } else {
      // Exact match
      return ip === range;
    }
  }

  /**
   * Convert IP to integer
   */
  ip2int(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
  }

  /**
   * Get client IP (handles proxies and load balancers)
   */
  getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const remoteAddr = req.socket.remoteAddress || req.connection.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return remoteAddr.replace('::ffff:', '');
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelisted(ip) {
    if (this.emergencyOverride) {
      return true; // Emergency override - all IPs allowed
    }

    // Check exact whitelist
    for (const allowedIP of this.whitelist) {
      if (this.isIPInRange(ip, allowedIP)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if IP is blacklisted
   */
  isBlacklisted(ip) {
    for (const blockedIP of this.blacklist) {
      if (this.isIPInRange(ip, blockedIP)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Geo-IP check
   */
  isGeoAllowed(ip) {
    const geo = geoip.lookup(ip);

    if (!geo) {
      // Unknown location - allow by default (local dev)
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
        return true;
      }
      return false; // Block unknown IPs in production
    }

    // Check blocked countries first
    if (this.blockedCountries.includes(geo.country)) {
      return false;
    }

    // Check allowed countries
    if (this.allowedCountries.length > 0) {
      return this.allowedCountries.includes(geo.country);
    }

    return true; // Allow if no restrictions
  }

  /**
   * Add to audit log
   */
  logAccess(ip, allowed, reason, req) {
    const log = {
      timestamp: new Date().toISOString(),
      ip,
      allowed,
      reason,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      geo: geoip.lookup(ip)
    };

    this.auditLog.push(log);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // Log to console in production
    if (process.env.NODE_ENV === 'production' && !allowed) {
      console.warn('🚫 IP Access Denied:', log);
    }
  }

  /**
   * Main middleware function
   */
  middleware() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);

      // Check blacklist first
      if (this.isBlacklisted(clientIP)) {
        this.logAccess(clientIP, false, 'BLACKLISTED', req);
        return res.status(403).json({
          error: 'Access denied',
          code: 'IP_BLACKLISTED'
        });
      }

      // Check whitelist
      if (this.whitelist.length > 0 && !this.isWhitelisted(clientIP)) {
        this.logAccess(clientIP, false, 'NOT_WHITELISTED', req);
        return res.status(403).json({
          error: 'Access denied',
          code: 'IP_NOT_WHITELISTED'
        });
      }

      // Check geo-location
      if (!this.isGeoAllowed(clientIP)) {
        const geo = geoip.lookup(clientIP);
        this.logAccess(clientIP, false, `GEO_BLOCKED: ${geo?.country}`, req);
        return res.status(403).json({
          error: 'Access denied from your location',
          code: 'GEO_BLOCKED'
        });
      }

      // Log successful access
      this.logAccess(clientIP, true, 'ALLOWED', req);

      // Add IP info to request
      req.clientIP = clientIP;
      req.clientGeo = geoip.lookup(clientIP);

      next();
    };
  }

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip) {
    if (!this.whitelist.includes(ip)) {
      this.whitelist.push(ip);
      console.log(`✅ Added to whitelist: ${ip}`);
    }
  }

  /**
   * Remove IP from whitelist
   */
  removeFromWhitelist(ip) {
    const index = this.whitelist.indexOf(ip);
    if (index > -1) {
      this.whitelist.splice(index, 1);
      console.log(`❌ Removed from whitelist: ${ip}`);
    }
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip) {
    if (!this.blacklist.includes(ip)) {
      this.blacklist.push(ip);
      console.log(`🚫 Added to blacklist: ${ip}`);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    const allowed = this.auditLog.filter(log => log.allowed).length;
    const denied = this.auditLog.filter(log => !log.allowed).length;
    const countries = {};

    this.auditLog.forEach(log => {
      if (log.geo && log.geo.country) {
        countries[log.geo.country] = (countries[log.geo.country] || 0) + 1;
      }
    });

    return {
      total: this.auditLog.length,
      allowed,
      denied,
      countries,
      whitelistSize: this.whitelist.length,
      blacklistSize: this.blacklist.length
    };
  }
}

// Export singleton instance with default config
const ipWhitelist = new IPWhitelist({
  // Default whitelist (development IPs)
  whitelist: [
    '127.0.0.1',
    '::1',
    '192.168.0.0/16', // Local network
    '10.0.0.0/8',     // Private network
    process.env.ADMIN_IP // Admin IP from env
  ].filter(Boolean),

  // Blocked countries (high-risk regions)
  blockedCountries: ['CN', 'RU', 'KP', 'IR'],

  // Allowed countries (optional - leave empty to allow all except blocked)
  allowedCountries: []
});

module.exports = ipWhitelist;
module.exports.IPWhitelist = IPWhitelist;
