/**
 * LyDian Audit Logging System
 *
 * Features:
 * - Comprehensive audit trail
 * - GDPR/KVKK compliance logging
 * - Security event tracking
 * - Data access logging
 * - Anomaly detection
 * - Tamper-proof logs (optional cryptographic signing)
 *
 * @version 2.1.0
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Audit event types
 */
const EVENT_TYPES = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',
  AUTH_TOKEN_REFRESH: 'auth.token_refresh',
  AUTH_PASSWORD_CHANGE: 'auth.password_change',

  // Authorization
  AUTHZ_DENIED: 'authz.denied',
  AUTHZ_ROLE_CHANGE: 'authz.role_change',

  // Data Access
  DATA_READ: 'data.read',
  DATA_CREATE: 'data.create',
  DATA_UPDATE: 'data.update',
  DATA_DELETE: 'data.delete',
  DATA_EXPORT: 'data.export',

  // Privacy
  PRIVACY_CONSENT_GIVEN: 'privacy.consent_given',
  PRIVACY_CONSENT_REVOKED: 'privacy.consent_revoked',
  PRIVACY_DATA_ANONYMIZED: 'privacy.data_anonymized',
  PRIVACY_DATA_DELETED: 'privacy.data_deleted',
  PRIVACY_RIGHT_TO_ACCESS: 'privacy.right_to_access',
  PRIVACY_RIGHT_TO_PORTABILITY: 'privacy.right_to_portability',

  // Security
  SECURITY_RATE_LIMIT: 'security.rate_limit',
  SECURITY_DDOS_DETECTED: 'security.ddos_detected',
  SECURITY_INTRUSION_ATTEMPT: 'security.intrusion_attempt',
  SECURITY_ENCRYPTION_KEY_ROTATED: 'security.key_rotated',

  // AI Operations
  AI_QUERY: 'ai.query',
  AI_TRAINING: 'ai.training',
  AI_MODEL_UPDATED: 'ai.model_updated',

  // System
  SYSTEM_CONFIG_CHANGE: 'system.config_change',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_ERROR: 'system.error'
};

/**
 * Severity levels
 */
const SEVERITY = {
  DEBUG: 0,
  INFO: 1,
  NOTICE: 2,
  WARNING: 3,
  ERROR: 4,
  CRITICAL: 5,
  ALERT: 6,
  EMERGENCY: 7
};

