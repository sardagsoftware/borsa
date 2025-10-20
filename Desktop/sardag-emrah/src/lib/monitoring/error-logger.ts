/**
 * ERROR LOGGER
 *
 * Centralized error logging and tracking system
 * - Console logging
 * - Error aggregation
 * - Optional remote logging
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LoggedError {
  id: string;
  timestamp: number;
  message: string;
  severity: ErrorSeverity;
  context?: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private errors: LoggedError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory
  private enabled = true;

  /**
   * Log an error
   */
  logError(
    message: string,
    severity: ErrorSeverity = 'medium',
    context?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const loggedError: LoggedError = {
      id: this.generateId(),
      timestamp: Date.now(),
      message,
      severity,
      context,
      stack: error?.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata,
    };

    // Add to memory
    this.errors.push(loggedError);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Console logging
    this.logToConsole(loggedError);

    // TODO: Send to remote logging service (Sentry, LogRocket, etc.)
    // this.sendToRemote(loggedError);
  }

  /**
   * Log to console with proper formatting
   */
  private logToConsole(error: LoggedError): void {
    const emoji = this.getSeverityEmoji(error.severity);
    const color = this.getSeverityColor(error.severity);

    console.groupCollapsed(
      `%c${emoji} [${error.severity.toUpperCase()}] ${error.message}`,
      `color: ${color}; font-weight: bold`
    );

    console.log('Timestamp:', new Date(error.timestamp).toISOString());

    if (error.context) {
      console.log('Context:', error.context);
    }

    if (error.metadata) {
      console.log('Metadata:', error.metadata);
    }

    if (error.stack) {
      console.log('Stack:', error.stack);
    }

    console.log('URL:', error.url);
    console.log('User Agent:', error.userAgent);

    console.groupEnd();
  }

  /**
   * Get all logged errors
   */
  getErrors(): LoggedError[] {
    return [...this.errors];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): LoggedError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): LoggedError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    console.log('[Error Logger] All errors cleared');
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[Error Logger] Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    recentCount: number;
  } {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<ErrorSeverity, number>,
      recentCount: 0,
    };

    // Count by severity
    this.errors.forEach((error) => {
      stats.bySeverity[error.severity]++;
    });

    // Count recent (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    stats.recentCount = this.errors.filter((e) => e.timestamp > fiveMinutesAgo).length;

    return stats;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low':
        return 'ℹ️';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🚨';
      case 'critical':
        return '💥';
      default:
        return '❓';
    }
  }

  /**
   * Get color for severity
   */
  private getSeverityColor(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low':
        return '#3b82f6'; // blue
      case 'medium':
        return '#f59e0b'; // yellow
      case 'high':
        return '#ef4444'; // red
      case 'critical':
        return '#dc2626'; // dark red
      default:
        return '#6b7280'; // gray
    }
  }

  /**
   * Send error to remote logging service (placeholder)
   */
  private async sendToRemote(error: LoggedError): Promise<void> {
    // TODO: Implement remote logging
    // Example: Send to Sentry, LogRocket, custom backend, etc.
    //
    // try {
    //   await fetch('/api/logs/error', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(error)
    //   });
    // } catch (err) {
    //   console.error('[Error Logger] Failed to send error to remote:', err);
    // }
  }
}

// Singleton instance
let loggerInstance: ErrorLogger | null = null;

/**
 * Get error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  if (!loggerInstance) {
    loggerInstance = new ErrorLogger();
  }
  return loggerInstance;
}

/**
 * Convenience functions
 */
export function logError(
  message: string,
  severity: ErrorSeverity = 'medium',
  context?: string,
  error?: Error,
  metadata?: Record<string, any>
): void {
  getErrorLogger().logError(message, severity, context, error, metadata);
}

export function logLowError(message: string, context?: string, metadata?: Record<string, any>): void {
  logError(message, 'low', context, undefined, metadata);
}

export function logMediumError(message: string, context?: string, metadata?: Record<string, any>): void {
  logError(message, 'medium', context, undefined, metadata);
}

export function logHighError(message: string, context?: string, error?: Error, metadata?: Record<string, any>): void {
  logError(message, 'high', context, error, metadata);
}

export function logCriticalError(message: string, context?: string, error?: Error, metadata?: Record<string, any>): void {
  logError(message, 'critical', context, error, metadata);
}

/**
 * Global error handler (catch unhandled errors)
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logCriticalError(
      event.message,
      'Unhandled Error',
      event.error,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logCriticalError(
      'Unhandled Promise Rejection',
      'Promise',
      event.reason instanceof Error ? event.reason : undefined,
      {
        reason: event.reason,
      }
    );
  });

  console.log('[Error Logger] ✅ Global error handler setup complete');
}
