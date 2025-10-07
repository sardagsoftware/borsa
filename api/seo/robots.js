const SUBDOMAINS = process.env.SEO_SUBDOMAINS?.split(',') || [
  'www', 'borsa', 'travel', 'dev', 'docs', 'news', 'ai', 'hub', 'brain', 'market'
];

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';
const CACHE_SECONDS = parseInt(process.env.SEO_CACHE_SECONDS || '600', 10);

/**
 * Generate robots.txt for subdomain
 */
function generateRobots(subdomain = 'www') {
  const baseUrl = `${PROTOCOL}://${subdomain === 'www' ? PRIMARY_DOMAIN : `${subdomain}.${PRIMARY_DOMAIN}`}`;

  const baseRules = [
    '# Ailydian Enterprise - Robots.txt',
    `# Subdomain: ${subdomain}`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /api/private/',
    'Disallow: /admin/',
    'Disallow: /dashboard/private/',
    '',
    '# Sitemaps',
    `Sitemap: ${baseUrl}/sitemap-index.xml`,
    `Sitemap: ${baseUrl}/sitemap-core.xml`,
    '',
    '# Search Engine Bots',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    'User-agent: Slurp',
    'Allow: /',
    '',
    'User-agent: DuckDuckBot',
    'Allow: /',
    '',
    'User-agent: Baiduspider',
    'Allow: /',
    '',
    'User-agent: facebookexternalhit',
    'Allow: /',
    '',
    'User-agent: Twitterbot',
    'Allow: /',
    '',
    '# Crawl-delay',
    'Crawl-delay: 1',
    ''
  ];

  return baseRules.join('\n');
}

/**
 * Express.js Handler
 */
async function handleRobots(req, res) {
  try {
    // Detect subdomain from hostname
    const hostname = req.headers.host || '';
    let subdomain = 'www';

    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && SUBDOMAINS.includes(parts[0])) {
        subdomain = parts[0];
      }
    }

    // Generate robots.txt
    const robotsTxt = generateRobots(subdomain);

    // Send response
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
    res.status(200).send(robotsTxt);

  } catch (error) {
    console.error('❌ Robots.txt generation error:', error);
    res.status(500).send('# Error generating robots.txt');
  }
}

module.exports = { handleRobots };
