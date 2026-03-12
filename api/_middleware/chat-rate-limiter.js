/**
 * Chat-specific per-user rate limiter
 * Uses Upstash Redis sliding window counters, falls back to in-memory
 *
 * Tier limits (per hour):
 *   anonymous (IP-only): 5 requests
 *   free (authenticated): 20 requests
 *   premium: 200 requests
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

const memoryCounters = new Map();

const TIER_LIMITS = {
  anonymous: { requests: 5, windowSec: 3600 },
  free: { requests: 20, windowSec: 3600 },
  premium: { requests: 200, windowSec: 3600 },
};

async function upstashIncr(key, windowSec) {
  try {
    const response = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['INCR', key]),
    });
    const data = await response.json();
    const count = data.result;

    if (count === 1) {
      await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EXPIRE', key, windowSec]),
      });
    }

    const ttlResponse = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['TTL', key]),
    });
    const ttlData = await ttlResponse.json();

    return { count, ttl: ttlData.result || windowSec };
  } catch (err) {
    console.error('[CHAT_RATE_LIMITER]', err.message);
    return { count: 0, ttl: windowSec };
  }
}

function memoryIncr(key, windowSec) {
  const now = Date.now();
  const record = memoryCounters.get(key);

  if (!record || now > record.resetAt) {
    memoryCounters.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { count: 1, ttl: windowSec };
  }

  record.count++;
  return { count: record.count, ttl: Math.ceil((record.resetAt - now) / 1000) };
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check chat rate limit for request
 * Call after cookie parsing. Uses req.chatUser if set by optionalChatAuth.
 */
async function checkChatRateLimit(req) {
  const ip = getClientIP(req);
  const chatUser = req.chatUser;

  let tier = 'anonymous';
  let rateLimitKey;

  if (chatUser) {
    tier = chatUser.plan === 'premium' ? 'premium' : 'free';
    rateLimitKey = `chat:rl:user:${chatUser.userId}`;
  } else {
    rateLimitKey = `chat:rl:ip:${ip}`;
  }

  const limits = TIER_LIMITS[tier];
  const result = useUpstash
    ? await upstashIncr(rateLimitKey, limits.windowSec)
    : memoryIncr(rateLimitKey, limits.windowSec);

  return {
    allowed: result.count <= limits.requests,
    remaining: Math.max(0, limits.requests - result.count),
    resetIn: result.ttl,
    tier,
    limit: limits.requests,
  };
}

/**
 * Apply rate limit headers and reject if exceeded
 * Returns true if request should proceed, false if rate limited
 */
async function applyChatRateLimit(req, res) {
  const result = await checkChatRateLimit(req);

  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetIn);

  if (!result.allowed) {
    return { allowed: false, result };
  }

  return { allowed: true, result };
}

module.exports = { checkChatRateLimit, applyChatRateLimit, TIER_LIMITS, getClientIP };
