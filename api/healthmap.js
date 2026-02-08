// Standalone Vercel Serverless: /api/healthmap
// Checks 16 backend-connected pages and returns status

const { getCorsOrigin } = require('./_middleware/cors');
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

async function probe(url) {
  const t0 = Date.now();
  let ok = false, code = 0, err = null;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    code = res.status;
    ok = res.ok;

    if (!ok || code === 405) {
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });
      code = getRes.status;
      ok = getRes.ok;
    }
  } catch (e) {
    err = e.message || String(e);
  }

  return { url, ok, code, ms: Date.now() - t0, err };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const isStats = req.url && req.url.includes('/stats');

  try {
    const baseUrl = req.query.base || `https://${req.headers.host}`;

    const tasks = TARGETS.map(async (target) => {
      const fullUrl = new URL(target.url, baseUrl).toString();
      const result = await probe(fullUrl);

      let status = 'down';
      if (result.code >= 200 && result.code < 300) status = 'up';
      else if (result.code >= 300 && result.code < 400) status = 'warn';

      return {
        name: target.name,
        url: target.url,
        code: result.code,
        ms: result.ms,
        status,
        err: result.err
      };
    });

    const items = await Promise.all(tasks);

    if (isStats) {
      const upCount = items.filter(i => i.status === 'up').length;
      return res.status(200).json({
        success: true,
        stats: {
          total: items.length,
          up: upCount,
          down: items.length - upCount,
          uptimePercent: Math.round((upCount / items.length) * 1000) / 10
        }
      });
    }

    return res.status(200).json({
      success: true,
      generatedAt: Date.now(),
      items
    });
  } catch (error) {
    console.error('HealthMap API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
};
