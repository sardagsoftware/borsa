/**
 * AILYDIAN Admin Dashboard - User Data Export API
 *
 * GET /api/admin-dashboard/users/export?id=xxx
 *
 * GDPR/KVKK-compliant data export (right of data portability).
 * Collects all user data: profile, settings, conversations, messages.
 * Returns as a single JSON document for CSV conversion on dashboard side.
 *
 * Strips password_hash and totp_secret from output.
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

function arrayToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

/**
 * Fields to strip from all exported objects.
 * These are either sensitive or internal-only.
 */
const STRIP_FIELDS = ['password_hash', 'totp_secret'];

/**
 * Remove sensitive/internal fields from an object.
 */
function cleanForExport(obj) {
  if (!obj) return obj;
  const clean = { ...obj };
  for (const field of STRIP_FIELDS) {
    delete clean[field];
  }
  return clean;
}

/**
 * Clean a message for export - strip internal references, keep content.
 */
function cleanMessage(msg) {
  if (!msg) return null;
  return {
    role: msg.role || null,
    content: msg.content || '',
    model: msg.model || null,
    tokens_used: parseInt(msg.tokens_used, 10) || 0,
    created_at: msg.created_at || null,
  };
}

/**
 * Clean a conversation for export.
 */
function cleanConversation(conv) {
  if (!conv) return null;
  return {
    title: conv.title || '',
    model_used: conv.model_used || null,
    message_count: parseInt(conv.message_count, 10) || 0,
    created_at: conv.created_at || null,
    updated_at: conv.updated_at || null,
  };
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

  const userId = (req.query.id || '').trim();

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Kullanici ID parametresi gerekli',
    });
  }

  if (userId.length > 128 || /[^a-zA-Z0-9\-_]/.test(userId)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz kullanici ID formati',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Fetch user profile
    // -----------------------------------------------------------------------
    const rawUser = await redis('HGETALL', `chat:user:${userId}`);
    const user = arrayToObject(rawUser);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    const cleanUser = cleanForExport(user);

    // Convert two_factor_enabled to boolean for readability
    cleanUser.two_factor_enabled = user.two_factor_enabled === 'true';

    // -----------------------------------------------------------------------
    // 2. Fetch user settings
    // -----------------------------------------------------------------------
    const rawSettings = await redis('HGETALL', `chat:settings:${userId}`);
    const settings = arrayToObject(rawSettings);

    let cleanSettings = null;
    if (settings) {
      cleanSettings = { ...settings };
      // Remove internal user_id reference from settings export
      delete cleanSettings.user_id;

      // Convert string booleans
      const booleanFields = [
        'auto_save_history',
        'notifications_enabled',
        'sound_enabled',
        'email_notifications',
        'use_history',
        'analytics',
      ];
      for (const field of booleanFields) {
        if (cleanSettings[field] !== undefined) {
          cleanSettings[field] = cleanSettings[field] === 'true';
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. Fetch all conversations with their messages
    // -----------------------------------------------------------------------
    const convIds = await redis('LRANGE', `chat:user:${userId}:convs`, 0, -1);
    const conversations = [];

    if (convIds && convIds.length > 0) {
      for (const convId of convIds) {
        // Fetch conversation metadata
        const rawConv = await redis('HGETALL', `chat:conv:${convId}`);
        const conv = arrayToObject(rawConv);
        if (!conv) continue;

        const cleanConv = cleanConversation(conv);

        // Fetch all messages for this conversation
        const msgIds = await redis('LRANGE', `chat:conv:${convId}:msgs`, 0, -1);
        const messages = [];

        if (msgIds && msgIds.length > 0) {
          for (const msgId of msgIds) {
            const rawMsg = await redis('HGETALL', `chat:msg:${msgId}`);
            const msg = arrayToObject(rawMsg);
            if (msg) {
              messages.push(cleanMessage(msg));
            }
          }
        }

        conversations.push({
          ...cleanConv,
          messages,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 4. Build the complete export document
    // -----------------------------------------------------------------------
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.adminUser.sub || 'admin',
        format: 'AILYDIAN_USER_DATA_EXPORT_V1',
        description: 'KVKK/GDPR uyumlu kullanici veri ihracati',
      },
      profile: cleanUser,
      settings: cleanSettings,
      conversations,
      statistics: {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce(
          (sum, conv) => sum + (conv.messages ? conv.messages.length : 0),
          0
        ),
      },
    };

    // -----------------------------------------------------------------------
    // Set appropriate headers for data export
    // -----------------------------------------------------------------------
    const sanitizedEmail = (user.email || 'unknown').replace(/[^a-zA-Z0-9@._-]/g, '');
    const filename = `user-export-${sanitizedEmail}-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json(exportData);
  } catch (_err) {
    console.error('[ADMIN_USER_EXPORT]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Veri ihracati basarisiz',
    });
  }
});
