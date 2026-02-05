/**
 * Chat Auth Debug API
 * GET /api/chat-auth/debug
 * Simple debug endpoint
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Test 1: Basic response
  try {
    const testResult = {
      success: true,
      message: 'Debug endpoint working',
      nodeVersion: process.version,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasUpstash: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(testResult);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
