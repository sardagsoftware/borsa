/**
 * 🏓 Simple Ping API Endpoint
 *
 * No dependencies, no database - just a simple health check
 * for Vercel serverless functions
 */

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
