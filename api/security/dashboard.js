/**
 * 📊 SECURITY MONITORING DASHBOARD
 * ==================================
 *
 * Real-time security analytics and monitoring endpoint
 * SOC 2 & HIPAA Compliant Dashboard
 *
 * Provides:
 * - Real-time security metrics
 * - Threat detection analytics
 * - Compliance reporting
 * - Incident tracking
 * - IP ban management
 * - Rate limiting statistics
 * - Audit log access
 */

require('dotenv').config();
const soc2 = require('../../security/soc2-compliance');
const rateLimiter = require('../../security/rate-limiter');
const ipWhitelist = require('../../security/ip-whitelist');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Admin authentication check
    const authHeader = req.headers.authorization;
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      console.error('CRITICAL: ADMIN_TOKEN environment variable is not set');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access',
        code: 'AUTH_REQUIRED',
      });
    }

    // Log dashboard access
    soc2.logDataAccess({
      type: 'READ',
      userId: 'admin',
      dataType: 'SECURITY_DASHBOARD',
      ip: getClientIP(req),
      purpose: 'SECURITY_MONITORING',
    });

    // Handle different endpoints
    const { action } = req.query;

    switch (action) {
      case 'overview':
        return getSecurityOverview(req, res);

      case 'rate-limiter':
        return getRateLimiterStats(req, res);

      case 'ip-whitelist':
        return getIPWhitelistStats(req, res);

      case 'banned-ips':
        return getBannedIPs(req, res);

      case 'audit-log':
        return getAuditLog(req, res);

      case 'compliance-report':
        return getComplianceReport(req, res);

      case 'unban-ip':
        return unbanIP(req, res);

      default:
        return getSecurityOverview(req, res);
    }
  } catch (error) {
    console.error('Security Dashboard Error:', error);

    soc2.logSecurityEvent({
      type: 'DASHBOARD_ERROR',
      severity: 'MEDIUM',
      details: {
        error: error.message || 'Unknown error',
        stack: error.stack,
      },
    });

    res.status(500).json({
      success: false,
      error: 'Güvenlik panosu hatası',
      message: 'Güvenlik panosu hatası',
    });
  }
};

// ========================================
// ENDPOINT HANDLERS
// ========================================

async function getSecurityOverview(req, res) {
  const rateLimiterAnalytics = rateLimiter.getAnalytics();
  const ipWhitelistStats = ipWhitelist.getStats();
  const soc2Metrics = soc2.getMetrics();

  const overview = {
    timestamp: new Date().toISOString(),

    // Rate Limiter Stats
    rateLimiter: {
      totalRequests: rateLimiterAnalytics.totalRequests,
      blockedRequests: rateLimiterAnalytics.blockedRequests,
      blockRate: rateLimiterAnalytics.blockRate,
      currentBans: rateLimiterAnalytics.currentBans,
      violations: rateLimiterAnalytics.violations,
      trackedIPs: rateLimiterAnalytics.trackedIPs,
      trackedUsers: rateLimiterAnalytics.trackedUsers,
    },

    // IP Whitelist Stats
    ipWhitelist: {
      total: ipWhitelistStats.total,
      allowed: ipWhitelistStats.allowed,
      denied: ipWhitelistStats.denied,
      countries: ipWhitelistStats.countries,
      whitelistSize: ipWhitelistStats.whitelistSize,
      blacklistSize: ipWhitelistStats.blacklistSize,
    },

    // SOC 2 Compliance Metrics
    compliance: {
      totalEvents: soc2Metrics.totalEvents,
      securityIncidents: soc2Metrics.securityIncidents,
      accessDenials: soc2Metrics.accessDenials,
      dataAccessEvents: soc2Metrics.dataAccessEvents,
      configChanges: soc2Metrics.configChanges,
      encryptionEvents: soc2Metrics.encryptionEvents,
      logFileSize: soc2Metrics.logFileSize,
      lastEvent: soc2Metrics.lastEvent,
    },

    // Overall Security Status
    securityStatus: calculateSecurityStatus(rateLimiterAnalytics, ipWhitelistStats, soc2Metrics),

    // Alerts
    alerts: generateSecurityAlerts(rateLimiterAnalytics, ipWhitelistStats, soc2Metrics),
  };

  res.status(200).json({
    success: true,
    data: overview,
  });
}

