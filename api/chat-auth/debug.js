/**
 * Chat Auth Debug API
 * GET/POST /api/chat-auth/debug
 * Debug endpoint for testing
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const testResult = {
      success: true,
      message: 'Debug endpoint working',
      method: req.method,
      nodeVersion: process.version,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasUpstash: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
      },
      body: {
        raw: req.body,
        type: typeof req.body,
        isNull: req.body === null,
        isUndefined: req.body === undefined,
        stringified: JSON.stringify(req.body)
      },
      headers: {
        contentType: req.headers['content-type']
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
