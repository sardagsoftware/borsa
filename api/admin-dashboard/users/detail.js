/**
 * AILYDIAN Admin Dashboard - User Detail API
 *
 * GET /api/admin-dashboard/users/detail?id=xxx
 *
 * Fetches a single user by ID, including:
 *   - Full profile (minus password_hash, totp_secret)
 *   - Conversation count
 *   - Last active timestamp
 *   - Created at timestamp
 *   - User settings
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

const SENSITIVE_FIELDS = ['password_hash', 'totp_secret'];

function stripSensitive(user) {
  if (!user) return user;
  const clean = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete clean[field];
  }
  return clean;
}

/**
 * Determine last_active by checking the most recent conversation update
 * or fallback to updated_at or last_login on the user record.
 */
async function getLastActive(userId, user) {
  // Check user-level fields first
  let lastActive = user.last_login || user.updated_at || user.created_at || null;

  try {
    // Check most recent conversation for activity
    const convIds = await redis('LRANGE', `chat:user:${userId}:convs`, 0, 0);
    if (convIds && convIds.length > 0) {
      const rawConv = await redis('HGETALL', `chat:conv:${convIds[0]}`);
      const conv = arrayToObject(rawConv);
      if (conv && conv.updated_at) {
        // Use the more recent of user login and conversation activity
        if (!lastActive || new Date(conv.updated_at) > new Date(lastActive)) {
          lastActive = conv.updated_at;
        }
      }
    }
  } catch (_err) {
    // Best-effort - return whatever we have
  }

  return lastActive;
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

  // Basic ID format validation - reject obviously malicious input
  if (userId.length > 128 || /[^a-zA-Z0-9\-_]/.test(userId)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz kullanici ID formati',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // Fetch user data
    // -----------------------------------------------------------------------
    const rawUser = await redis('HGETALL', `chat:user:${userId}`);
    const user = arrayToObject(rawUser);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    // -----------------------------------------------------------------------
    // Fetch conversation count
    // -----------------------------------------------------------------------
    const conversationCount = await redis('LLEN', `chat:user:${userId}:convs`);

    // -----------------------------------------------------------------------
    // Fetch last active timestamp
    // -----------------------------------------------------------------------
    const lastActive = await getLastActive(userId, user);

    // -----------------------------------------------------------------------
    // Fetch user settings
    // -----------------------------------------------------------------------
    const rawSettings = await redis('HGETALL', `chat:settings:${userId}`);
    const settings = arrayToObject(rawSettings);

    // Convert string booleans in settings
    if (settings) {
      const booleanFields = [
        'auto_save_history',
        'notifications_enabled',
        'sound_enabled',
        'email_notifications',
        'use_history',
        'analytics',
      ];
      for (const field of booleanFields) {
        if (settings[field] !== undefined) {
          settings[field] = settings[field] === 'true';
        }
      }
    }

    // -----------------------------------------------------------------------
    // Build response
    // -----------------------------------------------------------------------
    const cleanUser = stripSensitive(user);

    // Add two_factor_enabled as a boolean (don't expose the secret)
    cleanUser.two_factor_enabled = user.two_factor_enabled === 'true';

    return res.status(200).json({
      success: true,
      user: cleanUser,
      conversationCount: conversationCount || 0,
      lastActive: lastActive || null,
      createdAt: user.created_at || null,
      settings: settings || null,
    });
  } catch (_err) {
    console.error('[ADMIN_USER_DETAIL]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Kullanici bilgileri alinamadi',
    });
  }
});
