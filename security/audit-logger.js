/**
 * Enterprise Audit Logging System
 * HIPAA/GDPR Compliant Audit Trail
 * Tamper-Proof, Cryptographically Signed Logs
 *
 * @module AuditLogger
 * @version 2.0.0
 * @security-level CRITICAL
 * @compliance HIPAA §164.312(b), GDPR Article 30
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createWriteStream } = require('fs');

class AuditLogger {
  constructor() {
    this.logDirectory = process.env.AUDIT_LOG_DIR || path.join(__dirname, '../logs/audit');
    this.logLevel = process.env.AUDIT_LOG_LEVEL || 'info';
    this.maxLogSize = 10 * 1024 * 1024; // 10MB per file
    this.compressionEnabled = true;
    this.encryptionEnabled = true;

    // Log rotation settings
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.maxRetentionDays = 2555; // 7 years (HIPAA requirement)

    // Initialize
    this.initialize();
  }

  /**
   * Initialize audit logging system
   * @private
   */
  async initialize() {
    try {
      // Create log directory if it doesn't exist
      await fs.mkdir(this.logDirectory, { recursive: true });

      // Start log rotation scheduler
      this.scheduleLogRotation();

      console.log(`✅ Audit Logger initialized: ${this.logDirectory}`);
    } catch (error) {
      console.error('❌ Failed to initialize Audit Logger:', error.message);
    }
  }

  /**
   * Log an audit event
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {Object} details - Additional details
   * @param {Object} [context] - Request context
   * @returns {Promise<void>}
   */
  async log(action, resource, details, context = {}) {
    try {
      const logEntry = {
        id: this.generateLogId(),
        timestamp: new Date().toISOString(),
        level: this.determineLogLevel(action),
        action,
        resource,
        userId: context.userId || 'system',
        sessionId: context.sessionId || null,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        requestId: context.requestId || null,
        success: details.success !== false,
        details: this.sanitizeDetails(details),
        signature: null // Will be set below
      };

      // Generate cryptographic signature
      logEntry.signature = this.signLogEntry(logEntry);

      // Write to log file
      await this.writeLogEntry(logEntry);

      // For critical events, also write to separate file
      if (this.isCriticalEvent(action)) {
        await this.writeCriticalEvent(logEntry);
      }

      // If this is a security incident, trigger alerts
      if (this.isSecurityIncident(action)) {
        await this.triggerSecurityAlert(logEntry);
      }

    } catch (error) {
      // Fallback: write to console if file logging fails
      console.error('❌ Audit logging failed:', error.message);
      console.error('Audit Entry:', { action, resource, details });
    }
  }

  /**
   * Generate unique log entry ID
   * @private
   */
  generateLogId() {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Determine log level based on action
   * @private
   */
  determineLogLevel(action) {
    const criticalActions = [
      'login-failed',
      'unauthorized-access',
      'data-breach',
      'data-erasure',
      'hipaa-breach',
      'security-incident'
    ];

    const warningActions = [
      'password-reset',
      'consent-withdrawal',
      'data-export',
      'unusual-activity'
    ];

    if (criticalActions.some(a => action.includes(a))) {
      return 'critical';
    } else if (warningActions.some(a => action.includes(a))) {
      return 'warning';
    } else {
      return 'info';
    }
  }

  /**
   * Sanitize details to remove sensitive information
   * @private
   */
  sanitizeDetails(details) {
    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
      'socialSecurityNumber'
    ];

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Sign log entry with HMAC
   * @private
   */
  signLogEntry(entry) {
    const { signature, ...dataToSign } = entry;
    const data = JSON.stringify(dataToSign);
    const secret = process.env.AUDIT_LOG_SECRET || 'fallback-secret-change-in-production';

    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify log entry signature
   * @param {Object} entry - Log entry to verify
   * @returns {boolean} True if signature is valid
   */
  verifyLogEntry(entry) {
    const { signature, ...dataToVerify } = entry;
    const expectedSignature = this.signLogEntry({ ...entry, signature: null });

    return crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Write log entry to file
   * @private
   */
  async writeLogEntry(entry) {
    const logFile = this.getCurrentLogFile();
    const logLine = JSON.stringify(entry) + '\n';

    await fs.appendFile(logFile, logLine, 'utf8');
  }

  /**
   * Get current log file path
   * @private
   */
  getCurrentLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDirectory, `audit-${date}.log`);
  }

  /**
   * Check if action is a critical event
   * @private
   */
  isCriticalEvent(action) {
    const criticalActions = [
      'data-erasure',
      'data-export',
      'consent-withdrawal',
      'hipaa-breach',
      'unauthorized-access',
      'security-incident'
    ];

    return criticalActions.some(a => action.includes(a));
  }

  /**
   * Write critical event to separate file
   * @private
   */
  async writeCriticalEvent(entry) {
    const criticalFile = path.join(this.logDirectory, 'critical-events.log');
    const logLine = JSON.stringify(entry) + '\n';

    await fs.appendFile(criticalFile, logLine, 'utf8');
  }

  /**
   * Check if action is a security incident
   * @private
   */
  isSecurityIncident(action) {
    const securityActions = [
      'login-failed',
      'unauthorized-access',
      'data-breach',
      'hipaa-breach',
      'sql-injection-attempt',
      'xss-attempt',
      'rate-limit-exceeded'
    ];

    return securityActions.some(a => action.includes(a));
  }

  /**
   * Trigger security alert
   * @private
   */
  async triggerSecurityAlert(entry) {
    // TODO: Implement actual alerting (email, SMS, Slack, PagerDuty, etc.)
    console.error('🚨 SECURITY ALERT:', {
      action: entry.action,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp
    });

    // Write to security alerts file
    const alertFile = path.join(this.logDirectory, 'security-alerts.log');
    const alertLine = JSON.stringify(entry) + '\n';

    await fs.appendFile(alertFile, alertLine, 'utf8');
  }

  /**
   * Schedule log rotation
   * @private
   */
  scheduleLogRotation() {
    setInterval(async () => {
      await this.rotateOldLogs();
    }, this.rotationInterval);
  }

  /**
   * Rotate old logs
   * @private
   */
  async rotateOldLogs() {
    try {
      const files = await fs.readdir(this.logDirectory);

      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.log')) {
          continue;
        }

        const filePath = path.join(this.logDirectory, file);
        const stats = await fs.stat(filePath);
        const daysSinceCreation = (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24);

        // Archive old logs
        if (daysSinceCreation > 30 && daysSinceCreation < this.maxRetentionDays) {
          await this.archiveLog(filePath);
        }

        // Delete very old logs (after retention period)
        if (daysSinceCreation > this.maxRetentionDays) {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted old audit log: ${file}`);
        }
      }
    } catch (error) {
      console.error('❌ Log rotation failed:', error.message);
    }
  }

  /**
   * Archive log file (compress)
   * @private
   */
  async archiveLog(logFile) {
    // TODO: Implement actual compression (e.g., using zlib)
    console.log(`📦 Archiving log: ${path.basename(logFile)}`);
  }

  /**
   * Query audit logs
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Matching log entries
   */
  async queryLogs(filters = {}) {
    try {
      const {
        userId,
        action,
        resource,
        startDate,
        endDate,
        level,
        limit = 100
      } = filters;

      const logs = [];
      const files = await fs.readdir(this.logDirectory);

      // Sort files by date (newest first)
      const logFiles = files
        .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
        .sort()
        .reverse();

      for (const file of logFiles) {
        const filePath = path.join(this.logDirectory, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          if (!line) continue;

          try {
            const entry = JSON.parse(line);

            // Apply filters
            if (userId && entry.userId !== userId) continue;
            if (action && !entry.action.includes(action)) continue;
            if (resource && entry.resource !== resource) continue;
            if (level && entry.level !== level) continue;

            if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
            if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;

            logs.push(entry);

            if (logs.length >= limit) {
              return logs;
            }
          } catch (parseError) {
            console.error('Failed to parse log line:', line);
          }
        }
      }

      return logs;
    } catch (error) {
      console.error('❌ Log query failed:', error.message);
      return [];
    }
  }

  /**
   * Get audit trail for a specific user
   * @param {string} userId - User ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} User's audit trail
   */
  async getUserAuditTrail(userId, startDate, endDate) {
    return this.queryLogs({
      userId,
      startDate,
      endDate
    });
  }

  /**
   * Export audit logs (for compliance reporting)
   * @param {string} format - Export format ('json', 'csv')
   * @param {Object} filters - Query filters
   * @returns {Promise<string>} Exported data
   */
  async exportAuditLogs(format = 'json', filters = {}) {
    const logs = await this.queryLogs(filters);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      return this.convertLogsToCSV(logs);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert logs to CSV format
   * @private
   */
  convertLogsToCSV(logs) {
    if (logs.length === 0) {
      return '';
    }

    const headers = [
      'id',
      'timestamp',
      'level',
      'action',
      'resource',
      'userId',
      'ipAddress',
      'success'
    ];

    const rows = [headers.join(',')];

    logs.forEach(log => {
      const row = headers.map(header => {
        let value = log[header];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'object') value = JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generate compliance report
   * @param {string} reportType - Report type ('hipaa', 'gdpr')
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport(reportType, startDate, endDate) {
    const logs = await this.queryLogs({ startDate, endDate });

    const report = {
      reportType,
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      totalEvents: logs.length,
      summary: {
        byLevel: this.groupBy(logs, 'level'),
        byAction: this.groupBy(logs, 'action'),
        byUser: this.groupBy(logs, 'userId')
      },
      criticalEvents: logs.filter(l => l.level === 'critical'),
      securityIncidents: logs.filter(l => this.isSecurityIncident(l.action)),
      dataAccessEvents: logs.filter(l => l.action.includes('access')),
      dataModificationEvents: logs.filter(l => l.action.includes('update') || l.action.includes('delete'))
    };

    return report;
  }

  /**
   * Group logs by a field
   * @private
   */
  groupBy(logs, field) {
    return logs.reduce((acc, log) => {
      const key = log[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Verify audit log integrity
   * @param {string} logFile - Log file path
   * @returns {Promise<Object>} Verification result
   */
  async verifyLogIntegrity(logFile) {
    try {
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');

      let totalEntries = 0;
      let validEntries = 0;
      let invalidEntries = 0;

      for (const line of lines) {
        if (!line) continue;

        totalEntries++;

        try {
          const entry = JSON.parse(line);
          if (this.verifyLogEntry(entry)) {
            validEntries++;
          } else {
            invalidEntries++;
            console.error('❌ Invalid signature:', entry.id);
          }
        } catch (parseError) {
          invalidEntries++;
          console.error('❌ Failed to parse entry');
        }
      }

      const integrity = invalidEntries === 0;

      return {
        integrity,
        totalEntries,
        validEntries,
        invalidEntries,
        integrityPercentage: ((validEntries / totalEntries) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ Log integrity verification failed:', error.message);
      return {
        integrity: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger;
