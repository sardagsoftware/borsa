/**
 * 📊 Rate Limit Statistics API
 *
 * Endpoint: GET /api/rate-limit-stats
 * Purpose: Monitoring and observability for rate limiting
 */

const { getStats } = require('../middleware/rate-limiter');

module.exports = async (req, res) => {
  try {
    // Admin-only endpoint (simple check - enhance in production)
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_API_KEY;

    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
    }

    const stats = getStats();

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RateLimitStats] Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve rate limit statistics'
    });
  }
};
