/**
 * 🏓 Simple Ping API Endpoint
 *
 * No dependencies, no database - just a simple health check
 * for Vercel serverless functions
 */

const { handleCORS } = require('../security/cors-config');

module.exports = (req, res) => {
  // 🔒 SECURE CORS - Whitelist-based
  if (handleCORS(req, res)) return;

  // Return simple pong response
  res.status(200).json({
    status: 'success',
    message: 'pong',
    timestamp: new Date().toISOString(),
    vercel: true,
    i18n: {
      enabled: true,
      languages: 11,
      latest: 'az'
    },
    security: {
      vulnerabilities: 3,
      severity: 'low/moderate',
      high_fixed: 5
    }
  });
};
