/**
 * Azure Application Insights Transport for Winston
 * 🔐 Security: Production-grade centralized logging
 *
 * Features:
 * - Automatic log aggregation to Azure
 * - Custom events and metrics
 * - Exception tracking
 * - Performance monitoring
 * - Real-time alerting integration
 *
 * Usage:
 *   Automatically integrated with production-logger.js
 */

const Transport = require('winston-transport');

let appInsights = null;
let appInsightsClient = null;

// Try to load Application Insights (graceful degradation if not configured)
try {
  appInsights = require('applicationinsights');
} catch (error) {
  // Application Insights not installed - will skip this transport
}

/**
 * Azure Application Insights Winston Transport
 */
class AzureApplicationInsightsTransport extends Transport {
  constructor(opts = {}) {
    super(opts);

    this.name = 'AzureApplicationInsights';
    this.level = opts.level || 'info';

    // Initialize Application Insights if connection string or instrumentation key is provided
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    const instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

    if (!appInsights) {
      console.warn('⚠️ Application Insights package not available - logs will not be sent to Azure');
      this.enabled = false;
      return;
    }

    if (!connectionString && !instrumentationKey) {
      console.warn('⚠️ Azure Application Insights not configured - set APPLICATIONINSIGHTS_CONNECTION_STRING or APPINSIGHTS_INSTRUMENTATIONKEY');
      this.enabled = false;
      return;
    }

    try {
      // Setup Application Insights
      appInsights.setup(connectionString || instrumentationKey)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(false) // We handle console logging via Winston
        .setUseDiskRetriesOnFailure(true)
        .setSendLiveMetrics(process.env.NODE_ENV === 'production')
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
        .start();

      appInsightsClient = appInsights.defaultClient;

      // Set cloud role name for better identification
      appInsightsClient.context.tags[appInsightsClient.context.keys.cloudRole] =
        process.env.AZURE_CLOUD_ROLE_NAME || 'ailydian-ultra-pro';

      appInsightsClient.context.tags[appInsightsClient.context.keys.cloudRoleInstance] =
        process.env.AZURE_CLOUD_ROLE_INSTANCE || process.env.VERCEL_REGION || 'local';

      this.client = appInsightsClient;
      this.enabled = true;

      console.log('✅ Azure Application Insights transport initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Azure Application Insights:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Log method called by Winston
   */
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (!this.enabled || !this.client) {
      return callback();
    }

    try {
      const { level, message, timestamp, ...meta } = info;

      // Map Winston levels to Application Insights severity
      const severityMap = {
        error: appInsights.Contracts.SeverityLevel.Error,
        warn: appInsights.Contracts.SeverityLevel.Warning,
        info: appInsights.Contracts.SeverityLevel.Information,
        http: appInsights.Contracts.SeverityLevel.Information,
        verbose: appInsights.Contracts.SeverityLevel.Verbose,
        debug: appInsights.Contracts.SeverityLevel.Verbose,
        silly: appInsights.Contracts.SeverityLevel.Verbose
      };

      const severity = severityMap[level] || appInsights.Contracts.SeverityLevel.Information;

      // Handle errors specially
      if (meta.error && meta.error.stack) {
        this.client.trackException({
          exception: meta.error,
          severity,
          properties: {
            message,
            level,
            timestamp,
            ...meta
          }
        });
      } else {
        // Track as trace event
        this.client.trackTrace({
          message: typeof message === 'string' ? message : JSON.stringify(message),
          severity,
          properties: {
            level,
            timestamp,
            ...meta
          }
        });
      }

      // Track custom metrics for performance
      if (meta.duration_ms) {
        this.client.trackMetric({
          name: meta.metricName || 'request_duration',
          value: meta.duration_ms,
          properties: {
            method: meta.method,
            url: meta.url,
            statusCode: meta.statusCode
          }
        });
      }

      // Track custom events for important actions
      if (meta.eventName) {
        this.client.trackEvent({
          name: meta.eventName,
          properties: {
            level,
            timestamp,
            ...meta
          }
        });
      }

      callback();
    } catch (error) {
      console.error('❌ Azure Insights Transport Error:', error.message);
      callback(error);
    }
  }

  /**
   * Flush pending telemetry (important for serverless)
   */
  async flush() {
    if (this.enabled && this.client) {
      return new Promise((resolve) => {
        this.client.flush({
          callback: (response) => {
            resolve(response);
          }
        });
      });
    }
  }
}

/**
 * Helper function to track custom events
 */
function trackEvent(eventName, properties = {}) {
  if (appInsightsClient) {
    appInsightsClient.trackEvent({
      name: eventName,
      properties
    });
  }
}

/**
 * Helper function to track custom metrics
 */
function trackMetric(metricName, value, properties = {}) {
  if (appInsightsClient) {
    appInsightsClient.trackMetric({
      name: metricName,
      value,
      properties
    });
  }
}

/**
 * Helper function to track dependencies (external API calls)
 */
function trackDependency(name, commandName, duration, success, properties = {}) {
  if (appInsightsClient) {
    appInsightsClient.trackDependency({
      target: name,
      name: commandName,
      data: commandName,
      duration,
      resultCode: success ? 0 : 1,
      success,
      dependencyTypeName: 'HTTP',
      properties
    });
  }
}

module.exports = {
  AzureApplicationInsightsTransport,
  trackEvent,
  trackMetric,
  trackDependency,
  getClient: () => appInsightsClient
};
