// Minimal Vercel Serverless Function Test
module.exports = async (req, res) => {
  // Allow CORS
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Test response without calling external APIs
    res.status(200).json({
      success: true,
      message: 'Chat API test successful!',
      provider: 'Test Function',
      response: `Echo: ${message}`,
      timestamp: new Date().toISOString(),
      env_check: {
        openai_configured: !!process.env.OPENAI_API_KEY,
        anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
        node_env: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Test API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
