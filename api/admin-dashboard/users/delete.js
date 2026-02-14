/**
 * AILYDIAN Admin Dashboard - User Delete API
 *
 * DELETE /api/admin-dashboard/users/delete
 * Body: { id, reason }
 *
 * GDPR/KVKK-compliant permanent deletion:
 *   - User profile data (chat:user:{id})
 *   - Email mapping (chat:email:{email})
 *   - Phone mapping (chat:phone:{phone})
 *   - User settings (chat:settings:{id})
 *   - All conversations and their messages
 *   - All active sessions
 *   - Password reset tokens
 *
 * This operation is IRREVERSIBLE. Requires:
 *   - super_admin role
 *   - reason string for audit trail
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
 * Write an entry to the admin audit log.
 */
async function writeAuditLog(action, adminId, targetUserId, details) {
  const timestamp = Date.now();
  const entry = JSON.stringify({
    action,
    adminId,
    targetUserId,
    timestamp: new Date(timestamp).toISOString(),
    details: details || null,
  });

  const key = `admin:audit:${timestamp}`;
  await redis('SET', key, entry);
  await redis('EXPIRE', key, 7776000); // 90 days

  await redis('LPUSH', 'admin:audit:log', entry);
  await redis('LTRIM', 'admin:audit:log', 0, 9999);
}

/**
 * Delete all conversations and their messages for a user.
 */
async function deleteUserConversations(userId) {
  const convIds = await redis('LRANGE', `chat:user:${userId}:convs`, 0, -1);
  let deletedConversations = 0;
  let deletedMessages = 0;

  if (convIds && convIds.length > 0) {
    for (const convId of convIds) {
      // Delete all messages in this conversation
      const msgIds = await redis('LRANGE', `chat:conv:${convId}:msgs`, 0, -1);
      if (msgIds && msgIds.length > 0) {
        for (const msgId of msgIds) {
          await redis('DEL', `chat:msg:${msgId}`);
          deletedMessages++;
        }
      }

      // Delete the message list key
      await redis('DEL', `chat:conv:${convId}:msgs`);

      // Delete the conversation hash
      await redis('DEL', `chat:conv:${convId}`);
      deletedConversations++;
    }

    // Delete the user's conversation list
    await redis('DEL', `chat:user:${userId}:convs`);
  }

  return { deletedConversations, deletedMessages };
}

/**
 * Invalidate and delete all sessions for a user.
 */
async function deleteUserSessions(userId) {
  let deleted = 0;
  let cursor = '0';
  const maxIterations = 200;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', 'chat:session:*', 'COUNT', '200');
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];

    for (const key of keys) {
      const sessionUserId = await redis('HGET', key, 'user_id');
      if (sessionUserId === userId) {
        await redis('DEL', key);
        deleted++;
      }
    }

    iterations++;
    if (iterations >= maxIterations) break;
  } while (cursor !== '0');

  return deleted;
}

/**
 * Delete password reset tokens belonging to a user.
 */
async function deleteResetTokens(userId) {
  let deleted = 0;
  let cursor = '0';
  const maxIterations = 100;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', 'chat:reset:*', 'COUNT', '200');
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];

    for (const key of keys) {
      const resetUserId = await redis('HGET', key, 'user_id');
      if (resetUserId === userId) {
        await redis('DEL', key);
        deleted++;
      }
    }

    iterations++;
    if (iterations >= maxIterations) break;
  } while (cursor !== '0');

  return deleted;
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

  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca DELETE istegi desteklenir',
    });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // -------------------------------------------------------------------------
  // Only super_admin can delete users
  // -------------------------------------------------------------------------
  if (req.adminUser.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Kullanici silme yetkisi yalnizca super_admin icin gecerlidir',
    });
  }

  const { id, reason } = req.body || {};

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Kullanici ID gerekli',
    });
  }

  if (id.length > 128 || /[^a-zA-Z0-9\-_]/.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Gecersiz kullanici ID formati',
    });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Silme nedeni gerekli (en az 3 karakter)',
    });
  }

  // Prevent admins from deleting themselves
  if (req.adminUser.sub === id) {
    return res.status(400).json({
      success: false,
      error: 'Kendi hesabinizi silemezsiniz',
    });
  }

  try {
    // -----------------------------------------------------------------------
    // Verify user exists and collect data for audit
    // -----------------------------------------------------------------------
    const rawUser = await redis('HGETALL', `chat:user:${id}`);
    const user = arrayToObject(rawUser);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    // Store minimal info for audit before deletion
    const auditSnapshot = {
      email: user.email || null,
      display_name: user.display_name || null,
      created_at: user.created_at || null,
      auth_provider: user.auth_provider || null,
    };

    // -----------------------------------------------------------------------
    // Phase 1: Invalidate and delete all sessions (immediate lockout)
    // -----------------------------------------------------------------------
    const sessionsDeleted = await deleteUserSessions(id);

    // -----------------------------------------------------------------------
    // Phase 2: Delete all conversations and messages
    // -----------------------------------------------------------------------
    const { deletedConversations, deletedMessages } = await deleteUserConversations(id);

    // -----------------------------------------------------------------------
    // Phase 3: Delete user settings
    // -----------------------------------------------------------------------
    await redis('DEL', `chat:settings:${id}`);

    // -----------------------------------------------------------------------
    // Phase 4: Delete email and phone mappings
    // -----------------------------------------------------------------------
    if (user.email) {
      await redis('DEL', `chat:email:${user.email}`);
    }
    if (user.phone_number) {
      await redis('DEL', `chat:phone:${user.phone_number}`);
    }

    // -----------------------------------------------------------------------
    // Phase 5: Delete password reset tokens
    // -----------------------------------------------------------------------
    const resetTokensDeleted = await deleteResetTokens(id);

    // -----------------------------------------------------------------------
    // Phase 6: Delete the user record itself
    // -----------------------------------------------------------------------
    await redis('DEL', `chat:user:${id}`);

    // -----------------------------------------------------------------------
    // Write audit log (KVKK/GDPR compliance - record the deletion)
    // -----------------------------------------------------------------------
    await writeAuditLog('user_deleted', req.adminUser.sub || 'unknown', id, {
      reason: reason.trim(),
      deletedAt: new Date().toISOString(),
      snapshot: auditSnapshot,
      stats: {
        sessionsDeleted,
        deletedConversations,
        deletedMessages,
        resetTokensDeleted,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Kullanici ve tum verileri kalici olarak silindi',
      stats: {
        sessionsDeleted,
        deletedConversations,
        deletedMessages,
        resetTokensDeleted,
        settingsDeleted: true,
        mappingsDeleted: true,
      },
    });
  } catch (_err) {
    console.error('[ADMIN_USER_DELETE]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Kullanici silme islemi basarisiz',
    });
  }
});
