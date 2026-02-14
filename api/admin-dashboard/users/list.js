/**
 * AILYDIAN Admin Dashboard - User List API
 *
 * GET /api/admin-dashboard/users/list?page=1&limit=20&search=email@test.com&status=active
 *
 * Query Parameters:
 *   - page:   Page number (default 1)
 *   - limit:  Items per page (default 20, max 100)
 *   - search: Filter by email or display_name (partial match)
 *   - status: Filter by user status: 'active', 'banned', 'all' (default 'all')
 *
 * Returns: { users: [...], total, page, limit, hasMore }
 *
 * Strips sensitive fields (password_hash, totp_secret) from all results.
 *
 * Protected by triple-layer admin authentication.
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');
const { setCorsHeaders } = require('../../_middleware/cors');

// ---------------------------------------------------------------------------
// Upstash Redis REST helper
// ---------------------------------------------------------------------------

async function redis(command, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert HGETALL flat array [k1, v1, k2, v2, ...] to a plain object.
 */
function arrayToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

/**
 * Fields that must never be returned to the client.
 */
const SENSITIVE_FIELDS = ['password_hash', 'totp_secret'];

/**
 * Strip sensitive fields from a user object.
 */
function stripSensitive(user) {
  if (!user) return user;
  const clean = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete clean[field];
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  // Apply sanitization and CORS
  setCorsHeaders(req, res);
  applySanitization(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istegi desteklenir',
    });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // Parse query params
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const search = (req.query.search || '').toLowerCase().trim();
  const statusFilter = (req.query.status || 'all').toLowerCase().trim();

  // Validate status filter
  const validStatuses = ['active', 'banned', 'all'];
  if (!validStatuses.includes(statusFilter)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz status parametresi. Izin verilen degerler: active, banned, all',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // SCAN for all chat:user:* keys
    // Upstash SCAN returns [nextCursor, [keys...]]
    // We iterate until cursor is "0" to collect every key.
    // -----------------------------------------------------------------------
    const userKeys = [];
    let cursor = '0';
    const maxIterations = 500;
    let iterations = 0;

    do {
      const result = await redis('SCAN', cursor, 'MATCH', 'chat:user:*', 'COUNT', '200');
      if (!result || !Array.isArray(result)) break;

      cursor = String(result[0]);
      const keys = result[1] || [];

      for (const key of keys) {
        // Exclude auxiliary keys like chat:user:{id}:convs
        // A valid user key is exactly "chat:user:{uuid}" (3 segments)
        const segments = key.split(':');
        if (segments.length === 3) {
          userKeys.push(key);
        }
      }

      iterations++;
      if (iterations >= maxIterations) break;
    } while (cursor !== '0');

    // -----------------------------------------------------------------------
    // Fetch user data for each key
    // -----------------------------------------------------------------------
    const allUsers = [];

    for (const key of userKeys) {
      const rawData = await redis('HGETALL', key);
      const user = arrayToObject(rawData);
      if (!user) continue;

      // Apply status filter
      if (statusFilter !== 'all') {
        const userStatus = (user.status || 'active').toLowerCase();
        const isBanned = user.isBanned === 'true';

        if (statusFilter === 'banned' && !isBanned && userStatus !== 'banned') {
          continue;
        }
        if (statusFilter === 'active' && (isBanned || userStatus === 'banned')) {
          continue;
        }
      }

      // Apply search filter (email or display_name)
      if (search) {
        const emailMatch = (user.email || '').toLowerCase().includes(search);
        const nameMatch = (user.display_name || '').toLowerCase().includes(search);
        if (!emailMatch && !nameMatch) continue;
      }

      allUsers.push(stripSensitive(user));
    }

    // -----------------------------------------------------------------------
    // Sort by created_at descending (newest first)
    // -----------------------------------------------------------------------
    allUsers.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    // -----------------------------------------------------------------------
    // Paginate
    // -----------------------------------------------------------------------
    const total = allUsers.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return res.status(200).json({
      success: true,
      users: paginatedUsers,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (_err) {
    console.error('[ADMIN_USERS_LIST]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Kullanici listesi alinamadi',
    });
  }
});
