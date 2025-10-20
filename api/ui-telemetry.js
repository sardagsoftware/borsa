/**
 * 📊 UI Telemetry API
 * Track user interactions, intent parsing, and action executions
 */

/**
 * In-memory telemetry store (in production, use database or analytics service)
 */
const telemetryStore = {
  intentParsed: [],
  actionExecuted: [],
  errors: []
};

// Limit store size to prevent memory issues
const MAX_STORE_SIZE = 1000;

/**
 * Record telemetry event
 */
async function recordTelemetry(req, res) {
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({
      success: false,
      error: 'Event and data are required'
    });
  }

  // Create telemetry entry
  const entry = {
    event,
    data,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  };

  // Store by event type
  switch (event) {
    case 'intent.parsed':
      telemetryStore.intentParsed.push(entry);
      if (telemetryStore.intentParsed.length > MAX_STORE_SIZE) {
        telemetryStore.intentParsed.shift(); // Remove oldest
      }
      console.log('📊 Intent Parsed:', {
        utterance: data.utterance?.substring(0, 50),
        topIntent: data.topIntent,
        confidence: data.confidence,
        locale: data.locale
      });
      break;

    case 'action.executed':
      telemetryStore.actionExecuted.push(entry);
      if (telemetryStore.actionExecuted.length > MAX_STORE_SIZE) {
        telemetryStore.actionExecuted.shift();
      }
      console.log('⚡ Action Executed:', {
        action: data.action,
        success: data.success,
        confidence: data.confidence,
        locale: data.locale,
        error: data.error
      });
      break;

    case 'error':
      telemetryStore.errors.push(entry);
      if (telemetryStore.errors.length > MAX_STORE_SIZE) {
        telemetryStore.errors.shift();
      }
      console.error('❌ UI Error:', {
        message: data.message,
        stack: data.stack?.substring(0, 200)
      });
      break;

    default:
      console.log('📊 Telemetry Event:', event, data);
  }

  // Return 204 No Content (successful, no body needed)
  res.status(204).end();
}

/**
 * Get telemetry statistics
 */
async function getTelemetryStats(req, res) {
  const { timeRange = '1h' } = req.query;

  // Parse time range
  const now = Date.now();
  let cutoff = now - 60 * 60 * 1000; // Default 1 hour

  if (timeRange.endsWith('m')) {
    cutoff = now - parseInt(timeRange) * 60 * 1000;
  } else if (timeRange.endsWith('h')) {
    cutoff = now - parseInt(timeRange) * 60 * 60 * 1000;
  } else if (timeRange.endsWith('d')) {
    cutoff = now - parseInt(timeRange) * 24 * 60 * 60 * 1000;
  }

  const cutoffISO = new Date(cutoff).toISOString();

  // Filter by time range
  const recentIntentsParsed = telemetryStore.intentParsed.filter(
    e => e.timestamp >= cutoffISO
  );
  const recentActionsExecuted = telemetryStore.actionExecuted.filter(
    e => e.timestamp >= cutoffISO
  );
  const recentErrors = telemetryStore.errors.filter(
    e => e.timestamp >= cutoffISO
  );

  // Calculate statistics
  const totalIntents = recentIntentsParsed.length;
  const totalActions = recentActionsExecuted.length;
  const successfulActions = recentActionsExecuted.filter(e => e.data.success).length;
  const failedActions = totalActions - successfulActions;

  // Calculate average confidence
  const avgConfidence = totalIntents > 0
    ? recentIntentsParsed.reduce((sum, e) => sum + (e.data.confidence || 0), 0) / totalIntents
    : 0;

  // Top intents
  const intentCounts = {};
  recentIntentsParsed.forEach(e => {
    const intent = e.data.topIntent;
    if (intent) {
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    }
  });

  const topIntents = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([intent, count]) => ({ intent, count }));

  // Action success rate by action type
  const actionStats = {};
  recentActionsExecuted.forEach(e => {
    const action = e.data.action;
    if (!actionStats[action]) {
      actionStats[action] = { total: 0, success: 0, failed: 0 };
    }
    actionStats[action].total++;
    if (e.data.success) {
      actionStats[action].success++;
    } else {
      actionStats[action].failed++;
    }
  });

  // Locale distribution
  const localeStats = {};
  recentIntentsParsed.forEach(e => {
    const locale = e.data.locale || 'unknown';
    localeStats[locale] = (localeStats[locale] || 0) + 1;
  });

  res.json({
    success: true,
    timeRange,
    period: {
      start: cutoffISO,
      end: new Date(now).toISOString()
    },
    overview: {
      totalIntentsParsed: totalIntents,
      totalActionsExecuted: totalActions,
      successfulActions,
      failedActions,
      errorCount: recentErrors.length,
      successRate: totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 0,
      avgConfidence: Math.round(avgConfidence * 100)
    },
    topIntents,
    actionStats,
    localeStats,
    recentErrors: recentErrors.slice(-10).map(e => ({
      message: e.data.message,
      timestamp: e.timestamp
    }))
  });
}

module.exports = {
  recordTelemetry,
  getTelemetryStats
};
