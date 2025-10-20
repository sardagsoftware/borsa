// ========================================
// Sentry Error Tracking & Performance Monitoring
// Beyaz Şapkalı - Defensive Monitoring Only
// ========================================

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_TEST = NODE_ENV === 'test';

// Sentry configuration (opt-in, disabled by default in dev/test)
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const SENTRY_ENABLED = IS_PRODUCTION && SENTRY_DSN.length > 0;

// Sample rates (beyaz şapkalı - minimal in dev)
const TRACES_SAMPLE_RATE = IS_PRODUCTION ? 0.1 : 0.0; // 10% in prod, 0% in dev
const PROFILES_SAMPLE_RATE = IS_PRODUCTION ? 0.1 : 0.0; // 10% in prod, 0% in dev

/**
 * Initialize Sentry
 * - Error tracking: Always enabled in production
 * - Performance monitoring: Opt-in via SENTRY_ENABLE_TRACING
 * - Profiling: Opt-in via SENTRY_ENABLE_PROFILING
 */
function initSentry(app) {
  if (!SENTRY_ENABLED) {
    console.log('⚠️  Sentry disabled (no DSN or not in production)');
    return null;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,

      // Integrations
      integrations: [
        // HTTP tracing
        new Sentry.Integrations.Http({ tracing: true }),

        // Express integration (if app is provided)
        ...(app ? [new Sentry.Integrations.Express({ app })] : []),

        // Profiling (opt-in)
        ...(process.env.SENTRY_ENABLE_PROFILING === 'true'
          ? [new ProfilingIntegration()]
          : []
        ),
      ],

      // Performance monitoring (opt-in)
      tracesSampleRate: process.env.SENTRY_ENABLE_TRACING === 'true'
        ? TRACES_SAMPLE_RATE
        : 0.0,

      // Profiling sample rate
      profilesSampleRate: process.env.SENTRY_ENABLE_PROFILING === 'true'
        ? PROFILES_SAMPLE_RATE
        : 0.0,

      // Sensitive data scrubbing (beyaz şapkalı)
      beforeSend(event, hint) {
        // Sanitize sensitive data
        if (event.request) {
          // Remove authorization headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
            delete event.request.headers['x-csrf-token'];
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            const sanitizedQuery = event.request.query_string
              .replace(/api[_-]?key=[^&]*/gi, 'api_key=[REDACTED]')
              .replace(/token=[^&]*/gi, 'token=[REDACTED]')
              .replace(/password=[^&]*/gi, 'password=[REDACTED]')
              .replace(/secret=[^&]*/gi, 'secret=[REDACTED]');
            event.request.query_string = sanitizedQuery;
          }

          // Remove sensitive POST data
          if (event.request.data) {
            const sanitizedData = { ...event.request.data };
            if (sanitizedData.password) sanitizedData.password = '[REDACTED]';
            if (sanitizedData.apiKey) sanitizedData.apiKey = '[REDACTED]';
            if (sanitizedData.token) sanitizedData.token = '[REDACTED]';
            if (sanitizedData.secret) sanitizedData.secret = '[REDACTED]';
            event.request.data = sanitizedData;
          }
        }

        // Sanitize user data
        if (event.user) {
          if (event.user.email) {
            // Hash email for privacy (beyaz şapkalı)
            const crypto = require('crypto');
            event.user.email = crypto
              .createHash('sha256')
              .update(event.user.email)
              .digest('hex')
              .substring(0, 8);
          }
          if (event.user.ip_address) {
            event.user.ip_address = '[REDACTED]';
          }
        }

        // Sanitize breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data && breadcrumb.data.url) {
              breadcrumb.data.url = breadcrumb.data.url
                .replace(/api[_-]?key=[^&]*/gi, 'api_key=[REDACTED]')
                .replace(/token=[^&]*/gi, 'token=[REDACTED]');
            }
            return breadcrumb;
          });
        }

        return event;
      },

      // Ignore certain errors (beyaz şapkalı - reduce noise)
      ignoreErrors: [
        // Network errors
        'NetworkError',
        'Network request failed',

        // Browser errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Common non-critical errors
        'Non-Error promise rejection captured',
        'Non-Error exception captured',

        // CSRF token errors (handled by middleware)
        'CSRF token validation failed',
        'Invalid CSRF token',

        // Rate limiting (expected behavior)
        'Too Many Requests',
        'Rate limit exceeded',
      ],

      // Ignore certain transactions (beyaz şapkalı)
      ignoreTransactions: [
        '/health',
        '/api/health',
        '/ping',
        '/metrics',
        '/favicon.ico',
      ],
    });

    console.log('✅ Sentry initialized');
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Tracing: ${process.env.SENTRY_ENABLE_TRACING === 'true' ? 'enabled' : 'disabled'}`);
    console.log(`   Profiling: ${process.env.SENTRY_ENABLE_PROFILING === 'true' ? 'enabled' : 'disabled'}`);

    return Sentry;
  } catch (error) {
    console.error('❌ Sentry initialization failed:', error.message);
    return null;
  }
}

/**
 * Request handler middleware
 */
function requestHandler() {
  if (!SENTRY_ENABLED) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Tracing handler middleware (opt-in)
 */
function tracingHandler() {
  if (!SENTRY_ENABLED || process.env.SENTRY_ENABLE_TRACING !== 'true') {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Error handler middleware (must be last)
 */
function errorHandler() {
  if (!SENTRY_ENABLED) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only capture server errors (5xx), not client errors (4xx)
      return error.status >= 500 || !error.status;
    },
  });
}

/**
 * Capture exception manually
 */
function captureException(error, context = {}) {
  if (!SENTRY_ENABLED) {
    return null;
  }

  return Sentry.captureException(error, {
    level: 'error',
    tags: {
      component: context.component || 'unknown',
      environment: NODE_ENV,
    },
    extra: context,
  });
}

/**
 * Capture message manually
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!SENTRY_ENABLED) {
    return null;
  }

  return Sentry.captureMessage(message, {
    level: level,
    tags: {
      component: context.component || 'unknown',
      environment: NODE_ENV,
    },
    extra: context,
  });
}

/**
 * Add breadcrumb
 */
function addBreadcrumb(breadcrumb) {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set user context
 */
function setUser(user) {
  if (!SENTRY_ENABLED) {
    return;
  }

  // Sanitize user data (beyaz şapkalı)
  const sanitizedUser = {
    id: user.id || user.userId,
    // Hash email for privacy
    email: user.email
      ? require('crypto')
          .createHash('sha256')
          .update(user.email)
          .digest('hex')
          .substring(0, 8)
      : undefined,
  };

  Sentry.setUser(sanitizedUser);
}

/**
 * Flush events (useful before shutdown)
 */
async function flush(timeout = 2000) {
  if (!SENTRY_ENABLED) {
    return true;
  }

  return Sentry.close(timeout);
}

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  flush,
  SENTRY_ENABLED,
};
