// 🏥 HEALTH MAP API ROUTE - Multi-page Health Check
// Checks 16 backend-connected pages and returns status

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Target pages to check
const TARGETS = [
  { name: 'Auth', url: '/auth.html' },
  { name: 'Chat', url: '/chat.html' },
  { name: 'IQ', url: '/lydian-iq.html' },
  { name: 'AI Ops', url: '/enterprise.html' },
  { name: 'Status', url: '/status.html' },
  { name: 'Developers', url: '/developers.html' },
  { name: 'API Docs', url: '/api-reference.html' },
  { name: 'Changelog', url: '/changelog.html' },
  { name: 'About', url: '/about.html' },
  { name: 'Blog', url: '/blog.html' },
  { name: 'Careers', url: '/careers.html' },
  { name: 'Privacy', url: '/privacy.html' },
  { name: 'Contact', url: '/contact.html' },
  { name: 'Help', url: '/help.html' },
  { name: 'Dashboard', url: '/dashboard.html' },
  { name: 'Models', url: '/models.html' }
];

/**
 * Resolve relative URL to absolute
 */
function absUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

/**
 * Probe a single URL
 */
async function probe(url) {
  const t0 = Date.now();
  let ok = false, code = 0, method = 'HEAD', err = null;

  try {
    // Try HEAD first (faster)
    const headRes = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      timeout: 5000
    });
    code = headRes.status;
    ok = headRes.ok;

    // If HEAD fails or returns 405, try GET
    if (!ok || code === 405) {
      method = 'GET';
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        timeout: 5000
      });
      code = getRes.status;
      ok = getRes.ok;
    }
  } catch (e) {
    err = e.message || String(e);
  }

  const ms = Date.now() - t0;
  return { url, ok, code, ms, method, err };
}

/**
 * @route   GET /api/healthmap
 * @desc    Check health of all target pages
 * @query   base - Base URL (defaults to request origin)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Determine base URL
    const baseUrl = req.query.base || `${req.protocol}://${req.get('host')}`;

    // Probe all targets in parallel
    const tasks = TARGETS.map(async (target) => {
      const fullUrl = absUrl(target.url, baseUrl);
      const result = await probe(fullUrl);

      // Determine status: up (200-299), warn (300-399), down (400-599)
      let status = 'down';
      if (result.code >= 200 && result.code < 300) status = 'up';
      else if (result.code >= 300 && result.code < 400) status = 'warn';

      return {
        name: target.name,
        url: target.url, // Return relative URL for frontend
        code: result.code,
        ms: result.ms,
        status,
        err: result.err
      };
    });

    const items = await Promise.all(tasks);

    res.json({
      success: true,
      generatedAt: Date.now(),
      items
    });

  } catch (error) {
    console.error('HealthMap API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * @route   GET /api/healthmap/stats
 * @desc    Get overall health statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const baseUrl = req.query.base || `${req.protocol}://${req.get('host')}`;

    const tasks = TARGETS.map(async (target) => {
      const fullUrl = absUrl(target.url, baseUrl);
      const result = await probe(fullUrl);
      return result.ok;
    });

    const results = await Promise.all(tasks);
    const upCount = results.filter(ok => ok).length;
    const totalCount = results.length;
    const uptimePercent = Math.round((upCount / totalCount) * 1000) / 10;

    res.json({
      success: true,
      stats: {
        total: totalCount,
        up: upCount,
        down: totalCount - upCount,
        uptimePercent
      }
    });

  } catch (error) {
    console.error('HealthMap Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Stats calculation failed'
    });
  }
});

module.exports = router;
