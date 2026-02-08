/**
 * USER LOGOUT ENDPOINT
 */

const { Client } = require('pg');
const { authenticate } = require('./jwt-middleware');
const { clearAuthTokens, getRefreshToken } = require('../_lib/cookie-utils');
const { getCorsOrigin } = require('../_middleware/cors');

let dbClient = null;

async function getDbClient() {
  if (!dbClient) {
    dbClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    await dbClient.connect();
  }
  return dbClient;
}

async function logoutUser(userId, revokeAll = false, refreshToken = null) {
  const db = await getDbClient();

  if (revokeAll) {
    await db.query(
      'UPDATE user_sessions SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND revoked = false',
      [userId]
    );
    return { revokedCount: 'all' };
  } else if (refreshToken) {
    const result = await db.query(
      'UPDATE user_sessions SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND refresh_token = $2 AND revoked = false RETURNING id',
      [userId, refreshToken]
    );
    return { revokedCount: result.rowCount };
  }

  return { revokedCount: 0 };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  await new Promise((resolve, reject) => {
    authenticate(req, res, err => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: 'Authentication required', code: 'NOT_AUTHENTICATED' });
  }

  try {
    const { revokeAll } = req.body;

    // Get refresh token from httpOnly cookie
    const refreshToken = getRefreshToken(req);

    const result = await logoutUser(req.user.userId, revokeAll, refreshToken);

    // 🔒 SECURITY: Clear BOTH httpOnly cookies (accessToken + refreshToken)
    clearAuthTokens(res);

    return res.status(200).json({
      success: true,
      message: revokeAll ? 'Logged out from all devices' : 'Logged out successfully',
      data: result,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res
      .status(500)
      .json({
        success: false,
        error: 'Logout failed',
        code: 'SERVER_ERROR',
        details: error.message,
      });
  }
}
