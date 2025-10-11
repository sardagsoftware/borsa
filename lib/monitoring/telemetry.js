/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TELEMETRY SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Emit telemetry events for monitoring and analytics
 *
 * Features:
 * - Event batching (reduce overhead)
 * - Azure Application Insights integration (production)
 * - Console logging (development)
 * - Metric aggregation
 * - Error tracking
 *
 * Event types:
 * - api.request (connector API calls)
 * - intent.recognition (user query processing)
 * - tool.execution (tool runner events)
 * - error (error tracking)
 * - perf (performance metrics)
 *
 * @module lib/monitoring/telemetry
 */

// Event queue for batching
const eventQueue = [];
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 5000; // 5 seconds

/**
 * Emit telemetry event
 * @param {string} eventType Event type
 * @param {Object} data Event data
 */
async function emitTelemetry(eventType, data) {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
    environment: process.env.NODE_ENV || 'development',
  };

  // Add to queue
  eventQueue.push(event);

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Telemetry] ${eventType}:`, data);
  }

  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    await flushTelemetry();
  }
}

/**
 * Flush event queue to backend
 */
async function flushTelemetry() {
  if (eventQueue.length === 0) {
    return;
  }

  const batch = eventQueue.splice(0, BATCH_SIZE);

  try {
    if (process.env.NODE_ENV === 'production' && process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      await sendToApplicationInsights(batch);
    } else {
      // Development: just log
      console.log(`[Telemetry] Batch of ${batch.length} events flushed`);
    }
  } catch (error) {
    console.error('[Telemetry] Failed to flush batch:', error);
    // Re-queue failed events (with limit to prevent memory leak)
    if (eventQueue.length < 1000) {
      eventQueue.unshift(...batch);
    }
  }
}

/**
 * Send events to Azure Application Insights
 * @param {Array} events Event batch
 */
async function sendToApplicationInsights(events) {
  try {
    const appInsights = require('applicationinsights');

    for (const event of events) {
      switch (event.type) {
        case 'api.request':
          appInsights.defaultClient.trackRequest({
            name: `${event.data.connector}.${event.data.action}`,
            url: `/api/v1/${event.data.connector}/${event.data.action}`,
            duration: event.data.latency,
            resultCode: event.data.success ? 200 : 500,
            success: event.data.success,
            properties: event.data,
          });
          break;

        case 'intent.recognition':
          appInsights.defaultClient.trackEvent({
            name: 'IntentRecognition',
            properties: event.data,
          });
          break;

        case 'tool.execution':
          appInsights.defaultClient.trackDependency({
            target: event.data.connector,
            name: event.data.action,
            data: event.data.params,
            duration: event.data.latency,
            resultCode: event.data.success ? 200 : 500,
            success: event.data.success,
          });
          break;

        case 'error':
          appInsights.defaultClient.trackException({
            exception: new Error(event.data.message),
            properties: event.data,
          });
          break;

        case 'perf':
          appInsights.defaultClient.trackMetric({
            name: event.data.metric,
            value: event.data.value,
            properties: event.data.tags,
          });
          break;

        default:
          appInsights.defaultClient.trackEvent({
            name: event.type,
            properties: event.data,
          });
      }
    }

    appInsights.defaultClient.flush();
  } catch (error) {
    console.error('[Telemetry] Application Insights error:', error);
  }
}

/**
 * Track API request metrics
 * @param {Object} data Request data
 */
function trackAPIRequest(data) {
  return emitTelemetry('api.request', {
    connector: data.connector,
    action: data.action,
    locale: data.locale || 'tr',
    userId: data.userId || 'anonymous',
    success: data.success,
    error: data.error || null,
    latency: data.latency,
    retries: data.retries || 0,
    streaming: data.streaming || false,
    idempotent: data.idempotent || false,
  });
}

/**
 * Track intent recognition metrics
 * @param {Object} data Intent data
 */
function trackIntentRecognition(data) {
  return emitTelemetry('intent.recognition', {
    query: data.query,
    intent: data.intent,
    vendor: data.vendor || null,
    score: data.score,
    locale: data.locale || 'tr',
    userId: data.userId || 'anonymous',
    success: data.success,
  });
}

/**
 * Track error
 * @param {Object} data Error data
 */
function trackError(data) {
  return emitTelemetry('error', {
    message: data.message,
    code: data.code || 'UNKNOWN',
    stack: data.stack || null,
    connector: data.connector || null,
    action: data.action || null,
    userId: data.userId || 'anonymous',
  });
}

/**
 * Track performance metric
 * @param {string} metric Metric name
 * @param {number} value Metric value
 * @param {Object} tags Tags
 */
function trackMetric(metric, value, tags = {}) {
  return emitTelemetry('perf', {
    metric,
    value,
    tags,
  });
}

/**
 * Get queue statistics (for monitoring)
 */
function getQueueStats() {
  return {
    size: eventQueue.length,
    batchSize: BATCH_SIZE,
    batchInterval: BATCH_INTERVAL,
  };
}

// Auto-flush interval
setInterval(() => {
  if (eventQueue.length > 0) {
    flushTelemetry();
  }
}, BATCH_INTERVAL);

// Flush on process exit
process.on('exit', () => {
  if (eventQueue.length > 0) {
    console.log('[Telemetry] Flushing on exit...');
    flushTelemetry();
  }
});

module.exports = {
  emitTelemetry,
  flushTelemetry,
  trackAPIRequest,
  trackIntentRecognition,
  trackError,
  trackMetric,
  getQueueStats,
};
