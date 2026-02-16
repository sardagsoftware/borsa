/**
 * Chat Auth Health Check API
 * GET /api/chat-auth/debug
 * Health check endpoint
 */

const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');
module.exports = function handler(req, res) {
  applySanitization(req, res);
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    success: true,
    service: 'chat-auth',
    status: 'healthy',
    mode: process.env.UPSTASH_REDIS_REST_URL ? 'persistent' : 'demo',
    timestamp: new Date().toISOString()
  });
};