class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../logs/audit');
    this.console = options.console !== false;
    this.signLogs = options.signLogs || false;
    this.signingKey = options.signingKey || process.env.AUDIT_SIGNING_KEY;
    this.retentionDays = options.retentionDays || 730; // 2 years default for GDPR

    this.initializeLogDir();
  }

  async initializeLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audit log directory:', error);
    }
  }

  /**
   * Log an audit event
   */
  async log(eventType, details, options = {}) {
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: options.severity || SEVERITY.INFO,

      // User context
      user: {
        id: options.userId || 'system',
        email: options.userEmail,
        role: options.userRole,
        ip: options.ip,
        userAgent: options.userAgent
      },

      // Request context
      request: {
        method: options.method,
        path: options.path,
        query: options.query,
        headers: this.sanitizeHeaders(options.headers)
      },

      // Event details
      details,

      // Additional metadata
      metadata: {
        tenant: options.tenant,
        session: options.sessionId,
        correlation: options.correlationId,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Add cryptographic signature if enabled
    if (this.signLogs && this.signingKey) {
      event.signature = this.signEvent(event);
    }

    // Write to log file
    await this.writeToFile(event);

    // Console output in development
    if (this.console) {
      this.logToConsole(event);
    }

    // Trigger alerts for critical events
    if (event.severity >= SEVERITY.ERROR) {
      this.triggerAlert(event);
    }

    return event.id;
  }

  /**
   * Sign event for tamper detection
   */
  signEvent(event) {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      userId: event.user.id,
      details: event.details
    });

    return crypto
      .createHmac('sha256', this.signingKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify event signature
   */
  verifySignature(event) {
    if (!event.signature) {
      return false;
    }

    const expectedSignature = this.signEvent(event);
    return crypto.timingSafeEqual(
      Buffer.from(event.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Write event to daily log file
   */
  async writeToFile(event) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `audit-${date}.jsonl`;
      const filepath = path.join(this.logDir, filename);

      const line = JSON.stringify(event) + '\n';

      await fs.appendFile(filepath, line, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log to console with formatting
   */
  logToConsole(event) {
    const severityName = Object.keys(SEVERITY)[event.severity] || 'INFO';
    const color = this.getSeverityColor(event.severity);

    console.log(
      `${color}[AUDIT ${severityName}]${this.colorReset} ${event.timestamp} | ` +
      `${event.type} | User: ${event.user.id} | ${JSON.stringify(event.details)}`
    );
  }

  getSeverityColor(severity) {
    const colors = {
      0: '\x1b[90m', // DEBUG - gray
      1: '\x1b[37m', // INFO - white
      2: '\x1b[36m', // NOTICE - cyan
      3: '\x1b[33m', // WARNING - yellow
      4: '\x1b[31m', // ERROR - red
      5: '\x1b[35m', // CRITICAL - magenta
      6: '\x1b[41m', // ALERT - red background
      7: '\x1b[41m\x1b[1m' // EMERGENCY - bold red background
    };

    return colors[severity] || colors[1];
  }

  get colorReset() {
    return '\x1b[0m';
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  sanitizeHeaders(headers = {}) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-lydian-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Trigger alert for critical events
   */
  async triggerAlert(event) {
    // Implement alert mechanism (email, Slack, PagerDuty, etc.)
    console.error(`[AUDIT ALERT] Critical event: ${event.type}`, event.details);

    // Example: send to monitoring system
    // await sendToMonitoring(event);
  }

  /**
   * Query audit logs
   */
  async query(filters = {}) {
    const results = [];
    const files = await fs.readdir(this.logDir);

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;

      const filepath = path.join(this.logDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          if (this.matchesFilter(event, filters)) {
            results.push(event);
          }
        } catch (error) {
          console.error('Failed to parse audit log line:', error);
        }
      }
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Check if event matches filter
   */
  matchesFilter(event, filters) {
    if (filters.userId && event.user.id !== filters.userId) return false;
    if (filters.type && event.type !== filters.type) return false;
    if (filters.severity && event.severity < filters.severity) return false;

    if (filters.startDate && new Date(event.timestamp) < new Date(filters.startDate)) {
      return false;
    }

    if (filters.endDate && new Date(event.timestamp) > new Date(filters.endDate)) {
      return false;
    }

    return true;
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) continue;

        const dateMatch = file.match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
        if (!dateMatch) continue;

        const fileDate = new Date(dateMatch[1]);
        if (fileDate < cutoffDate) {
          const filepath = path.join(this.logDir, file);
          await fs.unlink(filepath);
          console.log(`[AUDIT] Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
    }
  }
}

// Singleton instance
let auditLogger = null;

function getAuditLogger(options = {}) {
  if (!auditLogger) {
    auditLogger = new AuditLogger(options);
  }
  return auditLogger;
}

/**
 * Express middleware for automatic audit logging
 */
function auditMiddleware(options = {}) {
  const logger = getAuditLogger(options);

  return async (req, res, next) => {
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;

      // Determine event type based on method
      let eventType;
      if (req.method === 'GET') eventType = EVENT_TYPES.DATA_READ;
      else if (req.method === 'POST') eventType = EVENT_TYPES.DATA_CREATE;
      else if (req.method === 'PUT' || req.method === 'PATCH') eventType = EVENT_TYPES.DATA_UPDATE;
      else if (req.method === 'DELETE') eventType = EVENT_TYPES.DATA_DELETE;

      // Log the request/response
      logger.log(eventType, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        query: req.query,
        params: req.params,
        responseSize: Buffer.byteLength(data)
      }, {
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        severity: res.statusCode >= 500 ? SEVERITY.ERROR :
                 res.statusCode >= 400 ? SEVERITY.WARNING : SEVERITY.INFO
      }).catch(console.error);

      return originalSend.call(this, data);
    };

    next();
  };
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

module.exports = {
  AuditLogger,
  getAuditLogger,
  auditMiddleware,
  EVENT_TYPES,
  SEVERITY
};
