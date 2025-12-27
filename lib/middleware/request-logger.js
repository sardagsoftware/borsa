/**
 * Request Logging Middleware
 * 🔐 Security: Production-grade request/response logging
 *
 * Features:
 * - Automatic request/response logging
 * - Performance timing
 * - Error tracking
 * - PII-safe logging
 * - Azure Application Insights integration
 *
 * Usage:
 *   app.use(requestLogger);
 */

const logger = require('../logger/production-logger');

/**
 * Request Logger Middleware
 * Logs all incoming requests and outgoing responses with timing
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Attach request ID to request object
  req.requestId = requestId;

  // Log incoming request
  logger.info('Incoming Request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    userId: req.user?.id,
    sessionId: req.session?.id
  });

  // Capture original res.end
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function(chunk, encoding) {
    // Calculate duration
    const duration = Date.now() - startTime;

    // Determine log level based on status code
    const statusCode = res.statusCode;
    let level = 'info';
    if (statusCode >= 500) {
      level = 'error';
    } else if (statusCode >= 400) {
      level = 'warn';
    }

    // Log response
    logger.log(level, 'Outgoing Response', {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration_ms: duration,
      contentType: res.getHeader('content-type'),
      contentLength: res.getHeader('content-length'),
      userId: req.user?.id,
      sessionId: req.session?.id,
      // Performance classification
      performance: duration < 100 ? 'excellent' : duration < 500 ? 'good' : duration < 1000 ? 'acceptable' : 'slow'
    });

    // Log slow requests separately
    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        requestId,
        method: req.method,
        url: req.url,
        duration_ms: duration,
        threshold_ms: 1000
      });
    }

    // Call original res.end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Error Logging Middleware
 * Logs all errors with full context
 */
function errorLogger(err, req, res, next) {
  logger.error('Request Error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    statusCode: err.statusCode || err.status || 500,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    userId: req.user?.id,
    sessionId: req.session?.id
  });

  next(err);
}

module.exports = {
  requestLogger,
  errorLogger
};
