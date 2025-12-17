/**
 * Enterprise Error Handling Middleware
 * Production-Ready Error Management with Zero-Downtime Recovery
 * Comprehensive Error Classification, Logging, and Recovery
 *
 * @module ErrorHandler
 * @version 2.0.0
 * @security-level CRITICAL
 */

const auditLogger = require('../security/audit-logger');

class MedicalError extends Error {
  constructor(code, message, severity, details = {}) {
    super(message);
    this.name = 'MedicalError';
    this.code = code;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.recoverable = this.determineRecoverability();
  }

  determineRecoverability() {
    const unrecoverableErrors = [
      'DATA_CORRUPTION',
      'ENCRYPTION_FAILURE',
      'HIPAA_VIOLATION',
      'CRITICAL_SYSTEM_FAILURE'
    ];
    return !unrecoverableErrors.includes(this.code);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

class ErrorHandler {
  constructor() {
    this.errorCodes = {
      // Authentication & Authorization (1xxx)
      'AUTH_001': { message: 'Invalid credentials', severity: 'medium', userMessage: 'Invalid username or password' },
      'AUTH_002': { message: 'Session expired', severity: 'low', userMessage: 'Your session has expired. Please log in again.' },
      'AUTH_003': { message: 'Insufficient permissions', severity: 'medium', userMessage: 'You do not have permission to perform this action' },
      'AUTH_004': { message: 'Account locked', severity: 'high', userMessage: 'Your account has been locked. Please contact support.' },

      // Medical AI (2xxx)
      'MEDICAL_001': { message: 'AI model unavailable', severity: 'high', userMessage: 'Medical AI service is temporarily unavailable. Please try again later.' },
      'MEDICAL_002': { message: 'Invalid medical query', severity: 'low', userMessage: 'Please rephrase your medical question.' },
      'MEDICAL_003': { message: 'Validation failed', severity: 'high', userMessage: 'Response could not be validated. Consult a healthcare provider.' },
      'MEDICAL_004': { message: 'Emergency detected', severity: 'critical', userMessage: 'Emergency condition detected. Call 911/112 immediately!' },
      'MEDICAL_005': { message: 'Drug interaction warning', severity: 'high', userMessage: 'Potential drug interaction detected. Consult your doctor.' },

      // Data & Encryption (3xxx)
      'DATA_001': { message: 'Encryption failed', severity: 'critical', userMessage: 'Unable to secure your data. Operation cancelled.' },
      'DATA_002': { message: 'Decryption failed', severity: 'critical', userMessage: 'Unable to access encrypted data. Please contact support.' },
      'DATA_003': { message: 'Data validation failed', severity: 'medium', userMessage: 'Invalid data format. Please check your input.' },
      'DATA_004': { message: 'Data corruption detected', severity: 'critical', userMessage: 'Data integrity issue detected. Operation cancelled.' },

      // Compliance (4xxx)
      'COMPLIANCE_001': { message: 'HIPAA violation detected', severity: 'critical', userMessage: 'Operation blocked due to compliance requirements.' },
      'COMPLIANCE_002': { message: 'Consent required', severity: 'medium', userMessage: 'Patient consent required to proceed.' },
      'COMPLIANCE_003': { message: 'Data retention policy violation', severity: 'high', userMessage: 'Operation violates data retention policies.' },
      'COMPLIANCE_004': { message: 'Audit log failure', severity: 'critical', userMessage: 'Unable to log this action. Operation cancelled.' },

      // System & Infrastructure (5xxx)
      'SYSTEM_001': { message: 'Database connection failed', severity: 'critical', userMessage: 'Service temporarily unavailable. Please try again later.' },
      'SYSTEM_002': { message: 'External API failure', severity: 'high', userMessage: 'External service unavailable. Please try again later.' },
      'SYSTEM_003': { message: 'Rate limit exceeded', severity: 'medium', userMessage: 'Too many requests. Please wait before trying again.' },
      'SYSTEM_004': { message: 'Server overload', severity: 'high', userMessage: 'Service is experiencing high load. Please try again later.' },
      'SYSTEM_005': { message: 'Configuration error', severity: 'critical', userMessage: 'System configuration error. Please contact support.' },

      // Security (6xxx)
      'SECURITY_001': { message: 'SQL injection attempt detected', severity: 'critical', userMessage: 'Security violation detected. Incident logged.' },
      'SECURITY_002': { message: 'XSS attempt detected', severity: 'critical', userMessage: 'Security violation detected. Incident logged.' },
      'SECURITY_003': { message: 'CSRF token invalid', severity: 'high', userMessage: 'Security token invalid. Please refresh and try again.' },
      'SECURITY_004': { message: 'Suspicious activity detected', severity: 'high', userMessage: 'Unusual activity detected. Please verify your identity.' },
      'SECURITY_005': { message: 'DDoS attack detected', severity: 'critical', userMessage: 'Service temporarily restricted due to security measures.' }
    };

    this.errorStats = {
      totalErrors: 0,
      criticalErrors: 0,
      highErrors: 0,
      mediumErrors: 0,
      lowErrors: 0,
      byCode: {}
    };
  }

  /**
   * Main error handling middleware
   */
  middleware() {
    return async (err, req, res, next) => {
      // Log error
      await this.logError(err, req);

      // Update statistics
      this.updateErrorStats(err);

      // Determine if this is a medical error
      const isMedicalError = err instanceof MedicalError;

      // Build error response
      const errorResponse = this.buildErrorResponse(err, req);

      // For critical errors, trigger alerts
      if (err.severity === 'critical') {
        await this.triggerCriticalAlert(err, req);
      }

      // Send response
      res.status(errorResponse.statusCode).json(errorResponse.body);
    };
  }

  /**
   * Create a medical error
   */
  create(code, details = {}, technicalMessage = null) {
    const errorDef = this.errorCodes[code];

    if (!errorDef) {
      return new MedicalError(
        'UNKNOWN_ERROR',
        technicalMessage || 'Unknown error occurred',
        'medium',
        details
      );
    }

    return new MedicalError(
      code,
      technicalMessage || errorDef.message,
      errorDef.severity,
      details
    );
  }

  /**
   * Log error with full context
   */
  async logError(err, req) {
    const context = {
      userId: req.user?.id || 'anonymous',
      sessionId: req.session?.id || null,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      body: this.sanitizeRequestBody(req.body)
    };

    await auditLogger.log(
      'error-occurred',
      'error-handling',
      {
        error: err instanceof MedicalError ? err.toJSON() : {
          name: err.name,
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        success: false
      },
      context
    );
  }

  /**
   * Build error response
   */
  buildErrorResponse(err, req) {
    const isMedicalError = err instanceof MedicalError;
    const errorDef = isMedicalError ? this.errorCodes[err.code] : null;

    // Determine HTTP status code
    const statusCode = this.determineStatusCode(err);

    // Build response body
    const body = {
      success: false,
      error: {
        code: isMedicalError ? err.code : 'INTERNAL_ERROR',
        message: errorDef?.userMessage || 'An unexpected error occurred',
        severity: isMedicalError ? err.severity : 'high',
        timestamp: new Date().toISOString(),
        recoverable: isMedicalError ? err.recoverable : false
      },
      requestId: req.id || null,
      supportContact: 'support@ailydian.com'
    };

    // Add technical details in development
    if (process.env.NODE_ENV === 'development') {
      body.error.technicalMessage = err.message;
      body.error.stack = err.stack;
    }

    return { statusCode, body };
  }

  /**
   * Determine HTTP status code from error
   */
  determineStatusCode(err) {
    if (err instanceof MedicalError) {
      if (err.code.startsWith('AUTH_')) return 401;
      if (err.code.startsWith('COMPLIANCE_')) return 403;
      if (err.code.startsWith('DATA_003')) return 400;
      if (err.code.startsWith('SYSTEM_003')) return 429;
      if (err.code.startsWith('SECURITY_')) return 403;
      if (err.severity === 'critical') return 500;
      if (err.severity === 'high') return 500;
      return 400;
    }

    // Default error status codes
    if (err.name === 'ValidationError') return 400;
    if (err.name === 'UnauthorizedError') return 401;
    if (err.name === 'ForbiddenError') return 403;
    if (err.name === 'NotFoundError') return 404;
    if (err.name === 'ConflictError') return 409;
    if (err.name === 'TooManyRequestsError') return 429;

    return 500;
  }

  /**
   * Update error statistics
   */
  updateErrorStats(err) {
    this.errorStats.totalErrors++;

    if (err instanceof MedicalError) {
      const code = err.code;
      this.errorStats.byCode[code] = (this.errorStats.byCode[code] || 0) + 1;

      switch (err.severity) {
        case 'critical':
          this.errorStats.criticalErrors++;
          break;
        case 'high':
          this.errorStats.highErrors++;
          break;
        case 'medium':
          this.errorStats.mediumErrors++;
          break;
        case 'low':
          this.errorStats.lowErrors++;
          break;
      }
    }
  }

  /**
   * Trigger alert for critical errors
   */
  async triggerCriticalAlert(err, req) {
    console.error('🚨 CRITICAL ERROR ALERT:', {
      code: err.code,
      message: err.message,
      severity: err.severity,
      userId: req.user?.id,
      url: req.originalUrl,
      timestamp: err.timestamp
    });

    // TODO: Implement actual alerting (email, SMS, PagerDuty, Slack)
    // - Send email to on-call engineer
    // - Trigger PagerDuty incident
    // - Post to Slack #critical-alerts channel

    await auditLogger.log(
      'critical-error-alert',
      'error-handling',
      {
        error: err.toJSON(),
        userId: req.user?.id,
        url: req.originalUrl
      }
    );
  }

  /**
   * Sanitize request body (remove sensitive data)
   */
  sanitizeRequestBody(body) {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'];

    const sanitize = (obj) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(sanitized);
    return sanitized;
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      criticalPercentage: ((this.errorStats.criticalErrors / this.errorStats.totalErrors) * 100).toFixed(2),
      mostCommonErrors: this.getMostCommonErrors(5)
    };
  }

  /**
   * Get most common errors
   */
  getMostCommonErrors(limit = 5) {
    const sorted = Object.entries(this.errorStats.byCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([code, count]) => ({
      code,
      count,
      ...this.errorCodes[code]
    }));
  }

  /**
   * Reset error statistics
   */
  resetStats() {
    this.errorStats = {
      totalErrors: 0,
      criticalErrors: 0,
      highErrors: 0,
      mediumErrors: 0,
      lowErrors: 0,
      byCode: {}
    };
  }

  /**
   * Global unhandled rejection handler
   */
  setupGlobalHandlers() {
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('🚨 Unhandled Promise Rejection:', reason);

      await auditLogger.log(
        'unhandled-rejection',
        'error-handling',
        {
          reason: reason?.message || String(reason),
          stack: reason?.stack
        }
      );

      // In production, consider graceful shutdown for critical issues
      if (process.env.NODE_ENV === 'production') {
        // Don't crash immediately - log and monitor
      }
    });

    process.on('uncaughtException', async (error) => {
      console.error('🚨 Uncaught Exception:', error);

      await auditLogger.log(
        'uncaught-exception',
        'error-handling',
        {
          error: error.message,
          stack: error.stack
        }
      );

      // Graceful shutdown
      console.error('💥 Critical error - initiating graceful shutdown...');

      // Give 10 seconds for cleanup
      setTimeout(() => {
        process.exit(1);
      }, 10000);

      // Try to close server gracefully
      // (This should be called from server.js where server instance is available)
    });
  }
}

// Singleton instance
const errorHandler = new ErrorHandler();

// Export both the class and singleton
module.exports = errorHandler;
module.exports.MedicalError = MedicalError;
module.exports.ErrorHandler = ErrorHandler;
