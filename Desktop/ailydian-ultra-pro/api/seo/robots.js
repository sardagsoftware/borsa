/**
 * 🤖 Dynamic robots.txt Generator
 *
 * Features:
 * - Multi-subdomain support (www, borsa, travel, dev, docs, news, ai, hub, brain, market)
 * - Dynamic sitemap references
 * - Environment-based configuration
 * - Caching (10 minutes)
 * - SEO best practices
 */

const SUBDOMAINS = process.env.SEO_SUBDOMAINS?.split(',') || [
  'www', 'borsa', 'travel', 'dev', 'docs', 'news', 'ai', 'hub', 'brain', 'market'
];

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';
const CACHE_SECONDS = parseInt(process.env.SEO_CACHE_SECONDS || '600', 10);

// Cache storage
let cachedRobots = null;
let cacheTime = 0;

/**
 * Generate robots.txt content based on subdomain
 */
function generateRobots(subdomain = 'www') {
  const baseUrl = `${PROTOCOL}://${subdomain === 'www' ? PRIMARY_DOMAIN : `${subdomain}.${PRIMARY_DOMAIN}`}`;

  // Base rules for all subdomains
  const baseRules = [
    '# Ailydian Enterprise - Robots.txt',
    `# Generated: ${new Date().toISOString()}`,
    `# Domain: ${baseUrl}`,
    '',
    '# Allow all well-behaved bots',
    'User-agent: *',
    'Allow: /',
    '',
    '# Disallow admin & internal areas',
    'Disallow: /api/private/',
    'Disallow: /admin/',
    'Disallow: /internal/',
    'Disallow: /draft/',
    'Disallow: /temp/',
    'Disallow: /*.json$',
    'Disallow: /*.xml$',
    'Disallow: /*?api_key=',
    'Disallow: /*?token=',
    '',
    '# Allow CSS, JS, Images for rendering',
    'Allow: /css/',
    'Allow: /js/',
    'Allow: /images/',
    'Allow: /assets/',
    'Allow: /*.css$',
    'Allow: /*.js$',
    'Allow: /*.png$',
    'Allow: /*.jpg$',
    'Allow: /*.jpeg$',
    'Allow: /*.gif$',
    'Allow: /*.svg$',
    'Allow: /*.webp$',
    '',
  ];

  // Subdomain-specific rules
  const subdomainRules = {
    www: [
      '# Main site - full crawling allowed',
      '',
    ],
    borsa: [
      '# Trading platform - public pages only',
      'Disallow: /api/trading/',
      'Disallow: /portfolio/',
      'Disallow: /orders/',
      '',
    ],
    dev: [
      '# Development environment - no indexing',
      'User-agent: *',
      'Disallow: /',
      '',
    ],
    docs: [
      '# Documentation - full crawling encouraged',
      'Allow: /api/',
      'Allow: /guides/',
      '',
    ],
    news: [
      '# News platform - optimized for news crawling',
      'Allow: /articles/',
      'Allow: /categories/',
      '',
    ],
    ai: [
      '# AI services - public endpoints only',
      'Disallow: /api/keys/',
      'Disallow: /training/',
      '',
    ],
    hub: [
      '# Developer hub - public resources only',
      'Disallow: /sandbox/',
      '',
    ],
    brain: [
      '# AI Brain - public insights only',
      'Disallow: /models/',
      'Disallow: /training/',
      '',
    ],
    market: [
      '# Marketplace - public listings only',
      'Disallow: /checkout/',
      'Disallow: /cart/',
      '',
    ],
    travel: [
      '# Travel platform - public listings only',
      'Disallow: /bookings/',
      'Disallow: /reservations/',
      '',
    ]
  };

  // Add subdomain-specific rules
  const specificRules = subdomainRules[subdomain] || [];

  // Sitemap references
  const sitemapRules = [
    '# Sitemaps',
    `Sitemap: ${baseUrl}/sitemap-index.xml`,
    `Sitemap: ${baseUrl}/sitemap-core.xml`,
  ];

  // Add news sitemap for news subdomain
  if (subdomain === 'news') {
    sitemapRules.push(`Sitemap: ${baseUrl}/sitemap-news.xml`);
  }

  // Add image/video sitemaps for relevant subdomains
  if (['www', 'news', 'travel', 'market'].includes(subdomain)) {
    sitemapRules.push(`Sitemap: ${baseUrl}/sitemap-images.xml`);
    sitemapRules.push(`Sitemap: ${baseUrl}/sitemap-videos.xml`);
  }

  sitemapRules.push('');

  // Special bot instructions
  const botRules = [
    '# Google Bot',
    'User-agent: Googlebot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    '# Bing Bot',
    'User-agent: Bingbot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    '# Yandex Bot',
    'User-agent: Yandex',
    'Allow: /',
    'Crawl-delay: 1',
    '',
    '# Bad bots - block',
    'User-agent: AhrefsBot',
    'User-agent: SemrushBot',
    'User-agent: MJ12bot',
    'User-agent: DotBot',
    'User-agent: BLEXBot',
    'Disallow: /',
    '',
  ];

  // Combine all rules
  return [
    ...baseRules,
    ...specificRules,
    ...sitemapRules,
    ...botRules
  ].join('\n');
}

/**
 * Handle robots.txt request
 */
async function handleRobots(req, res) {
  try {
    // Check cache
    const now = Date.now();
    if (cachedRobots && (now - cacheTime) < CACHE_SECONDS * 1000) {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      res.setHeader('X-Robots-Tag', 'noindex');
      return res.send(cachedRobots);
    }

    // Detect subdomain from hostname
    const hostname = req.hostname || req.get('host') || '';
    let subdomain = 'www';

    // Extract subdomain
    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && SUBDOMAINS.includes(parts[0])) {
        subdomain = parts[0];
      }
    }

    // Generate robots.txt
    const robotsTxt = generateRobots(subdomain);

    // Update cache
    cachedRobots = robotsTxt;
    cacheTime = now;

    // Send response
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
    res.setHeader('X-Robots-Tag', 'noindex');
    res.send(robotsTxt);

  } catch (error) {
    console.error('❌ Robots.txt generation error:', error);
    res.status(500).send('User-agent: *\nDisallow: /');
  }
}

module.exports = {
  handleRobots,
  generateRobots
};
