/**
 * AILYDIAN Admin Dashboard - Chat Log Messages API
 *
 * GET /api/admin-dashboard/chat-logs/messages
 *
 * Retrieves all messages for a specific conversation from Redis.
 *
 * Query params:
 *   conversationId - Required conversation ID
 *
 * Returns: {
 *   success: true,
 *   conversationId: "abc123",
 *   messages: [{ role, content, timestamp }],
 *   messageCount: 42
 * }
 *
 * Redis key pattern:
 *   chat:{conversationId} - JSON array of { role, content, timestamp }
 *
 * PII Protection:
 *   - Email addresses are masked: user@example.com -> ***@***.com
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
    console.error('[CHAT_LOGS_MESSAGES_REDIS]', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// PII Masking
// ---------------------------------------------------------------------------

/**
 * Mask email addresses in text content.
 * Replaces any email with ***@***.com to protect user privacy.
 *
 * Examples:
 *   "Contact john.doe@example.com" -> "Contact ***@***.com"
 *   "Email: a@b.co"               -> "Email: ***@***.com"
 */
function maskEmails(text) {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.com');
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
    console.error('[CHAT_LOGS_MESSAGES] Redis yapilandirmasi eksik');
    return res.status(500).json({
      success: false,
      error: 'Sunucu yapilandirma hatasi',
    });
  }

  // Parse and validate params
  const conversationId = req.query.conversationId;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'conversationId parametresi zorunludur',
    });
  }

  // Basic input validation - prevent injection via key pattern
  if (typeof conversationId !== 'string' || conversationId.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz conversationId formati',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // Fetch messages from chat:{conversationId} key
    // This key stores a JSON array of message objects.
    // -----------------------------------------------------------------------

    const rawMessages = await redis('GET', `chat:${conversationId}`);

    if (!rawMessages) {
      return res.status(404).json({
        success: false,
        error: 'Sohbet bulunamadi',
      });
    }

    let messagesArray;
    try {
      messagesArray = typeof rawMessages === 'string' ? JSON.parse(rawMessages) : rawMessages;
    } catch (_e) {
      return res.status(500).json({
        success: false,
        error: 'Sohbet verisi okunamadi',
      });
    }

    if (!Array.isArray(messagesArray)) {
      return res.status(500).json({
        success: false,
        error: 'Sohbet verisi okunamadi',
      });
    }

    // -----------------------------------------------------------------------
    // Process messages: extract fields and apply PII masking
    // -----------------------------------------------------------------------

    const messages = messagesArray.map(msg => {
      const content = msg && msg.content ? String(msg.content) : '';

      return {
        role: (msg && msg.role) || 'unknown',
        content: maskEmails(content),
        timestamp: (msg && msg.timestamp) || null,
      };
    });

    return res.status(200).json({
      success: true,
      conversationId: conversationId,
      messages: messages,
      messageCount: messages.length,
    });
  } catch (_err) {
    console.error('[CHAT_LOGS_MESSAGES] Hata:', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Mesajlar alinirken bir hata olustu',
    });
  }
});
