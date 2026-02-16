const { applySanitization } = require('../_middleware/sanitize');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

/**
 * Handle IndexNow submission
 */
async function handleIndexNow(req, res) {
  applySanitization(req, res);
  try {
    const { url, urlList } = req.body;

    if (!url && !urlList) {
      return res.status(400).json({
        error: 'Either url or urlList is required',
      });
    }

    // In production, you would submit to IndexNow API here
    // For now, we'll just acknowledge the request
    res.status(200).json({
      success: true,
      message: 'IndexNow submission acknowledged',
      key: INDEXNOW_KEY.substring(0, 8) + '...',
    });
  } catch (error) {
    console.error('❌ IndexNow submission error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Handle IndexNow key verification
 */
async function handleKeyVerification(req, res) {
  applySanitization(req, res);
  try {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.status(200).send(INDEXNOW_KEY);
  } catch (error) {
    console.error('❌ IndexNow key verification error:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  handleIndexNow,
  handleKeyVerification,
};
