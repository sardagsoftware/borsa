/**
 * 📊 Idempotency Statistics API
 *
 * Endpoint: GET /api/idempotency-stats
 * Purpose: Monitor idempotency cache status and effectiveness
 * Policy: White-Hat • Zero Mock • Audit-Ready
 */

const { getIdempotencyStats, clearIdempotencyCache } = require('../middleware/idempotency-vercel');

module.exports = async (req, res) => {
  try {
    // Admin-only endpoint
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_API_KEY;

    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
    }

    // Handle clear cache action
    if (req.method === 'DELETE' && isAdmin) {
      const result = clearIdempotencyCache();
      return res.status(200).json({
        success: true,
        message: 'Idempotency cache cleared',
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    // Get stats
    const stats = getIdempotencyStats();

    res.status(200).json({
      success: true,
      data: stats,
      metadata: {
        endpoint: '/api/idempotency-stats',
        method: req.method,
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[IdempotencyStats] Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve idempotency statistics'
    });
  }
};
