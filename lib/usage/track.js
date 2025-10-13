/**
 * Usage Tracking System
 * Tracks token usage, latency, and costs
 *
 * White-hat: Audit-first, no PII logging
 */

const { getDatabase } = require('../../database/init-db');

/**
 * Track usage event
 *
 * @param {Object} event - Usage event data
 * @param {string} event.scope - Event scope (e.g., "prompt_meter", "chat", "search")
 * @param {string} event.userId - User ID (optional)
 * @param {string} event.projectId - Project ID (optional)
 * @param {string} event.model - AI model name (optional)
 * @param {number} event.tokensPrompt - Prompt tokens
 * @param {number} event.tokensCompletion - Completion tokens
 * @param {number} event.tokensTotal - Total tokens
 * @param {number} event.latencyMs - Latency in milliseconds
 * @param {number} event.costUsd - Cost in USD
 * @returns {Promise<Object>} - Tracking result
 */
async function track(event) {
  try {
    const {
      scope = 'unknown',
      userId = null,
      projectId = null,
      model = 'unknown',
      tokensPrompt = 0,
      tokensCompletion = 0,
      tokensTotal = 0,
      latencyMs = 0,
      costUsd = 0
    } = event;

    // Validate required fields
    if (!scope) {
      throw new Error('scope is required');
    }

    // Insert into database (UsageLog table from Prisma schema)
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO usage_logs (
        id,
        user_id,
        endpoint,
        request_data,
        response_time,
        ai_provider,
        ai_model,
        tokens_used,
        cost_usd,
        created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const id = `usg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const requestData = JSON.stringify({
      scope,
      projectId,
      tokensPrompt,
      tokensCompletion,
      tokensTotal
    });

    stmt.run(
      id,
      userId,
      scope, // Using scope as endpoint
      requestData,
      latencyMs,
      'ailydian', // ai_provider
      model,
      tokensTotal,
      costUsd,
      timestamp
    );

    // TODO: Redis counter update (for real-time metrics)
    // await updateRedisCounter(userId, projectId, tokensTotal, costUsd);

    return {
      ok: true,
      eventId: id,
      tracked: {
        scope,
        tokensTotal,
        latencyMs,
        costUsd
      }
    };
  } catch (error) {
    console.error('[Usage Track Error]', error.message);

    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Get usage summary for user/project
 *
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID
 * @param {string} params.projectId - Project ID (optional)
 * @param {string} params.startDate - Start date (ISO string)
 * @param {string} params.endDate - End date (ISO string)
 * @returns {Promise<Object>} - Usage summary
 */
async function getSummary(params) {
  try {
    const {
      userId,
      projectId,
      startDate,
      endDate
    } = params;

    if (!userId) {
      throw new Error('userId is required');
    }

    const db = getDatabase();

    let query = `
      SELECT
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(response_time) as avg_latency
      FROM usage_logs
      WHERE user_id = ?
    `;

    const queryParams = [userId];

    if (startDate) {
      query += ` AND created_at >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= ?`;
      queryParams.push(endDate);
    }

    if (projectId) {
      query += ` AND json_extract(request_data, '$.projectId') = ?`;
      queryParams.push(projectId);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...queryParams);

    return {
      ok: true,
      summary: {
        totalRequests: result.total_requests || 0,
        totalTokens: result.total_tokens || 0,
        totalCost: result.total_cost || 0,
        avgLatency: result.avg_latency || 0
      }
    };
  } catch (error) {
    console.error('[Usage Summary Error]', error.message);

    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Get daily usage breakdown
 *
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID
 * @param {string} params.month - Month (YYYY-MM format)
 * @returns {Promise<Object>} - Daily breakdown
 */
async function getDailyBreakdown(params) {
  try {
    const {
      userId,
      month
    } = params;

    if (!userId || !month) {
      throw new Error('userId and month are required');
    }

    const db = getDatabase();

    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        SUM(tokens_used) as tokens,
        SUM(cost_usd) as cost
      FROM usage_logs
      WHERE user_id = ?
        AND strftime('%Y-%m', created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const stmt = db.prepare(query);
    const results = stmt.all(userId, month);

    return {
      ok: true,
      breakdown: results.map(row => ({
        date: row.date,
        requests: row.requests || 0,
        tokens: row.tokens || 0,
        cost: row.cost || 0
      }))
    };
  } catch (error) {
    console.error('[Usage Breakdown Error]', error.message);

    return {
      ok: false,
      error: error.message
    };
  }
}

module.exports = {
  track,
  getSummary,
  getDailyBreakdown
};
