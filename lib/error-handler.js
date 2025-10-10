/**
 * SECURE ERROR HANDLER
 * Hides stack traces in production, prevents information disclosure
 * SECURITY FIX: STACK-TRACE-EXPOSURE-2025
 */

/**
 * Secure error logging
 * Logs errors without exposing sensitive information
 */
class SecureErrorHandler {
  /**
   * Log error securely (no stack traces in production)
   */
  static logError(error, req = null, additionalContext = {}) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      errorType: error.name || 'Error',
      ...additionalContext
    };

    // Add request context if available (sanitized)
    if (req) {
      errorDetails.url = req.url;
      errorDetails.method = req.method;
      errorDetails.userId = req.user?.id || req.session?.userId || 'anonymous';
      errorDetails.ip = req.ip || req.connection?.remoteAddress;
      errorDetails.userAgent = req.get('user-agent');
    }

    // In development, log full error with stack
    if (process.env.NODE_ENV !== 'production') {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🐛 ERROR DETAILS (Development)');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      console.error('Type:', error.name);
      console.error('Context:', errorDetails);
      console.error('Stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // In production, log to secure logging service (no stack trace)
    // This prevents information disclosure via error logs
    console.error('[ERROR]', JSON.stringify(errorDetails));

    // TODO: Send to external logging service (Sentry, Datadog, etc.)
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: errorDetails });
    // }
  }

  /**
   * Send safe error response to client
   * Never exposes stack traces or sensitive information
   */
  static sendErrorResponse(res, error, statusCode = 500) {
    // Generic safe messages for production
    const safeMessages = {
      400: 'Invalid request',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      409: 'Resource conflict',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable'
    };

    const response = {
      error: true,
      message: safeMessages[statusCode] || safeMessages[500],
      statusCode: statusCode,
      timestamp: new Date().toISOString()
    };

    // In development, include actual error details
    if (process.env.NODE_ENV !== 'production') {
      response.details = error.message;
      response.stack = error.stack;
      response.originalError = error.name;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Get safe error message for display
   */
  static getSafeErrorMessage(error, statusCode = 500) {
    const safeMessages = {
      400: 'The request was invalid',
      401: 'You must be logged in to access this resource',
      403: 'You do not have permission to access this resource',
      404: 'The requested resource was not found',
      429: 'Too many requests. Please try again later',
      500: 'An unexpected error occurred',
      503: 'The service is temporarily unavailable'
    };

    // In production, return generic message
    if (process.env.NODE_ENV === 'production') {
      return safeMessages[statusCode] || safeMessages[500];
    }

    // In development, return actual message
    return error.message || safeMessages[statusCode] || 'Unknown error';
  }

  /**
   * Express error handling middleware
   * Use at the end of all routes: app.use(SecureErrorHandler.middleware())
   */
  static middleware() {
    return (err, req, res, next) => {
      // Log error securely
      this.logError(err, req, {
        handler: 'global-error-middleware'
      });

      // Determine status code
      const statusCode = err.statusCode || err.status || 500;

      // Send safe response
      this.sendErrorResponse(res, err, statusCode);
    };
  }

  /**
   * Async route wrapper (catches async errors)
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Not found handler (404)
   */
  static notFoundHandler() {
    return (req, res) => {
      const error = new Error('Route not found');
      error.statusCode = 404;
      this.sendErrorResponse(res, error, 404);
    };
  }
}

module.exports = SecureErrorHandler;