async function getRateLimiterStats(req, res) {
  const analytics = rateLimiter.getAnalytics();

  res.status(200).json({
    success: true,
    data: analytics,
  });
}

async function getIPWhitelistStats(req, res) {
  const stats = ipWhitelist.getStats();
  const auditLog = ipWhitelist.getAuditLog(100);

  res.status(200).json({
    success: true,
    data: {
      stats,
      recentAccess: auditLog,
    },
  });
}

async function getBannedIPs(req, res) {
  const bannedIPs = rateLimiter.getBannedIPs();

  res.status(200).json({
    success: true,
    data: {
      total: bannedIPs.length,
      bannedIPs,
    },
  });
}

async function getAuditLog(req, res) {
  const { days = 7 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const auditLog = soc2.queryAuditLog(startDate, endDate);

  res.status(200).json({
    success: true,
    data: {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalEvents: auditLog.length,
      events: auditLog.slice(-1000), // Last 1000 events
    },
  });
}

async function getComplianceReport(req, res) {
  const { days = 30 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const report = await soc2.generateComplianceReport(startDate, endDate);

  res.status(200).json({
    success: true,
    data: report,
  });
}

async function unbanIP(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({
      success: false,
      error: 'IP address required',
    });
  }

  rateLimiter.unbanIP(ip);

  // Log admin action
  soc2.logConfigChange({
    type: 'SECURITY_SETTING',
    component: 'RATE_LIMITER',
    oldValue: `IP ${ip} was banned`,
    newValue: `IP ${ip} unbanned`,
    changedBy: 'admin',
    changeTicket: 'MANUAL_UNBAN',
  });

  res.status(200).json({
    success: true,
    message: `IP ${ip} has been unbanned`,
    ip,
  });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function calculateSecurityStatus(rateLimiter, ipWhitelist, soc2) {
  let score = 100;
  let status = 'EXCELLENT';
  const issues = [];

  // Check block rate
  const blockRate = parseFloat(rateLimiter.blockRate);
  if (blockRate > 10) {
    score -= 20;
    issues.push(`High block rate: ${rateLimiter.blockRate}`);
  }

  // Check security incidents
  if (soc2.securityIncidents > 10) {
    score -= 15;
    issues.push(`${soc2.securityIncidents} security incidents`);
  }

  // Check banned IPs
  if (rateLimiter.currentBans > 5) {
    score -= 10;
    issues.push(`${rateLimiter.currentBans} IPs currently banned`);
  }

  // Check access denials
  if (ipWhitelist.denied > 100) {
    score -= 10;
    issues.push(`${ipWhitelist.denied} access denials`);
  }

  // Determine status
  if (score >= 90) status = 'EXCELLENT';
  else if (score >= 75) status = 'GOOD';
  else if (score >= 60) status = 'WARNING';
  else status = 'CRITICAL';

  return {
    score,
    status,
    issues,
  };
}

function generateSecurityAlerts(rateLimiter, ipWhitelist, soc2) {
  const alerts = [];

  // Critical alerts
  if (rateLimiter.currentBans > 10) {
    alerts.push({
      severity: 'HIGH',
      type: 'MULTIPLE_BANS',
      message: `${rateLimiter.currentBans} IPs are currently banned - possible attack in progress`,
      timestamp: new Date().toISOString(),
    });
  }

  if (soc2.securityIncidents > 50) {
    alerts.push({
      severity: 'CRITICAL',
      type: 'HIGH_INCIDENT_COUNT',
      message: `${soc2.securityIncidents} security incidents detected`,
      timestamp: new Date().toISOString(),
    });
  }

  // Warning alerts
  const blockRate = parseFloat(rateLimiter.blockRate);
  if (blockRate > 15) {
    alerts.push({
      severity: 'MEDIUM',
      type: 'HIGH_BLOCK_RATE',
      message: `Rate limiter blocking ${rateLimiter.blockRate} of requests`,
      timestamp: new Date().toISOString(),
    });
  }

  if (ipWhitelist.denied > 200) {
    alerts.push({
      severity: 'MEDIUM',
      type: 'HIGH_DENIAL_RATE',
      message: `${ipWhitelist.denied} access denials from IP whitelist`,
      timestamp: new Date().toISOString(),
    });
  }

  // Info alerts
  if (alerts.length === 0) {
    alerts.push({
      severity: 'INFO',
      type: 'ALL_CLEAR',
      message: 'All security systems operating normally',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

function getClientIP(req) {
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
