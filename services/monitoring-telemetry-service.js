// ============================================================================
// AILYDIAN - Monitoring & Telemetry Service
// ============================================================================
// Integrates Application Insights (Azure) and Sentry for comprehensive
// production monitoring, error tracking, and performance telemetry.
// ============================================================================

const appInsights = require('applicationinsights');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// ============================================================================
// Configuration
// ============================================================================

const config = {
  // Azure Application Insights
  appInsights: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    enabled: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    samplingPercentage: parseInt(process.env.TELEMETRY_SAMPLING_PERCENTAGE || '100', 10),
    disableAppInsights: process.env.DISABLE_APPINSIGHTS === 'true',
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'ailydian@1.0.0',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '1.0'),
  },

  // Service metadata
  service: {
    name: 'ailydian-ultra-pro',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
};

// ============================================================================
// Telemetry Service Class
// ============================================================================

class MonitoringTelemetryService {
  constructor() {
    this.appInsightsClient = null;
    this.sentryInitialized = false;
    this.isInitialized = false;
  }

  /**
   * Initialize monitoring services
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️  Monitoring already initialized');
      return;
    }

    console.log('🔍 Initializing monitoring services...');

    // Initialize Application Insights
    this._initializeAppInsights();

    // Initialize Sentry
    this._initializeSentry();

    this.isInitialized = true;
    console.log('✅ Monitoring services initialized');
  }

  /**
   * Initialize Azure Application Insights
   * @private
   */
  _initializeAppInsights() {
    if (!config.appInsights.enabled || config.appInsights.disableAppInsights) {
      console.log('⏭️  Application Insights disabled (missing connection string)');
      return;
    }

    try {
      appInsights
        .setup(config.appInsights.connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setInternalLogging(false, true);

      // Set sampling percentage
      appInsights.defaultClient.config.samplingPercentage = config.appInsights.samplingPercentage;

      // Add cloud role name
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] =
        config.service.name;

      // Start tracking
      appInsights.start();

      this.appInsightsClient = appInsights.defaultClient;

      console.log('✅ Application Insights initialized');
      console.log(`   → Sampling: ${config.appInsights.samplingPercentage}%`);
    } catch (error) {
      console.error('❌ Application Insights initialization failed:', error.message);
    }
  }

  /**
   * Initialize Sentry error tracking
   * @private
   */
  _initializeSentry() {
    if (!config.sentry.enabled) {
      console.log('⏭️  Sentry disabled (missing DSN)');
      return;
    }

    try {
      // Build integrations array (profiling optional for compatibility)
      const integrations = [];

      // Add profiling only if available (graceful degradation)
      try {
        if (ProfilingIntegration && typeof ProfilingIntegration === 'function') {
          integrations.push(new ProfilingIntegration());
        }
      } catch (profilingError) {
        console.log('⚠️  Sentry profiling not available (skipping)');
      }

      Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.sentry.environment,
        release: config.sentry.release,

        // Performance Monitoring
        tracesSampleRate: config.sentry.tracesSampleRate,
        profilesSampleRate: config.sentry.profilesSampleRate,

        // Integrations (optional profiling)
        integrations,

        // Error filtering
        beforeSend(event, hint) {
          // Filter out non-critical errors in development
          if (config.sentry.environment === 'development') {
            const error = hint.originalException;
            if (error && error.message && error.message.includes('ECONNREFUSED')) {
              return null; // Don't send connection errors in dev
            }
          }
          return event;
        },

        // Set context
        initialScope: {
          tags: {
            service: config.service.name,
            version: config.service.version,
          },
        },
      });

      this.sentryInitialized = true;

