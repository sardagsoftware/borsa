/**
 * 🚀 IndexNow API Integration
 *
 * Features:
 * - Real-time URL indexing notification
 * - Batch submission support
 * - Multi-search engine support (Bing, Yandex, Seznam, Naver)
 * - Rate limiting
 * - Error handling
 * - Verification key management
 */

const axios = require('axios');

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const INDEXNOW_KEY_ID = process.env.INDEXNOW_KEY_ID || 'ailydian-indexnow-2025';

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',  // Generic endpoint
  'https://www.bing.com/indexnow',      // Bing
  'https://yandex.com/indexnow',        // Yandex
  'https://www.seznam.cz/indexnow',     // Seznam
  'https://searchadvisor.naver.com/indexnow' // Naver
];

// Rate limiting
const submitHistory = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Check rate limit for domain
 */
function checkRateLimit(domain) {
  const now = Date.now();
  const history = submitHistory.get(domain) || [];

  // Remove old entries
  const recentHistory = history.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recentHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  // Update history
  recentHistory.push(now);
  submitHistory.set(domain, recentHistory);

  return true;
}

/**
 * Submit single URL to IndexNow
 */
async function submitUrl(url, keyLocation = null) {
  const hostname = new URL(url).hostname;

  if (!checkRateLimit(hostname)) {
    throw new Error('Rate limit exceeded. Please wait before submitting more URLs.');
  }

  const payload = {
    host: hostname,
    key: INDEXNOW_KEY,
    keyLocation: keyLocation || `${PROTOCOL}://${hostname}/${INDEXNOW_KEY_ID}.txt`,
    urlList: [url]
  };

  const results = [];

  // Try all endpoints (they share data)
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        timeout: 5000
      });

      results.push({
        endpoint,
        success: true,
        status: response.status,
        message: response.statusText || 'OK'
      });

      break; // Success, no need to try other endpoints

    } catch (error) {
      results.push({
        endpoint,
        success: false,
        status: error.response?.status || 500,
        message: error.message
      });
    }
  }

  const success = results.some(r => r.success);

  return {
    success,
    url,
    timestamp: new Date().toISOString(),
    results
  };
}

/**
 * Submit multiple URLs to IndexNow (batch)
 */
async function submitUrls(urls, keyLocation = null) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('URLs must be a non-empty array');
  }

  if (urls.length > 10000) {
    throw new Error('Maximum 10,000 URLs per request');
  }

  // Get hostname from first URL
  const hostname = new URL(urls[0]).hostname;

  // Verify all URLs are from same domain
  const allSameDomain = urls.every(url => {
    try {
      return new URL(url).hostname === hostname;
    } catch {
      return false;
    }
  });

  if (!allSameDomain) {
    throw new Error('All URLs must be from the same domain');
  }

  if (!checkRateLimit(hostname)) {
    throw new Error('Rate limit exceeded. Please wait before submitting more URLs.');
  }

  const payload = {
    host: hostname,
    key: INDEXNOW_KEY,
    keyLocation: keyLocation || `${PROTOCOL}://${hostname}/${INDEXNOW_KEY_ID}.txt`,
    urlList: urls
  };

  const results = [];

  // Try all endpoints
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        timeout: 10000
      });

      results.push({
        endpoint,
        success: true,
        status: response.status,
        message: response.statusText || 'OK'
      });

      break; // Success

    } catch (error) {
      results.push({
        endpoint,
        success: false,
        status: error.response?.status || 500,
        message: error.message
      });
    }
  }

  const success = results.some(r => r.success);

  return {
    success,
    urlCount: urls.length,
    timestamp: new Date().toISOString(),
    results
  };
}

/**
 * Handle IndexNow API endpoint (POST /api/seo/indexnow)
 */
async function handleIndexNow(req, res) {
  try {
    const { url, urls, keyLocation } = req.body;

    // Validate API key (simple check)
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey || apiKey !== process.env.INDEXNOW_API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Valid API key required.'
      });
    }

    // Single URL submission
    if (url && !urls) {
      const result = await submitUrl(url, keyLocation);
      return res.json(result);
    }

    // Batch URL submission
    if (urls && Array.isArray(urls)) {
      const result = await submitUrls(urls, keyLocation);
      return res.json(result);
    }

    // Invalid request
    return res.status(400).json({
      success: false,
      message: 'Either "url" or "urls" parameter is required'
    });

  } catch (error) {
    console.error('❌ IndexNow submission error:', error);

    return res.status(error.message.includes('Rate limit') ? 429 : 500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Get IndexNow verification key file content
 */
function getVerificationKeyContent() {
  return INDEXNOW_KEY;
}

/**
 * Handle IndexNow key verification endpoint (GET /{key-id}.txt)
 */
async function handleKeyVerification(req, res) {
  try {
    const keyContent = getVerificationKeyContent();

    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.send(keyContent);

  } catch (error) {
    console.error('❌ Key verification error:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Trigger automatic IndexNow submission for updated pages
 */
async function autoSubmitOnUpdate(urls) {
  try {
    // Auto-submit without blocking the main response
    setImmediate(async () => {
      try {
        const result = await submitUrls(Array.isArray(urls) ? urls : [urls]);
        console.log('✅ Auto-submitted to IndexNow:', result);
      } catch (error) {
        console.error('❌ Auto-submit error:', error.message);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Auto-submit scheduling error:', error);
    return false;
  }
}

module.exports = {
  handleIndexNow,
  handleKeyVerification,
  submitUrl,
  submitUrls,
  autoSubmitOnUpdate,
  getVerificationKeyContent,
  INDEXNOW_KEY,
  INDEXNOW_KEY_ID
};
