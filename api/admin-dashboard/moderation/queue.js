/**
 * AILYDIAN Admin Dashboard - Moderation Queue API
 *
 * GET /api/admin-dashboard/moderation/queue
 *
 * Lists items in the moderation queue with pagination and optional status filter.
 *
 * Query params:
 *   - page   (default 1)
 *   - limit  (default 20, max 100)
 *   - status (optional: pending | reviewed | dismissed)
 *
 * Redis key patterns:
 *   - moderation:queue          (sorted set, score = timestamp, member = item id)
 *   - moderation:item:{id}      (hash: content_type, content_id, content, reason,
 *                                 status, reporter, created_at)
 *
 * Protected by triple-layer admin authentication (super_admin + moderator).
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST API
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
 * Convert a flat array from HGETALL [k1, v1, k2, v2, ...] into an object.
 */
function arrayToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Allowed status filter values
// ---------------------------------------------------------------------------

const VALID_STATUSES = ['pending', 'reviewed', 'dismissed'];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istegi desteklenir',
    });
  }

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // ---------------------------------------------------------------------------
  // Parse and validate query params
  // ---------------------------------------------------------------------------

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const statusFilter = (req.query.status || '').trim().toLowerCase();

  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz durum filtresi. Gecerli degerler: pending, reviewed, dismissed',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // Fetch item IDs from the moderation:queue sorted set (newest first).
    // ZREVRANGEBYSCORE returns members with scores from +inf to -inf.
    // We fetch all IDs first, then paginate after optional status filtering.
    // -----------------------------------------------------------------------

    const allItemIds = await redis('ZREVRANGEBYSCORE', 'moderation:queue', '+inf', '-inf');

    if (!allItemIds || allItemIds.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // -----------------------------------------------------------------------
    // Fetch each item hash and apply optional status filter
    // -----------------------------------------------------------------------

    const allItems = [];

    for (const itemId of allItemIds) {
      const rawData = await redis('HGETALL', `moderation:item:${itemId}`);
      const item = arrayToObject(rawData);
      if (!item) continue;

      const itemStatus = (item.status || 'pending').toLowerCase();

      // Apply status filter if provided
      if (statusFilter && itemStatus !== statusFilter) {
        continue;
      }

      allItems.push({
        id: itemId,
        contentType: item.content_type || '',
        contentId: item.content_id || '',
        content: item.content || '',
        reason: item.reason || '',
        status: itemStatus,
        reporter: item.reporter || '',
        createdAt: item.created_at || '',
      });
    }

    // -----------------------------------------------------------------------
    // Paginate
    // -----------------------------------------------------------------------

    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('[ADMIN_MOD_QUEUE]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Moderasyon kurugu alinamadi',
    });
  }
});
