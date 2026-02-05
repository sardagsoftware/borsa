/**
 * Chat Auth Health Check API
 * GET /api/chat-auth/debug
 * Health check endpoint
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    success: true,
    service: 'chat-auth',
    status: 'healthy',
    mode: process.env.UPSTASH_REDIS_REST_URL ? 'persistent' : 'demo',
    timestamp: new Date().toISOString()
  });
};
