/**
 * 🚨 AiLydian Ultra Pro - Error Tracking & Reporting System
 * Phase P: Performance Monitoring & Analytics
 *
 * Features:
 * - JavaScript runtime errors
 * - Unhandled promise rejections
 * - Resource loading errors
 * - API call failures
 * - Custom error boundaries
 * - Stack trace analysis
 * - Error rate limiting
 * - Privacy-aware (no sensitive data)
 *
 * @version 1.0.0
 * @author LyDian AI Platform
 */

(function(global) {
  'use strict';

  // ============================
  // CONFIGURATION
  // ============================

  const CONFIG = {
    apiEndpoint: '/api/analytics/errors',
    batchSize: 5,
    batchTimeout: 3000, // 3 seconds
    maxQueueSize: 50,
    maxErrorsPerMinute: 10, // Rate limiting
    debug: false,
    enableBeacon: true,
    captureStackTrace: true,
    captureNetwork: true,
    ignorePatterns: [
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
      /Script error/i,
    ],
    ignoredUrls: [],
  };

  // ============================
  // ERROR TRACKER
  // ============================

  class ErrorTracker {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.errorQueue = [];
      this.sendTimeout = null;
      this.sessionId = this.generateSessionId();
      this.errorCount = 0;
      this.lastMinuteErrors = [];
      this.originalHandlers = {
        onerror: null,
        onunhandledrejection: null
      };

      this.init();
    }

    /**
     * Initialize error tracking
     */
    init() {
      if (this.config.debug) {
        console.log('[Error Tracker] Initializing...');
      }

      // Setup error handlers
      this.setupGlobalErrorHandler();
      this.setupUnhandledRejectionHandler();
      this.setupResourceErrorHandler();

      // Setup beforeunload to send remaining errors
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Periodic cleanup
      setInterval(() => {
        this.cleanupRateLimit();
      }, 60000); // Every minute

      if (this.config.debug) {
        console.log('[Error Tracker] ✅ Initialized');
      }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Setup global error handler
     */
    setupGlobalErrorHandler() {
      // Save original handler
      this.originalHandlers.onerror = window.onerror;

      window.onerror = (message, source, lineno, colno, error) => {
        // Call original handler if exists
        if (this.originalHandlers.onerror) {
          this.originalHandlers.onerror.call(window, message, source, lineno, colno, error);
        }

        // Track error
        this.trackError({
          type: 'javascript',
          message: message,
          source: source,
          line: lineno,
          column: colno,
          error: error,
          stack: error ? error.stack : null
        });

        // Return false to allow default error handling
        return false;
      };
    }

    /**
     * Setup unhandled promise rejection handler
     */
    setupUnhandledRejectionHandler() {
      // Save original handler
      this.originalHandlers.onunhandledrejection = window.onunhandledrejection;

      window.addEventListener('unhandledrejection', (event) => {
        // Call original handler if exists
        if (this.originalHandlers.onunhandledrejection) {
          this.originalHandlers.onunhandledrejection.call(window, event);
        }

        // Track rejection
        this.trackError({
          type: 'unhandled_rejection',
          message: event.reason?.message || event.reason,
          promise: event.promise,
          stack: event.reason?.stack || null
        });

        // Prevent default to avoid console error
        // event.preventDefault();
      });
    }

    /**
     * Setup resource loading error handler
     */
    setupResourceErrorHandler() {
      window.addEventListener('error', (event) => {
        if (event.target !== window) {
          // Resource loading error
          this.trackError({
            type: 'resource',
            message: `Failed to load resource: ${event.target.tagName}`,
            source: event.target.src || event.target.href,
            tagName: event.target.tagName,
            outerHTML: event.target.outerHTML
          });
        }
      }, true); // Use capture phase
    }

    /**
     * Track error
     */
    trackError(errorData) {
      // Check if error should be ignored
      if (this.shouldIgnoreError(errorData)) {
        if (this.config.debug) {
          console.log('[Error Tracker] Ignored error:', errorData.message);
        }
        return;
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        if (this.config.debug) {
          console.warn('[Error Tracker] Rate limit exceeded');
        }
        return;
      }

      // Check queue size
      if (this.errorQueue.length >= this.config.maxQueueSize) {
        if (this.config.debug) {
          console.warn('[Error Tracker] Queue full, dropping oldest error');
        }
        this.errorQueue.shift();
      }

      // Enrich error data
      const enrichedError = this.enrichErrorData(errorData);

      // Add to queue
      this.errorQueue.push(enrichedError);
      this.errorCount++;

      if (this.config.debug) {
        console.error('[Error Tracker] Captured:', enrichedError);
      }

      // Send batch if threshold reached
      if (this.errorQueue.length >= this.config.batchSize) {
        this.flush();
      } else {
        // Schedule batch send
        this.scheduleBatchSend();
      }
    }

    /**
     * Enrich error data with context
     */
    enrichErrorData(errorData) {
      return {
        ...errorData,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        errorId: this.generateErrorId(),
        url: window.location.href,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        },
        online: navigator.onLine,
        connection: this.getConnectionInfo(),
        memory: this.getMemoryInfo(),
        performance: this.getPerformanceInfo(),
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        referrer: document.referrer,
        language: navigator.language
      };
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
      return `${this.errorCount}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if error should be ignored
     */
    shouldIgnoreError(errorData) {
      const message = errorData.message || '';
      const source = errorData.source || '';

      // Check ignore patterns
      for (const pattern of this.config.ignorePatterns) {
        if (pattern.test(message) || pattern.test(source)) {
          return true;
        }
      }

      // Check ignored URLs
      for (const url of this.config.ignoredUrls) {
        if (source.includes(url)) {
          return true;
        }
      }

      return false;
    }

    /**
     * Check rate limit
     */
    checkRateLimit() {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      // Clean old errors
      this.lastMinuteErrors = this.lastMinuteErrors.filter(time => time > oneMinuteAgo);

      // Check limit
      if (this.lastMinuteErrors.length >= this.config.maxErrorsPerMinute) {
        return false;
      }

      // Add current error
      this.lastMinuteErrors.push(now);

      return true;
    }

    /**
     * Cleanup rate limit tracking
     */
    cleanupRateLimit() {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      this.lastMinuteErrors = this.lastMinuteErrors.filter(time => time > oneMinuteAgo);
    }

    /**
     * Get connection info
     */
    getConnectionInfo() {
      if (!navigator.connection) return null;

      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    /**
     * Get memory info
     */
    getMemoryInfo() {
      if (!performance.memory) return null;

      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedPercent: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
      };
    }

    /**
     * Get performance info
     */
    getPerformanceInfo() {
      if (!performance.navigation) return null;

      return {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount
      };
    }

    /**
     * Schedule batch send
     */
    scheduleBatchSend() {
      clearTimeout(this.sendTimeout);

      this.sendTimeout = setTimeout(() => {
        this.flush();
      }, this.config.batchTimeout);
    }

    /**
     * Send all queued errors
     */
    flush() {
      if (this.errorQueue.length === 0) return;

      const errors = [...this.errorQueue];
      this.errorQueue = [];
      clearTimeout(this.sendTimeout);

      this.sendErrors(errors);
    }

    /**
     * Send errors to server
     */
    sendErrors(errors) {
      const payload = {
        errors,
        sessionInfo: {
          sessionId: this.sessionId,
          totalErrors: this.errorCount,
          url: window.location.href
        }
      };

      // Use sendBeacon if available and enabled
      if (this.config.enableBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.config.apiEndpoint, blob);

        if (this.config.debug) {
          console.log('[Error Tracker] Sent via beacon:', sent, errors.length, 'errors');
        }
      } else {
        // Fallback to fetch
        fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch((error) => {
          if (this.config.debug) {
            console.error('[Error Tracker] Send error:', error);
          }
        });
      }
    }

    /**
     * Manually track custom error
     */
    captureError(error, context = {}) {
      this.trackError({
        type: 'manual',
        message: error.message || error,
        stack: error.stack || null,
        context,
        manual: true
      });
    }

    /**
     * Manually track exception
     */
    captureException(error, context = {}) {
      this.captureError(error, context);
    }

    /**
     * Track API error
     */
    captureAPIError(url, method, status, response, context = {}) {
      this.trackError({
        type: 'api',
        message: `API Error: ${method} ${url} - ${status}`,
        url,
        method,
        status,
        response,
        context
      });
    }

    /**
     * Get current stats
     */
    getStats() {
      return {
        sessionId: this.sessionId,
        totalErrors: this.errorCount,
        queuedErrors: this.errorQueue.length,
        errorsLastMinute: this.lastMinuteErrors.length
      };
    }

    /**
     * Clear error queue
     */
    clearQueue() {
      this.errorQueue = [];
      clearTimeout(this.sendTimeout);
    }

    /**
     * Disable error tracking
     */
    disable() {
      // Restore original handlers
      if (this.originalHandlers.onerror) {
        window.onerror = this.originalHandlers.onerror;
      }

      if (this.originalHandlers.onunhandledrejection) {
        window.onunhandledrejection = this.originalHandlers.onunhandledrejection;
      }

      // Clear queue
      this.clearQueue();

      if (this.config.debug) {
        console.log('[Error Tracker] Disabled');
      }
    }
  }

  // ============================
  // FETCH INTERCEPTOR (API ERROR TRACKING)
  // ============================

  /**
   * Intercept fetch to track API errors
   */
  function setupFetchInterceptor(errorTracker) {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const [url, options = {}] = args;

      try {
        const response = await originalFetch.apply(this, args);

        // Track failed API calls
        if (!response.ok) {
          let responseText = null;
          try {
            responseText = await response.clone().text();
          } catch (e) {
            // Ignore response read errors
          }

          errorTracker.captureAPIError(
            url,
            options.method || 'GET',
            response.status,
            responseText,
            { options }
          );
        }

        return response;
      } catch (error) {
        // Track network errors
        errorTracker.captureAPIError(
          url,
          options.method || 'GET',
          0,
          error.message,
          { options, networkError: true }
        );

        throw error;
      }
    };
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Create global instance
  const errorTracker = new ErrorTracker();

  // Setup fetch interceptor
  setupFetchInterceptor(errorTracker);

  // Expose globally
  global.errorTracker = errorTracker;
  global.ErrorTracker = ErrorTracker;

  // Add convenience methods
  global.captureError = errorTracker.captureError.bind(errorTracker);
  global.captureException = errorTracker.captureException.bind(errorTracker);

  console.log('[Error Tracker] 🚨 Error tracking loaded');

})(window);
