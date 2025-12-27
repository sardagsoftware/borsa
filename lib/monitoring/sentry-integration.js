/**
 * Sentry Error Monitoring Integration
 * 🔐 Security: Production-grade error tracking
 *
 * Features:
 * - Real-time error tracking
 * - Performance monitoring
 * - Release tracking
 * - Source maps support
 * - User context tracking
 * - Breadcrumbs for debugging
 * - Integration with Winston logger
 *
 * Usage:
 *   const { initializeSentry } = require('./lib/monitoring/sentry-integration');
 *   initializeSentry(app);
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../logger/production-logger');

/**
 * Initialize Sentry with production-ready configuration
 */
function initializeSentry(app) {
  // Only initialize in production or when explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const sentryEnabled = process.env.SENTRY_ENABLED === 'true';
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    logger.warn('Sentry DSN not configured - error monitoring disabled');
    return {
      initialized: false,
      captureException: () => {},
      captureMessage: () => {},
      setUser: () => {},
      addBreadcrumb: () => {}
    };
  }

  if (!isProduction && !sentryEnabled) {
    logger.info('Sentry disabled in non-production environment');
    return {
      initialized: false,
      captureException: () => {},
      captureMessage: () => {},
      setUser: () => {},
      addBreadcrumb: () => {}
    };
  }

  try {
    Sentry.init({
      dsn: sentryDsn,

      // Environment configuration
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

      // Performance Monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% of transactions
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'), // 10% profile

      // Integrations
      integrations: [
        // Express integration (must be before other integrations)
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),

        // Profiling integration
        new ProfilingIntegration(),

        // Request data integration
        new Sentry.Integrations.RequestData({
          include: {
            cookies: false, // Don't capture cookies (may contain sensitive data)
            data: true,
            headers: true,
            ip: true,
            query_string: true,
            url: true,
            user: {
              id: true,
              username: true,
              email: false // Don't capture email (PII)
            }
          }
        }),
      ],

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !sentryEnabled) {
          return null;
        }

        // Filter out expected errors
        const error = hint.originalException;
        if (error && error.message) {
          // Don't report validation errors
          if (error.message.includes('Validation failed')) {
            return null;
          }

          // Don't report 404 errors
          if (error.statusCode === 404 || error.status === 404) {
            return null;
          }

          // Don't report rate limit errors
          if (error.message.includes('Too many requests')) {
            return null;
          }
        }

        // Scrub sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }

          // Remove sensitive query parameters
          if (event.request.query_string) {
            event.request.query_string = event.request.query_string
              .replace(/token=[^&]*/gi, 'token=[REDACTED]')
              .replace(/key=[^&]*/gi, 'key=[REDACTED]')
              .replace(/secret=[^&]*/gi, 'secret=[REDACTED]');
          }
        }

        // Scrub sensitive data from extra context
        if (event.extra) {
          const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key'];
          sensitiveKeys.forEach(key => {
            if (event.extra[key]) {
              event.extra[key] = '[REDACTED]';
            }
          });
        }

        return event;
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb, hint) {
        // Don't capture sensitive console logs
        if (breadcrumb.category === 'console') {
          const message = breadcrumb.message || '';
          if (message.includes('password') || message.includes('token') || message.includes('secret')) {
            return null;
          }
        }

        return breadcrumb;
      },

      // Performance
      maxBreadcrumbs: 50,
      attachStacktrace: true,

      // Debugging (only in development)
      debug: process.env.NODE_ENV === 'development',
    });

    logger.info('Sentry initialized successfully', {
      environment: Sentry.getCurrentHub().getClient()?.getOptions().environment,
      release: Sentry.getCurrentHub().getClient()?.getOptions().release,
      tracesSampleRate: Sentry.getCurrentHub().getClient()?.getOptions().tracesSampleRate
    });

    return {
      initialized: true,
      captureException: Sentry.captureException.bind(Sentry),
      captureMessage: Sentry.captureMessage.bind(Sentry),
      setUser: Sentry.setUser.bind(Sentry),
      addBreadcrumb: Sentry.addBreadcrumb.bind(Sentry),
      Sentry
    };

  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });

    // Return no-op functions if initialization fails
    return {
      initialized: false,
      captureException: () => {},
      captureMessage: () => {},
      setUser: () => {},
      addBreadcrumb: () => {}
    };
  }
}

/**
 * Sentry request handler middleware
 * Must be used BEFORE all other middleware
 */
function sentryRequestHandler() {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.requestHandler({
      ip: true,
      request: true,
      transaction: true,
      user: ['id', 'username']
    });
  }
  return (req, res, next) => next();
}

/**
 * Sentry tracing handler middleware
 * Must be used AFTER request handler but BEFORE routes
 */
function sentryTracingHandler() {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.tracingHandler();
  }
  return (req, res, next) => next();
}

/**
 * Sentry error handler middleware
 * Must be used AFTER all routes and other error handlers
 */
function sentryErrorHandler() {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all errors with status code >= 500
        return error.status >= 500 || !error.status;
      }
    });
  }
  return (err, req, res, next) => next(err);
}

/**
 * Capture exception with context
 */
function captureExceptionWithContext(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    // Add tags
    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    // Capture exception
    Sentry.captureException(error);
  });

  // Also log to Winston
  logger.error('Exception captured by Sentry', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  });
}

/**
 * Capture message with level
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    // Capture message
    Sentry.captureMessage(message, level);
  });

  // Also log to Winston
  logger[level](message, context);
}

/**
 * Set user context for error tracking
 */
function setUserContext(user) {
  if (!process.env.SENTRY_DSN || !user) {
    return;
  }

  Sentry.setUser({
    id: user.id || user._id,
    username: user.username || user.name,
    // Don't include email or other PII
  });
}

/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(message, category, level = 'info', data = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Close Sentry connection gracefully
 */
async function closeSentry() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    await Sentry.close(2000); // Wait up to 2 seconds for events to be sent
    logger.info('Sentry connection closed');
  } catch (error) {
    logger.error('Error closing Sentry connection', { error });
  }
}

module.exports = {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureExceptionWithContext,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  closeSentry,
  Sentry
};
