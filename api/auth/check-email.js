/**
 * Check if email exists in database
 * Vercel Serverless Function
 *
 * TEMPORARY IMPLEMENTATION: Returns mock data
 * TODO: Integrate with Vercel Postgres or external database
 */

const { handleCORS } = require('../_lib/cors-simple');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // 🔒 SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // TEMPORARY: Mock response for testing
    // In production, this should query Vercel Postgres or external DB
    // For now, all emails return as "not exists" to allow new registrations

    return res.status(200).json({
      success: true,
      exists: false,
      message: 'Email check successful (mock mode)',
    });
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
