/**
 * Error Tracking System
 * Custom error tracking without external dependencies
 * Stores errors in database and sends alerts
 *
 * White-Hat Policy: Defensive monitoring only
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Error categories
 */
export const ErrorCategory = {
  API: 'api',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  RATE_LIMIT: 'rate_limit',
  VALIDATION: 'validation',
  EXTERNAL_SERVICE: 'external_service',
  INTERNAL: 'internal',
};

/**
 * Error tracking class
 */
export class ErrorTracker {
  constructor(options = {}) {
    this.appName = options.appName || 'LyDian Platform';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.version = options.version || '1.0.0';
    this.enableConsole = options.enableConsole !== false;
    this.enableDatabase = options.enableDatabase !== false;
  }

  /**
   * Track an error
   */
  async track(error, context = {}) {
    const errorData = this._formatError(error, context);

    // Log to console in development
    if (this.enableConsole && this.environment === 'development') {
      console.error('[ERROR TRACKER]', errorData);
    }

    // Store in database
    if (this.enableDatabase) {
      await this._storeInDatabase(errorData);
    }

    // Send alerts for critical errors
    if (errorData.severity === ErrorSeverity.CRITICAL) {
      await this._sendAlert(errorData);
    }

    return errorData;
  }

  /**
   * Track API error
   */
  async trackAPIError(error, req, context = {}) {
    return this.track(error, {
      category: ErrorCategory.API,
      request: {
        method: req.method,
        url: req.url,
        headers: this._sanitizeHeaders(req.headers),
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      },
      ...context,
    });
  }

  /**
   * Track database error
   */
  async trackDatabaseError(error, query, context = {}) {
    return this.track(error, {
      category: ErrorCategory.DATABASE,
      query: this._sanitizeQuery(query),
      ...context,
    });
  }

  /**
   * Track authentication error
   */
  async trackAuthError(error, userId, context = {}) {
    return this.track(error, {
      category: ErrorCategory.AUTHENTICATION,
      userId,
      ...context,
    });
  }

  /**
   * Format error for storage
   */
  _formatError(error, context = {}) {
    const timestamp = new Date().toISOString();

    return {
      id: this._generateId(),
      timestamp,
      environment: this.environment,
      appName: this.appName,
      version: this.version,

      // Error details
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack || null,
      code: error.code || null,

      // Context
      category: context.category || ErrorCategory.INTERNAL,
      severity: context.severity || this._determineSeverity(error),
      userId: context.userId || null,
      sessionId: context.sessionId || null,
      request: context.request || null,
      query: context.query || null,
      metadata: context.metadata || {},

      // Debugging info
      userAgent: context.userAgent || null,
      browser: context.browser || null,
      os: context.os || null,
    };
  }

  /**
   * Determine error severity
   */
  _determineSeverity(error) {
    // Critical errors
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('FATAL') ||
        error.message?.includes('Critical')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (error.code === 'UNAUTHORIZED' ||
        error.code === 'FORBIDDEN' ||
        error.statusCode >= 500) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (error.statusCode >= 400) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Store error in database
   */
  async _storeInDatabase(errorData) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert({
          error_id: errorData.id,
          timestamp: errorData.timestamp,
          environment: errorData.environment,
          app_name: errorData.appName,
          version: errorData.version,
          message: errorData.message,
          name: errorData.name,
          stack: errorData.stack,
          code: errorData.code,
          category: errorData.category,
          severity: errorData.severity,
          user_id: errorData.userId,
          session_id: errorData.sessionId,
          request_data: errorData.request,
          query_data: errorData.query,
          metadata: errorData.metadata,
          user_agent: errorData.userAgent,
        });

      if (error) {
        console.error('Failed to store error in database:', error);
      }
    } catch (dbError) {
      // Don't throw errors in error tracker
      console.error('Error tracker database error:', dbError);
    }
  }

  /**
   * Send alert for critical errors
   */
  async _sendAlert(errorData) {
    // TODO: Implement alert system (email, Slack, Discord)
    console.error('🚨 CRITICAL ERROR ALERT:', {
      id: errorData.id,
      message: errorData.message,
      timestamp: errorData.timestamp,
      category: errorData.category,
    });
  }

  /**
   * Sanitize sensitive headers
   */
  _sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'cookie', 'x-signature'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize database query
   */
  _sanitizeQuery(query) {
    if (typeof query === 'string') {
      // Remove sensitive data from query strings
      return query.replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
                  .replace(/api_key\s*=\s*'[^']*'/gi, "api_key='[REDACTED]'");
    }
    return query;
  }

  /**
   * Generate unique error ID
   */
  _generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  async getStats(timeRange = '24h') {
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('error_logs')
        .select('severity, category')
        .gte('timestamp', since);

      if (error) throw error;

      // Calculate stats
      const stats = {
        total: data.length,
        bySeverity: {},
        byCategory: {},
      };

      data.forEach(item => {
        stats.bySeverity[item.severity] = (stats.bySeverity[item.severity] || 0) + 1;
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  /**
   * Get recent errors
   */
  async getRecentErrors(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }
}

// Create default instance
export const errorTracker = new ErrorTracker({
  appName: 'LyDian Platform',
  environment: process.env.NODE_ENV,
  version: process.env.APP_VERSION || '1.0.0',
});

// Export error handler middleware for Express/Next.js
export function errorHandlerMiddleware(err, req, res, next) {
  // Track the error
  errorTracker.trackAPIError(err, req, {
    severity: err.severity || ErrorSeverity.HIGH,
    userId: req.user?.id || null,
    sessionId: req.session?.id || null,
  });

  // Send error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      errorId: err.errorId || null,
    },
  });
}

export default ErrorTracker;
