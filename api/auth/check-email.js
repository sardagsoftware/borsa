/**
 * Check if email exists in database
 * Vercel Serverless Function
 */

const User = require('../../backend/models/User');
const { handleCORS } = require('../../middleware/cors-handler');

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
        message: 'Email is required'
      });
    }

    // 🔒 SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());

    return res.status(200).json({
      success: true,
      exists: !!user
    });

  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
