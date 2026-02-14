/**
 * AILYDIAN Admin Dashboard - Chat Log Search API
 *
 * GET /api/admin-dashboard/chat-logs/search
 *
 * Full-text search across all chat messages stored in Redis.
 * Scans through chat:* keys, parses JSON arrays, searches content fields.
 *
 * Query params:
 *   q     - Required search string (min 3 characters)
 *   page  - Page number (default: 1)
 *   limit - Items per page (default: 20, max: 100)
 *
 * Returns: {
 *   success: true,
 *   query: "search term",
 *   results: [{
 *     conversationId,
 *     messageIndex,
 *     role,
 *     snippet,
 *     timestamp
 *   }],
 *   total: 42
 * }
 *
 * Redis key pattern:
 *   chat:* - Each key holds a JSON array of { role, content, timestamp }
 *
 * Note: This is a SCAN-based search (no search index). Acceptable for admin
 * use with moderate data volumes. For production scale, add a search index.
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
    console.error('[CHAT_LOGS_SEARCH_REDIS]', err.message);
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
 * @param {string} pattern - Redis glob pattern (e.g. "chat:*")
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
      console.warn('[CHAT_LOGS_SEARCH] SCAN iteration limit reached for:', pattern);
      break;
    }
  } while (cursor !== '0');

  return collected.slice(0, maxKeys);
}

// ---------------------------------------------------------------------------
// Snippet extraction
// ---------------------------------------------------------------------------

/**
 * Extract a context snippet around the search match.
 * Returns up to `maxLen` characters centered on the first occurrence.
 *
 * @param {string} content - Full message content
 * @param {string} queryLower - Lowercased search query
 * @param {number} maxLen - Maximum snippet length (default: 200)
 * @returns {string}
 */
function extractSnippet(content, queryLower, maxLen = 200) {
  if (!content) return '';

  const contentLower = content.toLowerCase();
  const matchIndex = contentLower.indexOf(queryLower);

  if (matchIndex === -1) {
    // Shouldn't happen if we already matched, but fallback to start
    return content.length > maxLen ? content.substring(0, maxLen) + '...' : content;
  }

  // Calculate window around the match
  const padding = Math.floor((maxLen - queryLower.length) / 2);
  let start = Math.max(0, matchIndex - padding);
  let end = Math.min(content.length, matchIndex + queryLower.length + padding);

  // Adjust if we're near the boundaries
  if (start === 0) {
    end = Math.min(content.length, maxLen);
  }
  if (end === content.length) {
    start = Math.max(0, content.length - maxLen);
  }

  let snippet = content.substring(start, end);

  // Add ellipsis indicators
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
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
    console.error('[CHAT_LOGS_SEARCH] Redis yapilandirmasi eksik');
    return res.status(500).json({
      success: false,
      error: 'Sunucu yapilandirma hatasi',
    });
  }

  // Parse and validate query params
  const query = (req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  // Validate search query
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Arama sorgusu (q) parametresi zorunludur',
    });
  }

  if (query.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Arama sorgusu en az 3 karakter olmalidir',
    });
  }

  if (query.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Arama sorgusu en fazla 200 karakter olabilir',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // SCAN for all chat:* keys (conversation message arrays)
    // -----------------------------------------------------------------------

    const chatKeys = await scanKeys('chat:*');

    if (!chatKeys || chatKeys.length === 0) {
      return res.status(200).json({
        success: true,
        query: query,
        results: [],
        total: 0,
      });
    }

    // -----------------------------------------------------------------------
    // Search through each conversation's messages
    // -----------------------------------------------------------------------

    const queryLower = query.toLowerCase();
    const allResults = [];

    for (const key of chatKeys) {
      // Extract conversationId from key pattern chat:{conversationId}
      const conversationId = key.replace('chat:', '');

      const rawMessages = await redis('GET', key);
      if (!rawMessages) continue;

      let messagesArray;
      try {
        messagesArray = typeof rawMessages === 'string' ? JSON.parse(rawMessages) : rawMessages;
      } catch (_e) {
        continue; // Skip malformed data
      }

      if (!Array.isArray(messagesArray)) continue;

      // Search each message in the array
      for (let i = 0; i < messagesArray.length; i++) {
        const msg = messagesArray[i];
        if (!msg || !msg.content) continue;

        const content = String(msg.content);

        // Case-insensitive text match
        if (!content.toLowerCase().includes(queryLower)) continue;

        // Build snippet around the match
        const snippet = extractSnippet(content, queryLower);

        allResults.push({
          conversationId: conversationId,
          messageIndex: i,
          role: msg.role || 'unknown',
          snippet: snippet,
          timestamp: msg.timestamp || null,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Sort by timestamp descending (most recent matches first)
    // -----------------------------------------------------------------------

    allResults.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    // -----------------------------------------------------------------------
    // Paginate
    // -----------------------------------------------------------------------

    const total = allResults.length;
    const startIndex = (page - 1) * limit;
    const paginated = allResults.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      query: query,
      results: paginated,
      total: total,
    });
  } catch (_err) {
    console.error('[CHAT_LOGS_SEARCH] Hata:', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Arama sirasinda bir hata olustu',
    });
  }
});
