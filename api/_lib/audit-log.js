/**
 * Lightweight Audit Logger for Vercel Serverless
 * Writes audit entries to Upstash Redis (RPUSH per day key, 90-day TTL)
 * Non-blocking — errors are swallowed to never impact request flow
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

/**
 * Log an audit event (fire-and-forget)
 * @param {string} event - Event type (e.g., 'chat.request', 'chat.error', 'auth.login')
 * @param {Object} data - Event-specific data
 * @param {Object} context - Request context (userId, ip, requestId, userAgent)
 */
function logAudit(event, data, context = {}) {
  if (!useUpstash) return;

  const entry = {
    event,
    ts: new Date().toISOString(),
    rid: context.requestId || '-',
    uid: context.userId || 'anonymous',
    ip: context.ip || '-',
    ua: (context.userAgent || '').substring(0, 100),
    ...data,
  };

  const dateKey = `chat:audit:${new Date().toISOString().split('T')[0]}`;

  // Fire and forget — never await, never block
  fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['RPUSH', dateKey, JSON.stringify(entry)]),
  })
    .then(() =>
      fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EXPIRE', dateKey, 90 * 24 * 60 * 60]),
      })
    )
    .catch(() => {}); // Silent fail
}

module.exports = { logAudit };
