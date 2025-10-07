/**
 * Sentry Error Tracking
 * Production-grade error monitoring and reporting
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

function initializeSentry(app) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sentryDSN = process.env.SENTRY_DSN;

  if (!sentryDSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    console.warn('   Set SENTRY_DSN environment variable to enable.');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration()
    ],

    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }

      if (event.extra) {
        delete event.extra.apiKey;
        delete event.extra.password;
      }

      return event;
    }
  });

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  console.log('✅ Sentry error tracking initialized');
  console.log(`   Environment: ${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV}`);
  console.log(`   Traces Sample Rate: ${parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1}`);
}

function setupSentryErrorHandler(app) {
  // Error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());

  console.log('✅ Sentry error handler configured');
}

module.exports = {
  initializeSentry,
  setupSentryErrorHandler,
  Sentry
};
