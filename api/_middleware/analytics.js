/**
 * AILYDIAN Analytics Tracker - Upstash Redis
 *
 * Fire-and-forget pattern: NEVER blocks the API response.
 * All Redis writes are async with no await on the caller side.
 *
 * Key schema (daily keys auto-expire after 90 days):
 *   analytics:messages:total              - Cumulative message count (no TTL)
 *   analytics:messages:{YYYY-MM-DD}       - Messages per day
 *   analytics:api:{YYYY-MM-DD}            - API calls per day
 *   analytics:errors:{YYYY-MM-DD}         - Errors per day
 *   analytics:tokens:{YYYY-MM-DD}         - Total tokens consumed per day
 *   analytics:model:{id}:{YYYY-MM-DD}     - Per-model usage per day
 *   analytics:engine:{name}:{YYYY-MM-DD}  - Per-engine usage per day
 *   analytics:sessions:{YYYY-MM-DD}       - Unique session IDs per day (SET)
 *
 * Usage in API handlers:
 *   const { trackMessage, trackError } = require('./_middleware/analytics');
 *
 *   // After successful response:
 *   trackMessage({ modelId: 'OX7A3F8D', engine: 'unified', tokens: 1234, userId: 'abc' });
 *
 *   // In catch block:
 *   trackError('unified');
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Daily keys expire after 90 days
const TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * Get today's date string in YYYY-MM-DD format (UTC).
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Execute a batch of Redis commands via Upstash pipeline REST API.
 * Fire-and-forget: errors are silently swallowed.
 *
 * @param {Array<Array<string|number>>} commands - Array of Redis command arrays
 */
function redisPipeline(commands) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN || commands.length === 0) {
    return;
  }

  // Intentionally NOT returning the promise to the caller.
  // This is fire-and-forget by design.
  fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  }).catch(() => {
    // Silently swallow - analytics must NEVER break the user's request
  });
}

/**
 * Track a successful chat message / AI response.
 *
 * @param {object} opts
 * @param {string} [opts.modelId]  - Obfuscated model ID (e.g. 'OX7A3F8D')
 * @param {string} [opts.engine]   - Engine name ('unified', 'velocity', 'code')
 * @param {number} [opts.tokens]   - Total tokens consumed (prompt + completion)
 * @param {string} [opts.userId]   - User identifier for session counting
 */
function trackMessage(opts) {
  const { modelId, engine, tokens, userId } = opts || {};
  const day = todayKey();

  const commands = [
    // Cumulative total (no TTL)
    ['INCR', 'analytics:messages:total'],
    // Daily message count
    ['INCR', `analytics:messages:${day}`],
    ['EXPIRE', `analytics:messages:${day}`, TTL_SECONDS],
    // Daily API call count
    ['INCR', `analytics:api:${day}`],
    ['EXPIRE', `analytics:api:${day}`, TTL_SECONDS],
  ];

  // Token usage
  if (tokens && tokens > 0) {
    commands.push(
      ['INCRBY', `analytics:tokens:${day}`, tokens],
      ['EXPIRE', `analytics:tokens:${day}`, TTL_SECONDS]
    );
  }

  // Per-model usage
  if (modelId) {
    commands.push(
      ['INCR', `analytics:model:${modelId}:${day}`],
      ['EXPIRE', `analytics:model:${modelId}:${day}`, TTL_SECONDS]
    );
  }

  // Per-engine usage
  if (engine) {
    commands.push(
      ['INCR', `analytics:engine:${engine}:${day}`],
      ['EXPIRE', `analytics:engine:${engine}:${day}`, TTL_SECONDS]
    );
  }

  // Unique sessions (user IDs in a Redis SET)
  if (userId) {
    commands.push(
      ['SADD', `analytics:sessions:${day}`, userId],
      ['EXPIRE', `analytics:sessions:${day}`, TTL_SECONDS]
    );
  }

  redisPipeline(commands);
}

/**
 * Track an API error occurrence.
 *
 * @param {string} [engine] - Engine name ('unified', 'velocity', 'code')
 */
function trackError(engine) {
  const day = todayKey();

  const commands = [
    ['INCR', `analytics:errors:${day}`],
    ['EXPIRE', `analytics:errors:${day}`, TTL_SECONDS],
  ];

  if (engine) {
    commands.push(
      ['INCR', `analytics:errors:${engine}:${day}`],
      ['EXPIRE', `analytics:errors:${engine}:${day}`, TTL_SECONDS]
    );
  }

  redisPipeline(commands);
}

/**
 * Track an API call that does NOT produce a message
 * (e.g. GET /models, health checks, etc.)
 */
function trackApiCall() {
  const day = todayKey();
  redisPipeline([
    ['INCR', `analytics:api:${day}`],
    ['EXPIRE', `analytics:api:${day}`, TTL_SECONDS],
  ]);
}

module.exports = {
  trackMessage,
  trackError,
  trackApiCall,
};
