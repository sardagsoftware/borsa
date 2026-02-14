/**
 * Admin Dashboard - Platform Statistics API
 * GET /api/admin-dashboard/stats
 *
 * Returns overall platform statistics from Upstash Redis:
 *   - Total users (SCAN count of user:* keys)
 *   - Total messages (analytics:messages:total)
 *   - Active sessions today (analytics:sessions:today)
 *   - Error rate (analytics:errors:today)
 *   - API calls today (analytics:api:today)
 *
 * Falls back to zeros with source: 'fallback' when Redis is unavailable.
 * Protected by triple-layer admin authentication middleware.
 */

const { withAdminAuth } = require('./_middleware');
const { applySanitization } = require('../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST API
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Execute a Redis command via Upstash REST API
 */
async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('[ADMIN_STATS_REDIS]', error.message);
    return null;
  }
}

/**
 * Count keys matching a pattern using SCAN (production-safe, no KEYS *)
 *
 * @param {string} pattern - Redis SCAN glob pattern (e.g. "chat:user:*")
 * @param {string|null} excludeSuffix - Optional suffix to exclude from matches
 */
async function countKeysByPattern(pattern, excludeSuffix = null) {
  let cursor = '0';
  let total = 0;
  const maxIterations = 500;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100);
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];

    if (excludeSuffix) {
      const filtered = keys.filter(k => !k.endsWith(excludeSuffix));
      total += filtered.length;
    } else {
      total += keys.length;
    }

    iterations++;
    if (iterations >= maxIterations) {
      console.warn('[ADMIN_STATS] SCAN iteration limit reached for pattern:', pattern);
      break;
    }
  } while (cursor !== '0');

  return total;
}

/**
 * Collect keys matching a pattern (limited sample for recent activity analysis)
 */
async function collectKeys(pattern, maxKeys = 200) {
  let cursor = '0';
  const collected = [];
  const maxIterations = 100;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100);
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];
    collected.push(...keys);

    if (collected.length >= maxKeys) break;
    iterations++;
    if (iterations >= maxIterations) break;
  } while (cursor !== '0');

  return collected.slice(0, maxKeys);
}

/**
 * Estimate last 24h activity by sampling recent user and conversation records
 */
async function getLast24hActivity() {
  const activity = {
    newUsers: 0,
    activeConversations: 0,
    estimatedMessages: 0,
  };

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const userKeys = await collectKeys('chat:user:*', 300);
    const userHashKeys = userKeys.filter(k => {
      const suffix = k.replace('chat:user:', '');
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(suffix);
    });

    for (const key of userHashKeys.slice(0, 100)) {
      const createdAt = await redis('HGET', key, 'created_at');
      if (createdAt && createdAt >= cutoff) {
        activity.newUsers++;
      }
    }

    const convKeys = await collectKeys('chat:conv:*', 300);
    const convHashKeys = convKeys.filter(k => !k.endsWith(':msgs'));

    for (const key of convHashKeys.slice(0, 100)) {
      const updatedAt = await redis('HGET', key, 'updated_at');
      if (updatedAt && updatedAt >= cutoff) {
        activity.activeConversations++;
      }
    }

    for (const key of convHashKeys.slice(0, 50)) {
      const updatedAt = await redis('HGET', key, 'updated_at');
      if (updatedAt && updatedAt >= cutoff) {
        const msgCount = await redis('HGET', key, 'message_count');
        activity.estimatedMessages += parseInt(msgCount) || 0;
      }
    }
  } catch (error) {
    console.error('[ADMIN_STATS_24H]', error.message);
  }

  return activity;
}

// ---------------------------------------------------------------------------
// Fallback response when Redis is unavailable
// ---------------------------------------------------------------------------

function getFallbackResponse() {
  return {
    success: true,
    data: {
      overview: {
        totalUsers: 0,
        totalMessages: 0,
        activeSessionsToday: 0,
        errorRateToday: 0,
        apiCallsToday: 0,
      },
      last24h: {
        newUsers: 0,
        activeConversations: 0,
        estimatedMessages: 0,
      },
      system: {
        uptime: formatUptime(process.uptime()),
        uptimeSeconds: Math.floor(process.uptime()),
        serverTime: new Date().toISOString(),
        provider: 'LyDian AI',
      },
      source: 'fallback',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format seconds into human-readable Turkish uptime string
 */
function formatUptime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}s ${minutes}dk`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  // Apply response sanitization (strips AI model names from all responses)
  applySanitization(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istekleri kabul edilir',
    });
  }

  // If Redis is not configured, return fallback zeros
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(200).json(getFallbackResponse());
  }

  try {
    // Test Redis connectivity first
    const pingResult = await redis('PING');

    if (pingResult !== 'PONG') {
      return res.status(200).json(getFallbackResponse());
    }

    // Today's date key (YYYY-MM-DD UTC) - matches analytics middleware schema
    const today = new Date().toISOString().slice(0, 10);

    // Run all data fetches in parallel for performance
    const [
      totalUsers,
      totalMessagesRaw,
      activeSessionsTodayRaw,
      errorRateTodayRaw,
      apiCallsTodayRaw,
      tokensTodayRaw,
      messagesTodayRaw,
      totalConversations,
      last24h,
    ] = await Promise.all([
      countKeysByPattern('chat:user:*'),
      redis('GET', 'analytics:messages:total'),
      redis('SCARD', `analytics:sessions:${today}`),
      redis('GET', `analytics:errors:${today}`),
      redis('GET', `analytics:api:${today}`),
      redis('GET', `analytics:tokens:${today}`),
      redis('GET', `analytics:messages:${today}`),
      countKeysByPattern('chat:conv:*', ':msgs'),
      getLast24hActivity(),
    ]);

    const totalMessages = parseInt(totalMessagesRaw) || 0;
    const activeSessionsToday = parseInt(activeSessionsTodayRaw) || 0;
    const errorRateToday = parseInt(errorRateTodayRaw) || 0;
    const apiCallsToday = parseInt(apiCallsTodayRaw) || 0;
    const tokensToday = parseInt(tokensTodayRaw) || 0;
    const messagesToday = parseInt(messagesTodayRaw) || 0;

    const uptimeSeconds = Math.floor(process.uptime());

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalMessages,
          totalConversations,
          activeSessionsToday,
          errorRateToday,
          apiCallsToday,
          tokensToday,
          messagesToday,
        },
        last24h: {
          newUsers: last24h.newUsers,
          activeConversations: last24h.activeConversations,
          estimatedMessages: last24h.estimatedMessages,
        },
        system: {
          uptime: formatUptime(uptimeSeconds),
          uptimeSeconds,
          serverTime: new Date().toISOString(),
          provider: 'LyDian AI',
        },
        source: 'redis',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN_STATS_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Istatistikler alinirken bir hata olustu',
    });
  }
});
