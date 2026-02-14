/**
 * AILYDIAN Admin Dashboard - Failed Login Attempts API
 *
 * GET /api/admin-dashboard/security/login-attempts
 *
 * Query params:
 *   page  - Page number (default 1)
 *   limit - Items per page (default 50, max 200)
 *   email - Optional filter by email address
 *
 * Redis key pattern: security:failed_login:{timestamp}
 * Each key holds a JSON string value with: email, ip, user_agent, reason
 *
 * Returns:
 *   - attempts: paginated list of failed login entries
 *   - summary: totalAttempts, uniqueEmails, uniqueIPs, last24Hours
 *   - pagination: page, limit, total
 *
 * Only super_admin role can access this endpoint.
 * Protected by triple-layer admin authentication + response sanitization.
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST helper
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
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
    return data.result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse a JSON string, returning null on failure.
 */
function safeJsonParse(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Extract timestamp from a failed login key.
 * Key format: security:failed_login:{timestamp}
 * Returns the timestamp string or null.
 */
function extractTimestamp(key) {
  if (!key || typeof key !== 'string') return null;
  const prefix = 'security:failed_login:';
  if (!key.startsWith(prefix)) return null;
  const timestamp = key.slice(prefix.length);
  return timestamp || null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istegi desteklenir',
    });
  }

  // Only super_admin can access failed login attempts
  if (!req.adminUser || req.adminUser.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Bu islem icin super_admin yetkisi gereklidir',
    });
  }

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // Parse query params
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const emailFilter = (req.query.email || '').trim().toLowerCase();

  try {
    // SCAN for all security:failed_login:* keys
    const failedKeys = [];
    let cursor = '0';
    const maxIterations = 500;
    let iterations = 0;

    do {
      const result = await redis(
        'SCAN',
        cursor,
        'MATCH',
        'security:failed_login:*',
        'COUNT',
        '200'
      );
      if (!result || !Array.isArray(result)) break;

      cursor = String(result[0]);
      const keys = result[1] || [];
      failedKeys.push(...keys);

      iterations++;
      if (iterations >= maxIterations) break;
    } while (cursor !== '0');

    // Fetch and parse all entries
    const allAttempts = [];
    const uniqueEmails = new Set();
    const uniqueIPs = new Set();
    let last24Hours = 0;

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    for (const key of failedKeys) {
      const keyTimestamp = extractTimestamp(key);

      // GET the value (JSON string)
      const rawValue = await redis('GET', key);
      const value = safeJsonParse(rawValue);
      if (!value) continue;

      const entryEmail = (value.email || '').toLowerCase();
      const entryIp = value.ip || '';
      const entryUserAgent = value.user_agent || '';
      const entryReason = value.reason || '';

      // Use the timestamp from the key, or fall back to value if present
      const timestamp = keyTimestamp || value.timestamp || '';

      // Apply email filter
      if (emailFilter && entryEmail !== emailFilter) {
        continue;
      }

      // Track summary stats (across all matching entries, before pagination)
      uniqueEmails.add(entryEmail);
      if (entryIp) uniqueIPs.add(entryIp);

      // Check if within last 24 hours
      const entryTime = new Date(timestamp).getTime();
      if (!isNaN(entryTime) && entryTime >= twentyFourHoursAgo) {
        last24Hours++;
      }

      allAttempts.push({
        timestamp,
        email: entryEmail,
        ip: entryIp,
        userAgent: entryUserAgent,
        reason: entryReason,
      });
    }

    // Sort by timestamp descending (newest first)
    allAttempts.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });

    // Paginate
    const total = allAttempts.length;
    const startIndex = (page - 1) * limit;
    const paginatedAttempts = allAttempts.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      attempts: paginatedAttempts,
      summary: {
        totalAttempts: total,
        uniqueEmails: uniqueEmails.size,
        uniqueIPs: uniqueIPs.size,
        last24Hours,
      },
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (_err) {
    console.error('[ADMIN_LOGIN_ATTEMPTS]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Giris denemeleri alinamadi',
    });
  }
});
