/**
 * 🔍 Azure Application Insights Integration
 * Enterprise-grade telemetry, monitoring, and analytics
 *
 * Features:
 * - Real-time request tracking
 * - Performance monitoring
 * - Exception tracking
 * - Custom events and metrics
 * - Dependency tracking
 * - User analytics
 */

const appInsights = require('applicationinsights');

class ApplicationInsightsService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.connectionString = process.env.AZURE_APPINSIGHTS_CONNECTION_STRING;
    this.instrumentationKey = process.env.AZURE_APPINSIGHTS_KEY;
  }

  /**
   * Initialize Application Insights
   */
  initialize() {
    try {
      if (!this.connectionString && !this.instrumentationKey) {
        console.warn('⚠️ Azure Application Insights not configured');
        return false;
      }

      // Setup with connection string (preferred) or instrumentation key
      if (this.connectionString) {
        appInsights.setup(this.connectionString);
      } else {
        appInsights.setup(this.instrumentationKey);
      }

      // Configure auto-collection (v3 API compatible - only chainable methods)
      appInsights
        .setAutoCollectRequests(true)       // HTTP requests
        .setAutoCollectPerformance(true)    // Performance counters
        .setAutoCollectExceptions(true)     // Exceptions
        .setAutoCollectDependencies(true)   // Dependencies (DB, APIs)
        .start();

      // Get client for post-initialization config
      const client = appInsights.defaultClient;

      // Post-initialization config (v3 API - non-chainable methods via client.config)
      if (client && client.config) {
        // Console logging
        client.config.enableAutoCollectConsole = true;
        // Heartbeat
        client.config.enableAutoCollectHeartbeat = true;
        // Live metrics
        client.config.enableSendLiveMetrics = (process.env.NODE_ENV === 'production');
        // Disk retry caching
        client.config.enableUseDiskRetryCaching = true;
      }

      this.client = appInsights.defaultClient;

      // Add custom properties to all telemetry
      this.client.context.tags[this.client.context.keys.cloudRole] = 'ailydian-ultra-pro';
      this.client.context.tags[this.client.context.keys.cloudRoleInstance] = process.env.NODE_ENV || 'development';

      this.isInitialized = true;
      console.log('✅ Azure Application Insights initialized');

      // Track successful initialization
      this.trackEvent('ApplicationInsightsInitialized', {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      });

      return true;
    } catch (error) {
      console.error('❌ Application Insights initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Track custom event
   */
  trackEvent(name, properties = {}, measurements = {}) {
    if (!this.isInitialized) return;

    this.client.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      },
      measurements
    });
  }

  /**
   * Track HTTP request
   */
  trackRequest(req, res, duration) {
    if (!this.isInitialized) return;

    this.client.trackRequest({
      name: `${req.method} ${req.path}`,
      url: req.originalUrl || req.url,
      duration,
      resultCode: res.statusCode,
      success: res.statusCode < 400,
      properties: {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        userId: req.user?.id
      }
    });
  }

  /**
   * Track exception
   */
  trackException(error, properties = {}) {
    if (!this.isInitialized) return;

    this.client.trackException({
      exception: error,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track dependency (API calls, database queries)
   */
  trackDependency(name, type, data, duration, success, resultCode = null) {
    if (!this.isInitialized) return;

    this.client.trackDependency({
      name,
      dependencyTypeName: type,
      data,
      duration,
      success,
      resultCode,
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track custom metric
   */
  trackMetric(name, value, properties = {}) {
    if (!this.isInitialized) return;

    this.client.trackMetric({
      name,
      value,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track AI model usage
   */
  trackAIModelUsage(model, provider, tokens, duration, cost = 0) {
    this.trackEvent('AIModelUsage', {
      model,
      provider,
      environment: process.env.NODE_ENV
    }, {
      tokens,
      duration,
      cost
    });
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId, activityType, properties = {}) {
    this.trackEvent('UserActivity', {
      userId,
      activityType,
      ...properties
    });
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint, method, statusCode, duration) {
    this.trackMetric('API_ResponseTime', duration, {
      endpoint,
      method,
      statusCode: statusCode.toString()
    });
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query, duration, success) {
    this.trackDependency(
      'DatabaseQuery',
      'SQL',
      query.substring(0, 100), // Limit query length
      duration,
      success
    );
  }

  /**
   * Track cache hit/miss
   */
  trackCacheOperation(operation, hit, duration) {
    this.trackEvent('CacheOperation', {
      operation,
      hit: hit ? 'hit' : 'miss'
    }, {
      duration
    });
  }

  /**
   * Flush all pending telemetry
   */
  async flush() {
    if (!this.isInitialized) return;

    return new Promise((resolve) => {
      this.client.flush({
        callback: () => resolve()
      });
    });
  }

  /**
   * Express middleware for automatic request tracking
   */
  middleware() {
    return (req, res, next) => {
      if (!this.isInitialized) return next();

      const startTime = Date.now();

      // Track request on response finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.trackRequest(req, res, duration);
      });

      next();
    };
  }

  /**
   * Get telemetry client (for advanced usage)
   */
  getClient() {
    return this.client;
  }
}

// Singleton instance
const insightsService = new ApplicationInsightsService();

module.exports = insightsService;
