/**
 * OAuth endpoint - temporarily disabled
 * Vercel Serverless Function
 */

const { applySanitization } = require('../_middleware/sanitize');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = (req, res) => {
  applySanitization(req, res);

  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(503).json({
    success: false,
    error: 'OAuth servisi gecici olarak devre disi.',
    message: 'Lutfen Google OAuth veya e-posta ile giris yapin.',
  });
};
