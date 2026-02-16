/**
 * Chat API - Ultra Minimal Version
 * Testing to identify the crash cause
 */

const { getCorsOrigin } = require('./_middleware/cors');
const { applySanitization } = require('./_middleware/sanitize');
module.exports = async (req, res) => {
  applySanitization(req, res);
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Ultra simple response - no axios, no APIs, no nothing
    return res.status(200).json({
      success: true,
      response: `Merhaba! Ben LyDian AI. Mesajınız: "${message}"

Bu basit bir test yanıtıdır. Chat API başarıyla çalışıyor!`,
      model: 'GX8E2D9A',
      credits_used: 0,
      message: 'Test mode - chat API is working',
    });
  } catch (error) {
    // Absolute fail-safe
    return res.status(200).json({
      success: true,
      response: 'LyDian AI test modunda çalışıyor.',
      model: 'GX8E2D9A',
      credits_used: 0,
      message: 'Fail-safe mode',
    });
  }
};
