/**
 * AILYDIAN Admin Dashboard - Security Audit Log API
 *
 * GET /api/admin-dashboard/security/audit-log
 *
 * Query params:
 *   page      - Page number (default 1)
 *   limit     - Items per page (default 50, max 200)
 *   action    - Optional filter by action type
 *   startDate - Optional ISO date string for range start
 *   endDate   - Optional ISO date string for range end
 *
 * Redis key pattern: admin:audit:{timestamp}:{action}
 * Each key holds a JSON string value with: admin, target, details, ip
 * Keys have 90-day TTL.
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
 * Validate ISO date string
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Parse an audit key to extract timestamp and action.
 * Key format: admin:audit:{timestamp}:{action}
 * Returns { timestamp, action } or null if parse fails.
 */
function parseAuditKey(key) {
  if (!key || typeof key !== 'string') return null;

  // admin:audit:{timestamp}:{action}
  const prefix = 'admin:audit:';
  if (!key.startsWith(prefix)) return null;

  const rest = key.slice(prefix.length);

  // Timestamp could be ISO string or unix ms - find the split point
  // Strategy: the action is the last colon-separated segment
  const lastColon = rest.lastIndexOf(':');
  if (lastColon === -1) return null;

  const timestamp = rest.slice(0, lastColon);
  const action = rest.slice(lastColon + 1);

  if (!timestamp || !action) return null;

  return { timestamp, action };
}

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

  // Only super_admin can access security audit logs
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
  const actionFilter = (req.query.action || '').trim().toLowerCase();
  const startDate = (req.query.startDate || '').trim();
  const endDate = (req.query.endDate || '').trim();

  // Validate date filters if provided
  if (startDate && !isValidDate(startDate)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz baslangic tarihi formati',
    });
  }
  if (endDate && !isValidDate(endDate)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz bitis tarihi formati',
    });
  }

  try {
    // SCAN for all admin:audit:* keys
    const auditKeys = [];
    let cursor = '0';
    const maxIterations = 500;
    let iterations = 0;

    do {
      const result = await redis('SCAN', cursor, 'MATCH', 'admin:audit:*', 'COUNT', '200');
      if (!result || !Array.isArray(result)) break;

      cursor = String(result[0]);
      const keys = result[1] || [];
      auditKeys.push(...keys);

      iterations++;
      if (iterations >= maxIterations) break;
    } while (cursor !== '0');

    // Fetch and parse all audit entries
    const allEntries = [];

    for (const key of auditKeys) {
      // Parse timestamp and action from the key name
      const parsed = parseAuditKey(key);
      if (!parsed) continue;

      const { timestamp: keyTimestamp, action: keyAction } = parsed;

      // Apply action filter (from key name)
      if (actionFilter && keyAction.toLowerCase() !== actionFilter) {
        continue;
      }

      // Apply date range filters
      if (startDate) {
        const entryDate = new Date(keyTimestamp);
        const fromDate = new Date(startDate);
        if (isNaN(entryDate.getTime()) || entryDate < fromDate) continue;
      }
      if (endDate) {
        const entryDate = new Date(keyTimestamp);
        const toDate = new Date(endDate);
        // Include the entire end date
        toDate.setDate(toDate.getDate() + 1);
        if (isNaN(entryDate.getTime()) || entryDate >= toDate) continue;
      }

      // GET the value (JSON string)
      const rawValue = await redis('GET', key);
      const value = safeJsonParse(rawValue);

      allEntries.push({
        timestamp: keyTimestamp,
        action: keyAction,
        admin: value ? value.admin || '' : '',
        target: value ? value.target || '' : '',
        details: value ? value.details || '' : '',
        ip: value ? value.ip || '' : '',
      });
    }

    // Sort by timestamp descending (newest first)
    allEntries.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });

    // Paginate
    const total = allEntries.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = allEntries.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (_err) {
    console.error('[ADMIN_AUDIT_LOG]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Denetim kayitlari alinamadi',
    });
  }
});
