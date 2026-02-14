/**
 * AILYDIAN Admin Dashboard - User Update API
 *
 * PUT /api/admin-dashboard/users/update
 * Body: { id, status, role, display_name }
 *
 * Updates user fields:
 *   - status:       'active', 'banned', 'suspended'
 *   - role:         'user', 'premium', 'moderator', 'admin'
 *   - display_name: Free text (max 100 chars)
 *
 * At least one of status, role, or display_name must be provided.
 * Every update is recorded to the audit trail (Redis key admin:audit:*).
 *
 * Role changes to 'admin' require super_admin.
 * Admins cannot modify themselves.
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

const ALLOWED_ROLES = ['user', 'premium', 'moderator', 'admin'];
const ALLOWED_STATUSES = ['active', 'banned', 'suspended'];

/**
 * Write an entry to the admin audit log.
 * Key format: admin:audit:{timestamp}
 * TTL: 90 days (7776000 seconds)
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

  // Also push to an audit list for easy querying
  await redis('LPUSH', 'admin:audit:log', entry);
  // Keep the list trimmed to last 10000 entries
  await redis('LTRIM', 'admin:audit:log', 0, 9999);
}

/**
 * Invalidate all sessions for a user by scanning chat:session:* keys.
 * Used when banning a user for immediate lockout.
 */
async function invalidateUserSessions(userId) {
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
        await redis('HSET', key, 'is_valid', 'false');
      }
    }

    iterations++;
    if (iterations >= maxIterations) break;
  } while (cursor !== '0');
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

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca PUT istegi desteklenir',
    });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  const { id, status, role, display_name } = req.body || {};

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

  // At least one update field must be provided
  if (!status && !role && !display_name) {
    return res.status(400).json({
      success: false,
      error: 'En az bir guncelleme alani gerekli (status, role, display_name)',
    });
  }

  // Validate role if provided
  if (role !== undefined && role !== null) {
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz rol degeri. Izin verilen roller: user, premium, moderator, admin',
      });
    }

    // Only super_admin can assign 'admin' role
    if (role === 'admin' && req.adminUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin rolu atama yetkisi yalnizca super_admin icin gecerlidir',
      });
    }
  }

  // Validate status if provided
  if (status !== undefined && status !== null) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz status degeri. Izin verilen degerler: active, banned, suspended',
      });
    }
  }

  // Validate display_name if provided
  if (display_name !== undefined && display_name !== null) {
    if (typeof display_name !== 'string' || display_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz gorunen ad degeri',
      });
    }
    if (display_name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Gorunen ad en fazla 100 karakter olabilir',
      });
    }
  }

  try {
    // -----------------------------------------------------------------------
    // Verify user exists
    // -----------------------------------------------------------------------
    const rawUser = await redis('HGETALL', `chat:user:${id}`);
    const user = arrayToObject(rawUser);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    // Prevent admins from modifying themselves
    if (req.adminUser.sub === id) {
      return res.status(400).json({
        success: false,
        error: 'Kendi hesabiniz uzerinde bu islemi yapamazsiniz',
      });
    }

    const timestamp = new Date().toISOString();
    const changes = {};
    const hsetArgs = ['HSET', `chat:user:${id}`];

    // -----------------------------------------------------------------------
    // Build update fields
    // -----------------------------------------------------------------------

    if (status) {
      changes.status = {
        previous: user.status || 'active',
        new: status,
      };

      hsetArgs.push('status', status);
      hsetArgs.push('updated_at', timestamp);

      // Handle banned state
      if (status === 'banned') {
        hsetArgs.push('isBanned', 'true');
        hsetArgs.push('banned_at', timestamp);
        hsetArgs.push('banned_by', req.adminUser.sub || 'unknown');
      } else if (status === 'active' && user.isBanned === 'true') {
        hsetArgs.push('isBanned', 'false');
        hsetArgs.push('unbanned_at', timestamp);
        hsetArgs.push('unbanned_by', req.adminUser.sub || 'unknown');
      }
    }

    if (role) {
      changes.role = {
        previous: user.role || 'user',
        new: role,
      };

      hsetArgs.push('role', role);
      hsetArgs.push('role_changed_at', timestamp);
      hsetArgs.push('role_changed_by', req.adminUser.sub || 'unknown');

      if (!status) {
        hsetArgs.push('updated_at', timestamp);
      }
    }

    if (display_name) {
      changes.display_name = {
        previous: user.display_name || '',
        new: display_name.trim(),
      };

      hsetArgs.push('display_name', display_name.trim());

      if (!status && !role) {
        hsetArgs.push('updated_at', timestamp);
      }
    }

    // -----------------------------------------------------------------------
    // Execute the update
    // -----------------------------------------------------------------------
    await redis(...hsetArgs);

    // If user was banned, invalidate their sessions for immediate lockout
    if (status === 'banned') {
      await invalidateUserSessions(id);
    }

    // -----------------------------------------------------------------------
    // Write audit log
    // -----------------------------------------------------------------------
    await writeAuditLog('user_updated', req.adminUser.sub || 'unknown', id, {
      changes,
      updatedAt: timestamp,
    });

    return res.status(200).json({
      success: true,
      message: 'Kullanici basariyla guncellendi',
      userId: id,
      changes,
    });
  } catch (_err) {
    console.error('[ADMIN_USER_UPDATE]', _err.message);
    return res.status(500).json({
      success: false,
      error: 'Kullanici guncelleme islemi basarisiz',
    });
  }
});