      console.log('✅ Sentry initialized');
      console.log(`   → Environment: ${config.sentry.environment}`);
      console.log(`   → Release: ${config.sentry.release}`);
    } catch (error) {
      console.error('❌ Sentry initialization failed:', error.message);
    }
  }

  // ==========================================================================
  // Error Tracking
  // ==========================================================================

  /**
   * Track an error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  trackError(error, context = {}) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.trackException({
        exception: error,
        properties: context,
      });
    }

    // Sentry
    if (this.sentryInitialized) {
      Sentry.withScope(scope => {
        // Add context
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });

        // Capture exception
        Sentry.captureException(error);
      });
    }

    // Console logging
    console.error('❌ Error tracked:', error?.message || 'Unknown error', context);
  }

  /**
   * Track a message
   * @param {string} message - Message text
   * @param {string} severity - Severity level (info, warning, error)
   * @param {Object} properties - Additional properties
   */
  trackMessage(message, severity = 'info', properties = {}) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.trackTrace({
        message,
        severity: this._mapSeverity(severity),
        properties,
      });
    }

    // Sentry
    if (this.sentryInitialized) {
      const sentryLevel = this._mapSentryLevel(severity);
      Sentry.captureMessage(message, {
        level: sentryLevel,
        extra: properties,
      });
    }
  }

  // ==========================================================================
  // Performance Tracking
  // ==========================================================================

  /**
   * Track a custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} properties - Additional properties
   */
  trackMetric(name, value, properties = {}) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.trackMetric({
        name,
        value,
        properties,
      });
    }

    console.log(`📊 Metric: ${name} = ${value}`, properties);
  }

  /**
   * Track request duration
   * @param {string} name - Request name
   * @param {number} duration - Duration in ms
   * @param {boolean} success - Whether request succeeded
   * @param {Object} properties - Additional properties
   */
  trackRequest(name, duration, success, properties = {}) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.trackRequest({
        name,
        duration,
        success,
        resultCode: success ? 200 : 500,
        properties,
      });
    }
  }

  /**
   * Track dependency call
   * @param {string} dependencyTypeName - Type of dependency (HTTP, SQL, etc.)
   * @param {string} name - Dependency name
   * @param {string} data - Command or URL
   * @param {number} duration - Duration in ms
   * @param {boolean} success - Whether call succeeded
   */
  trackDependency(dependencyTypeName, name, data, duration, success) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.trackDependency({
        dependencyTypeName,
        name,
        data,
        duration,
        success,
        resultCode: success ? 200 : 500,
      });
    }
  }

  // ==========================================================================
  // User & Session Tracking
  // ==========================================================================

  /**
   * Set user context
   * @param {string} userId - User ID
   * @param {Object} properties - Additional user properties
   */
  setUser(userId, properties = {}) {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.context.tags[this.appInsightsClient.context.keys.userId] = userId;
    }

    // Sentry
    if (this.sentryInitialized) {
      Sentry.setUser({
        id: userId,
        ...properties,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    // Application Insights
    if (this.appInsightsClient) {
      this.appInsightsClient.context.tags[this.appInsightsClient.context.keys.userId] = undefined;
    }

    // Sentry
    if (this.sentryInitialized) {
      Sentry.setUser(null);
    }
  }

  // ==========================================================================
  // Express Middleware
  // ==========================================================================

  /**
   * Get Express error handler middleware
   * @returns {Function} Express middleware
   */
  getErrorHandler() {
    return (err, req, res, next) => {
      // Track error
      this.trackError(err, {
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
      });

      // Pass to next error handler
      next(err);
    };
  }

  /**
   * Get Express request handler middleware (for Sentry)
   * @returns {Function} Express middleware
   */
  getRequestHandler() {
    if (this.sentryInitialized) {
      return Sentry.Handlers.requestHandler();
    }
    return (req, res, next) => next();
  }

  /**
   * Get Express tracing handler middleware (for Sentry)
   * @returns {Function} Express middleware
   */
  getTracingHandler() {
    if (this.sentryInitialized) {
      return Sentry.Handlers.tracingHandler();
    }
    return (req, res, next) => next();
  }

  /**
   * Get Express error handler middleware (for Sentry)
   * @returns {Function} Express middleware
   */
  getSentryErrorHandler() {
    if (this.sentryInitialized) {
      return Sentry.Handlers.errorHandler();
    }
    return (err, req, res, next) => next(err);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Map severity level to Application Insights severity
   * @param {string} severity
   * @returns {number}
   * @private
   */
  _mapSeverity(severity) {
    const severityMap = {
      verbose: 0,
      info: 1,
      warning: 2,
      error: 3,
      critical: 4,
    };
    const level = severity.toLowerCase();
    return level in severityMap ? severityMap[level] : 1;
  }

  /**
   * Map severity level to Sentry level
   * @param {string} severity
   * @returns {string}
   * @private
   */
  _mapSentryLevel(severity) {
    const levelMap = {
      verbose: 'debug',
      info: 'info',
      warning: 'warning',
      error: 'error',
      critical: 'fatal',
    };
    return levelMap[severity.toLowerCase()] || 'info';
  }

  /**
   * Flush all pending telemetry
   * @returns {Promise<void>}
   */
  async flush() {
    const promises = [];

    // Flush Application Insights
    if (this.appInsightsClient) {
      promises.push(
        new Promise(resolve => {
          this.appInsightsClient.flush({
            callback: () => {
              console.log('✅ Application Insights flushed');
              resolve();
            },
          });
        })
      );
    }

    // Flush Sentry
    if (this.sentryInitialized) {
      promises.push(
        Sentry.close(2000).then(() => {
          console.log('✅ Sentry flushed');
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Get health status
   * @returns {Object} Health status
   */
  getHealth() {
    return {
      status: this.isInitialized ? 'OK' : 'NOT_INITIALIZED',
      services: {
        applicationInsights: {
          enabled: config.appInsights.enabled,
          initialized: !!this.appInsightsClient,
        },
        sentry: {
          enabled: config.sentry.enabled,
          initialized: this.sentryInitialized,
        },
      },
      config: {
        environment: config.service.environment,
        version: config.service.version,
      },
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const monitoringService = new MonitoringTelemetryService();

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  monitoringService,
  MonitoringTelemetryService,

  // Convenience methods
  trackError: (...args) => monitoringService.trackError(...args),
  trackMessage: (...args) => monitoringService.trackMessage(...args),
  trackMetric: (...args) => monitoringService.trackMetric(...args),
  trackRequest: (...args) => monitoringService.trackRequest(...args),
  trackDependency: (...args) => monitoringService.trackDependency(...args),
  setUser: (...args) => monitoringService.setUser(...args),
  clearUser: () => monitoringService.clearUser(),
  flush: () => monitoringService.flush(),
  getHealth: () => monitoringService.getHealth(),

  // Middleware
  getErrorHandler: () => monitoringService.getErrorHandler(),
  getRequestHandler: () => monitoringService.getRequestHandler(),
  getTracingHandler: () => monitoringService.getTracingHandler(),
  getSentryErrorHandler: () => monitoringService.getSentryErrorHandler(),
};
