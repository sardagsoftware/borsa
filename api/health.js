/**
 * Vercel Serverless Health Check API
 * Minimal, fast health endpoint
 */

const { getCorsOrigin } = require('./_middleware/cors');
const { applySanitization } = require('./_middleware/sanitize');
module.exports = async (req, res) => {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'production',
      platform: 'vercel-serverless',
      models_count: 23,
      features: {
        chat: true,
        translation: true,
        multimodel: true,
        i18n: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: 'Sistem durumu kontrol hatası',
    });
  }
};
