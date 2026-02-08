/**
 * AUTH VERIFICATION ENDPOINT
 * Checks if user is authenticated via httpOnly cookie
 */

const { authenticate } = require('./jwt-middleware');
const { getCorsOrigin } = require('../_middleware/cors');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Authenticate using httpOnly cookie
    await new Promise((resolve, reject) => {
      authenticate(req, res, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.user) {
      return res.status(200).json({
        authenticated: false,
        message: 'Not authenticated',
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Verification error:', error);

    return res.status(200).json({
      authenticated: false,
      message: 'Authentication verification failed',
    });
  }
}
