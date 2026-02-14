/**
 * AILYDIAN Admin Dashboard - Chat Logs List API
 *
 * GET /api/admin-dashboard/chat-logs/list
 *
 * Lists conversations with pagination by scanning chat_history:* keys.
 *
 * Query params:
 *   page      - Page number (default: 1)
 *   limit     - Items per page (default: 20, max: 100)
 *   userId    - Optional filter by user ID
 *   startDate - Optional start date filter (ISO string, e.g. 2024-01-01)
 *   endDate   - Optional end date filter (ISO string, e.g. 2024-12-31)
 *
 * Returns: {
 *   success: true,
 *   conversations: [{ id, userId, title, messageCount, createdAt }],
 *   pagination: { page, limit, total }
 * }
 *
 * Redis key patterns:
 *   chat_history:{userId} - JSON array of { id, title, timestamp }
 *   chat:{conversationId} - JSON array of messages (used for messageCount)
 *
 * Security:
 *   - Triple-layer admin auth (API key + HMAC + JWT) via withAdminAuth
 *   - Only super_admin and moderator roles (enforced by middleware)
 *   - Model name sanitization on all output via applySanitization
 *   - No error.message exposure in responses
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST client
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
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (err) {
    console.error('[CHAT_LOGS_LIST_REDIS]', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// SCAN helper - collect keys matching a pattern
// ---------------------------------------------------------------------------

/**
 * Collect all Redis keys matching a pattern using SCAN.
 * Production-safe: never uses KEYS *.
 *
 * @param {string} pattern - Redis glob pattern (e.g. "chat_history:*")
 * @param {number} maxKeys - Safety limit to prevent unbounded collection
 * @returns {Promise<string[]>}
 */
async function scanKeys(pattern, maxKeys = 5000) {
  const collected = [];
  let cursor = '0';
  const maxIterations = 500;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', '200');
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];
    collected.push(...keys);

    if (collected.length >= maxKeys) break;
    iterations++;
    if (iterations >= maxIterations) {
      console.warn('[CHAT_LOGS_LIST] SCAN iteration limit reached for:', pattern);
      break;
    }
  } while (cursor !== '0');

  return collected.slice(0, maxKeys);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET metodu desteklenmektedir',
    });
  }

  // Validate Redis config
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error('[CHAT_LOGS_LIST] Redis yapilandirmasi eksik');
    return res.status(500).json({
      success: false,
      error: 'Sunucu yapilandirma hatasi',
    });
  }

  // Parse and validate query params
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const userIdFilter = req.query.userId || null;
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

  // Validate dates if provided
  if (startDate && isNaN(startDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz startDate formati. ISO tarih kullanin (ornek: 2024-01-01)',
    });
  }
  if (endDate && isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz endDate formati. ISO tarih kullanin (ornek: 2024-12-31)',
    });
  }

  // Set endDate to end of day if provided
  const endDateCutoff = endDate ? new Date(endDate) : null;
  if (endDateCutoff) {
    endDateCutoff.setHours(23, 59, 59, 999);
  }

  try {
    // -----------------------------------------------------------------------
    // Collect chat_history:* keys
    // If userId filter is set, target that specific key only.
    // -----------------------------------------------------------------------

    let historyKeys = [];

    if (userIdFilter) {
      // Direct key lookup for a specific user
      historyKeys = [`chat_history:${userIdFilter}`];
    } else {
      // SCAN for all chat_history:* keys
      historyKeys = await scanKeys('chat_history:*');
    }

    // -----------------------------------------------------------------------
    // Parse each user's chat history and flatten into a single list
    // -----------------------------------------------------------------------

    const conversations = [];

    for (const key of historyKeys) {
      const rawHistory = await redis('GET', key);
      if (!rawHistory) continue;

      let historyArray;
      try {
        historyArray = typeof rawHistory === 'string' ? JSON.parse(rawHistory) : rawHistory;
      } catch (_e) {
        continue; // Skip malformed data
      }

      if (!Array.isArray(historyArray)) continue;

      // Extract userId from the key pattern chat_history:{userId}
      const userId = key.replace('chat_history:', '');

      for (const entry of historyArray) {
        if (!entry || !entry.id) continue;

        // Apply date range filter based on timestamp
        const entryDate = entry.timestamp ? new Date(entry.timestamp) : null;

        if (startDate && entryDate && entryDate < startDate) continue;
        if (endDateCutoff && entryDate && entryDate > endDateCutoff) continue;

        // Fetch message count from the conversation's message key
        let messageCount = 0;
        const rawMessages = await redis('GET', `chat:${entry.id}`);
        if (rawMessages) {
          try {
            const messages =
              typeof rawMessages === 'string' ? JSON.parse(rawMessages) : rawMessages;
            if (Array.isArray(messages)) {
              messageCount = messages.length;
            }
          } catch (_e) {
            // messageCount stays 0
          }
        }

        conversations.push({
          id: entry.id,
          userId: userId,
          title: entry.title || 'Basliksiz sohbet',
          messageCount: messageCount,
          createdAt: entry.timestamp || null,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Sort by createdAt descending (most recent first)
    // -----------------------------------------------------------------------

    conversations.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // -----------------------------------------------------------------------
    // Paginate
    // -----------------------------------------------------------------------

    const total = conversations.length;
    const startIndex = (page - 1) * limit;
    const paginated = conversations.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      conversations: paginated,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (_err) {
    console.error('[CHAT_LOGS_LIST] Hata:', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Sohbet kayitlari alinirken bir hata olustu',
    });
  }
});
