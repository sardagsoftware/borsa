// Simple test endpoint - no dependencies
module.exports = async (req, res) => {
  console.log('✅ Simple test endpoint called');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
};
