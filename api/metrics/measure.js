/**
 * Metrics Measurement API
 * Real-time token counting, latency measurement, and cost calculation
 *
 * Endpoint: POST /api/metrics/measure
 * Input: { prompt, modality: "search"|"chat", model?, projectId? }
 * Output: { ok, tokensPrompt, tokensCompletion, tokensTotal, latencyMs, costUsd }
 *
 * Security: Idempotency-Key required, CORS strict, no PII logging
 * White-hat: Audit-first, secrets masked
 */

const { estimateTokens, calculateModelCost } = require('../../lib/usage/tokens');
const { track } = require('../../lib/usage/track');

/**
 * Measure prompt tokens, latency, and cost
 */
async function measureMetrics(req, res) {
  const startTime = Date.now();

  try {
    // Extract input
    const {
      prompt = '',
      modality = 'search',
      model = 'default',
      projectId = null,
      userId = null
    } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'prompt is required and must be a string'
      });
    }

    if (!['search', 'chat'].includes(modality)) {
      return res.status(400).json({
        ok: false,
        error: 'modality must be "search" or "chat"'
      });
    }

    // Check Idempotency-Key (required for POST)
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    if (!idempotencyKey) {
      return res.status(400).json({
        ok: false,
        error: 'Idempotency-Key header is required'
      });
    }

    // Token estimation (BPE fallback)
    const tokensPrompt = estimateTokens(prompt);

    // Completion tokens (simulated - in real scenario, would come from actual API response)
    // For prompt meter, we don't have completion yet, so it's 0
    const tokensCompletion = 0;

    const tokensTotal = tokensPrompt + tokensCompletion;

    // Latency measurement (end-to-end)
    const latencyMs = Date.now() - startTime;

    // Cost calculation
    const costUsd = calculateModelCost(tokensPrompt, tokensCompletion, model);

    // Track usage event
    const trackResult = await track({
      scope: `prompt_meter_${modality}`,
      userId: userId || 'anonymous',
      projectId,
      model,
      tokensPrompt,
      tokensCompletion,
      tokensTotal,
      latencyMs,
      costUsd
    });

    if (!trackResult.ok) {
      console.error('[Metrics Measure] Track failed:', trackResult.error);
      // Continue anyway - tracking failure shouldn't block response
    }

    // Success response
    return res.status(200).json({
      ok: true,
      metrics: {
        tokensPrompt,
        tokensCompletion,
        tokensTotal,
        latencyMs,
        costUsd
      },
      metadata: {
        modality,
        model,
        timestamp: new Date().toISOString(),
        tracked: trackResult.ok
      }
    });
  } catch (error) {
    console.error('[Metrics Measure Error]', error.message);

    // Ensure no sensitive data in error response
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      code: 'METRICS_MEASURE_ERROR'
    });
  }
}

/**
 * Get usage summary
 * GET /api/metrics/summary?month=YYYY-MM
 */
async function getUsageSummary(req, res) {
  try {
    const { getSummary } = require('../../lib/usage/track');

    const userId = req.user?.id || 'anonymous';
    const month = req.query.month;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        ok: false,
        error: 'month parameter required (format: YYYY-MM)'
      });
    }

    // Calculate start and end dates for the month
    const startDate = `${month}-01T00:00:00.000Z`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateISO = endDate.toISOString();

    const summary = await getSummary({
      userId,
      startDate,
      endDate: endDateISO
    });

    if (!summary.ok) {
      return res.status(500).json({
        ok: false,
        error: summary.error
      });
    }

    return res.status(200).json({
      ok: true,
      month,
      summary: summary.summary
    });
  } catch (error) {
    console.error('[Metrics Summary Error]', error.message);

    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get daily breakdown
 * GET /api/metrics/daily?month=YYYY-MM
 */
async function getDailyMetrics(req, res) {
  try {
    const { getDailyBreakdown } = require('../../lib/usage/track');

    const userId = req.user?.id || 'anonymous';
    const month = req.query.month;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        ok: false,
        error: 'month parameter required (format: YYYY-MM)'
      });
    }

    const breakdown = await getDailyBreakdown({
      userId,
      month
    });

    if (!breakdown.ok) {
      return res.status(500).json({
        ok: false,
        error: breakdown.error
      });
    }

    return res.status(200).json({
      ok: true,
      month,
      daily: breakdown.breakdown
    });
  } catch (error) {
    console.error('[Metrics Daily Error]', error.message);

    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  measureMetrics,
  getUsageSummary,
  getDailyMetrics
};
