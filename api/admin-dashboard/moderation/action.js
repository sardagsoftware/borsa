/**
 * AILYDIAN Admin Dashboard - Moderation Action API
 *
 * POST /api/admin-dashboard/moderation/action
 *
 * Takes a moderation action on a content item in the queue.
 *
 * Body:
 *   - itemId  (required) - ID of the moderation item
 *   - action  (required) - approve | reject | warn | ban_user
 *   - reason  (optional) - reason / note for the action
 *
 * Actions:
 *   approve  -> update moderation:item:{itemId} status to "reviewed"
 *   reject   -> update status to "dismissed", delete content from chat:{conversationId}
 *   warn     -> update status to "reviewed" (warning logged in audit)
 *   ban_user -> update status to "reviewed", set user:{userId} status to "banned"
 *
 * Audit trail:
 *   SET admin:audit:{timestamp}:moderation  (JSON, 90-day TTL = 7776000s)
 *
 * Redis key patterns:
 *   - moderation:item:{id}  (hash)
 *   - user:{userId}         (hash - for ban_user action)
 *   - chat:{conversationId} (hash - for reject action)
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
// Allowed actions
// ---------------------------------------------------------------------------

const VALID_ACTIONS = ['approve', 'reject', 'warn', 'ban_user'];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca POST istegi desteklenir',
    });
  }

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // ---------------------------------------------------------------------------
  // Parse and validate request body
  // ---------------------------------------------------------------------------

  const { itemId, action, reason } = req.body || {};

  if (!itemId || typeof itemId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz istek',
    });
  }

  if (!action || !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz istek',
    });
  }

  // Reason is optional but must be string if provided
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz istek',
    });
  }

  const sanitizedReason = reason ? reason.substring(0, 500) : '';

  try {
    // -----------------------------------------------------------------------
    // Fetch the moderation item
    // -----------------------------------------------------------------------

    const rawData = await redis('HGETALL', `moderation:item:${itemId}`);
    const item = arrayToObject(rawData);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Moderasyon ogesi bulunamadi',
      });
    }

    // -----------------------------------------------------------------------
    // Process the action
    // -----------------------------------------------------------------------

    const now = new Date().toISOString();
    const adminId = req.adminUser.sub || '';

    switch (action) {
      case 'approve': {
        // Mark item as reviewed
        await redis(
          'HSET',
          `moderation:item:${itemId}`,
          'status',
          'reviewed',
          'reviewed_at',
          now,
          'reviewed_by',
          adminId
        );
        break;
      }

      case 'reject': {
        // Mark item as dismissed
        await redis(
          'HSET',
          `moderation:item:${itemId}`,
          'status',
          'dismissed',
          'reviewed_at',
          now,
          'reviewed_by',
          adminId
        );

        // Delete the content from the conversation if content_id exists
        const conversationId = item.content_id;
        if (conversationId) {
          await redis('DEL', `chat:${conversationId}`);
        }
        break;
      }

      case 'warn': {
        // Mark item as reviewed (warning is logged via audit trail)
        await redis(
          'HSET',
          `moderation:item:${itemId}`,
          'status',
          'reviewed',
          'reviewed_at',
          now,
          'reviewed_by',
          adminId
        );
        break;
      }

      case 'ban_user': {
        // Only super_admin and moderator can ban (both allowed via middleware)
        const userId = item.reporter ? null : null;
        // Extract userId from the item - stored in content_id or a dedicated field
        const targetUserId = item.target_user_id || item.content_id || '';

        if (targetUserId) {
          // Set user status to banned
          await redis(
            'HSET',
            `user:${targetUserId}`,
            'status',
            'banned',
            'banned_at',
            now,
            'ban_reason',
            sanitizedReason || item.reason || ''
          );
        }

        // Mark item as reviewed
        await redis(
          'HSET',
          `moderation:item:${itemId}`,
          'status',
          'reviewed',
          'reviewed_at',
          now,
          'reviewed_by',
          adminId
        );
        break;
      }
    }

    // -----------------------------------------------------------------------
    // Log audit trail
    // -----------------------------------------------------------------------

    const timestamp = Date.now();
    const auditData = JSON.stringify({
      action: 'moderation',
      moderationAction: action,
      itemId,
      adminId,
      adminRole: req.adminUser.role || '',
      reason: sanitizedReason,
      timestamp: now,
    });

    await redis('SET', `admin:audit:${timestamp}:moderation`, auditData, 'EX', '7776000');

    // -----------------------------------------------------------------------
    // Return success
    // -----------------------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: 'Moderasyon islemi basarili',
      itemId,
      action,
    });
  } catch (err) {
    console.error('[ADMIN_MOD_ACTION]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Moderasyon islemi basarisiz',
    });
  }
});
