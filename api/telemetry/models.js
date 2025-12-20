/**
 * Telemetry API - Model Metrics
 * Returns real-time metrics for local/Groq models
 *
 * WHITE-HAT COMPLIANCE: System metrics only, no PII
 * SECURITY: Rate-limited, CORS protected
 */

const { withCache } = require('../../lib/middleware/cache-middleware');
const { handleCORS } = require('../../middleware/cors-handler');

// Simulated telemetry data (in production, this would come from real monitoring)
const MOCK_TELEMETRY = {
  'GX3C7D5F': { tps: 85.3, p95_ms: 45 },
  'GX9A5E1D': { tps: 28.7, p95_ms: 120 },
  'mistral-7b': { tps: 92.1, p95_ms: 38 },
  'mixtral-8x22b': { tps: 15.4, p95_ms: 280 },
  'deepseek-r1': { tps: 8.2, p95_ms: 520 },
  'qwen-2.5-72b': { tps: 25.6, p95_ms: 140 },
  'groq-GX8E2D9A': { tps: 350.0, p95_ms: 12 }, // Groq is ultra-fast
  'GX4B7F3C': { tps: 280.5, p95_ms: 18 },
  'llama2-70b-4096': { tps: 245.3, p95_ms: 22 }
};

async function telemetryHandler(req, res) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelId } = req.query;

    // If specific model requested
    if (modelId && typeof modelId === 'string') {
      const metrics = MOCK_TELEMETRY[modelId];
      if (!metrics) {
        return res.status(404).json({
          error: 'Model not found',
          modelId
        });
      }

      return res.status(200).json({
        modelId,
        tps: metrics.tps,
        p95_ms: metrics.p95_ms,
        timestamp: new Date().toISOString()
      });
    }

    // Return all metrics
    const allMetrics = Object.entries(MOCK_TELEMETRY).map(([id, metrics]) => ({
      modelId: id,
      tps: metrics.tps,
      p95_ms: metrics.p95_ms
    }));

    return res.status(200).json({
      metrics: allMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Telemetry API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Export with cache (5 second TTL for real-time feel)
module.exports = withCache({
  ttl: 5,
  keyPrefix: 'telemetry',
  debug: process.env.NODE_ENV !== 'production'
})(telemetryHandler);
