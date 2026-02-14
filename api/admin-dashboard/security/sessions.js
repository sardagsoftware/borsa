/**
 * AILYDIAN Admin Dashboard - Active Sessions API
 *
 * GET    /api/admin-dashboard/security/sessions
 * DELETE /api/admin-dashboard/security/sessions?sessionKey=session:{userId}:{tokenId}
 *
 * GET - List active user sessions:
 *   Query params:
 *     page    - Page number (default 1)
 *     limit   - Items per page (default 50, max 200)
 *     userId  - Optional filter by user ID
 *
 *   Redis key pattern: session:{userId}:{tokenId}
 *   Each key holds a JSON string with: created_at, ip, user_agent, expires_at
 *
 *   Returns: { success, sessions, pagination, totalActive }
 *
 * DELETE - Invalidate/terminate a specific session (super_admin only):
 *   Query param:
 *     sessionKey - Required, format: session:{userId}:{tokenId}
 *
 *   DELs the session key from Redis and logs an audit trail.
 *   Returns: { success, message: 'Oturum sonlandirildi' }
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
 * Parse a session key to extract userId and tokenId.
 * Key format: session:{userId}:{tokenId}
 * Returns { userId, tokenId } or null if parse fails.
 */
function parseSessionKey(key) {
  if (!key || typeof key !== 'string') return null;

  const prefix = 'session:';
  if (!key.startsWith(prefix)) return null;

  const rest = key.slice(prefix.length);
  // Find the first colon to split userId from tokenId
  const colonIndex = rest.indexOf(':');
  if (colonIndex === -1) return null;

  const userId = rest.slice(0, colonIndex);
  const tokenId = rest.slice(colonIndex + 1);

  if (!userId || !tokenId) return null;

  return { userId, tokenId };
}

/**
 * Validate sessionKey format: must match session:{userId}:{tokenId}
 */
function isValidSessionKey(key) {
  if (!key || typeof key !== 'string') return false;
  return parseSessionKey(key) !== null;
}

/**
 * Log an admin action to the audit trail.
 * Key: admin:audit:{timestamp}:{action} with JSON value and 90-day TTL.
 */
async function logAuditEntry(admin, action, target, details, ip) {
  try {
    const timestamp = new Date().toISOString();
    const key = `admin:audit:${timestamp}:${action}`;
    const value = JSON.stringify({
      admin: admin || '',
      target: target || '',
      details: details || '',
      ip: ip || '',
    });
    await redis('SET', key, value);
    // 90-day TTL (90 * 24 * 60 * 60 = 7776000 seconds)
    await redis('EXPIRE', key, 7776000);
  } catch (_err) {
    console.error('[AUDIT_LOG_WRITE]', _err.message);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Only super_admin can access session management
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

  // -------------------------------------------------------------------------
  // GET - List active sessions
  // -------------------------------------------------------------------------
  if (req.method === 'GET') {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const userIdFilter = (req.query.userId || '').trim();

    try {
      // SCAN for all session:* keys
      const sessionKeys = [];
      let cursor = '0';
      const maxIterations = 500;
      let iterations = 0;

      do {
        const result = await redis('SCAN', cursor, 'MATCH', 'session:*', 'COUNT', '200');
        if (!result || !Array.isArray(result)) break;

        cursor = String(result[0]);
        const keys = result[1] || [];
        sessionKeys.push(...keys);

        iterations++;
        if (iterations >= maxIterations) break;
      } while (cursor !== '0');

      // Fetch and parse all session entries
      const allSessions = [];

      for (const key of sessionKeys) {
        // Parse userId and tokenId from key name
        const parsed = parseSessionKey(key);
        if (!parsed) continue;

        const { userId, tokenId } = parsed;

        // Apply userId filter
        if (userIdFilter && userId !== userIdFilter) {
          continue;
        }

        // GET the value (JSON string)
        const rawValue = await redis('GET', key);
        const value = safeJsonParse(rawValue);

        allSessions.push({
          userId,
          tokenId,
          createdAt: value ? value.created_at || '' : '',
          ip: value ? value.ip || '' : '',
          userAgent: value ? value.user_agent || '' : '',
          expiresAt: value ? value.expires_at || '' : '',
        });
      }

      // Sort by createdAt descending (newest first)
      allSessions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      // Paginate
      const totalActive = allSessions.length;
      const startIndex = (page - 1) * limit;
      const paginatedSessions = allSessions.slice(startIndex, startIndex + limit);

      return res.status(200).json({
        success: true,
        sessions: paginatedSessions,
        pagination: {
          page,
          limit,
          total: totalActive,
        },
        totalActive,
      });
    } catch (_err) {
      console.error('[ADMIN_SESSIONS_LIST]', _err.message);
      return res.status(500).json({
        success: false,
        error: 'Oturum listesi alinamadi',
      });
    }
  }

  // -------------------------------------------------------------------------
  // DELETE - Terminate a specific session
  // -------------------------------------------------------------------------
  if (req.method === 'DELETE') {
    const sessionKey = (req.query.sessionKey || '').trim();

    if (!sessionKey) {
      return res.status(400).json({
        success: false,
        error: 'sessionKey parametresi gereklidir',
      });
    }

    if (!isValidSessionKey(sessionKey)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz sessionKey formati. Beklenen: session:{userId}:{tokenId}',
      });
    }

    try {
      // Check if the session key exists
      const exists = await redis('EXISTS', sessionKey);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'Oturum bulunamadi',
        });
      }

      // DEL the session key from Redis
      await redis('DEL', sessionKey);

      // Log audit trail
      const parsed = parseSessionKey(sessionKey);
      const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
        .split(',')[0]
        .trim();
      await logAuditEntry(
        req.adminUser.sub || req.adminUser.email || '',
        'session_terminate',
        parsed ? parsed.userId : '',
        `Oturum sonlandirildi: ${sessionKey}`,
        clientIp
      );

      return res.status(200).json({
        success: true,
        message: 'Oturum sonlandirildi',
      });
    } catch (_err) {
      console.error('[ADMIN_SESSION_TERMINATE]', _err.message);
      return res.status(500).json({
        success: false,
        error: 'Oturum sonlandirilamadi',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Unsupported method
  // -------------------------------------------------------------------------
  return res.status(405).json({
    success: false,
    error: 'Yalnizca GET ve DELETE istekleri desteklenir',
  });
});
