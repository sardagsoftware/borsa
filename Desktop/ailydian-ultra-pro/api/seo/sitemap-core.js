/**
 * 🗺️ Core Sitemap Generator
 *
 * Features:
 * - Core pages sitemap with hreflang tags
 * - 32-locale support
 * - Multi-subdomain support
 * - Priority & changefreq optimization
 * - Caching (10 minutes)
 */

const SUBDOMAINS = process.env.SEO_SUBDOMAINS?.split(',') || [
  'www', 'borsa', 'travel', 'dev', 'docs', 'news', 'ai', 'hub', 'brain', 'market'
];

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';
const CACHE_SECONDS = parseInt(process.env.SEO_CACHE_SECONDS || '600', 10);
const LOCALES = process.env.SEO_LOCALES?.split(',') || ['tr-TR', 'en-US'];
const FALLBACK_LOCALE = process.env.SEO_FALLBACK_LOCALE || 'tr-TR';

// Cache storage
const sitemapCache = new Map();

/**
 * Get core pages for each subdomain
 */
function getCorePages(subdomain) {
  const basePages = {
    www: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/chat', priority: '0.9', changefreq: 'weekly' },
      { path: '/dashboard', priority: '0.9', changefreq: 'daily' },
      { path: '/models', priority: '0.9', changefreq: 'weekly' },
      { path: '/api-docs', priority: '0.8', changefreq: 'weekly' },
      { path: '/analytics', priority: '0.7', changefreq: 'weekly' },
      { path: '/auth', priority: '0.7', changefreq: 'monthly' },
      { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.6', changefreq: 'monthly' },
      { path: '/blog', priority: '0.7', changefreq: 'daily' },
    ],
    borsa: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/dashboard', priority: '0.9', changefreq: 'hourly' },
      { path: '/market-analysis', priority: '0.9', changefreq: 'hourly' },
      { path: '/signals', priority: '0.9', changefreq: 'hourly' },
      { path: '/portfolio', priority: '0.8', changefreq: 'daily' },
      { path: '/bot-management', priority: '0.8', changefreq: 'daily' },
      { path: '/backtesting', priority: '0.7', changefreq: 'weekly' },
      { path: '/risk-management', priority: '0.7', changefreq: 'weekly' },
    ],
    travel: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/destinations', priority: '0.9', changefreq: 'weekly' },
      { path: '/hotels', priority: '0.9', changefreq: 'daily' },
      { path: '/flights', priority: '0.9', changefreq: 'hourly' },
      { path: '/packages', priority: '0.8', changefreq: 'weekly' },
      { path: '/blog', priority: '0.7', changefreq: 'weekly' },
    ],
    dev: [
      { path: '/', priority: '0.5', changefreq: 'always' },
    ],
    docs: [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/getting-started', priority: '0.9', changefreq: 'weekly' },
      { path: '/api-reference', priority: '0.9', changefreq: 'weekly' },
      { path: '/guides', priority: '0.8', changefreq: 'weekly' },
      { path: '/examples', priority: '0.8', changefreq: 'weekly' },
      { path: '/changelog', priority: '0.7', changefreq: 'daily' },
    ],
    news: [
      { path: '/', priority: '1.0', changefreq: 'hourly' },
      { path: '/latest', priority: '0.9', changefreq: 'hourly' },
      { path: '/technology', priority: '0.8', changefreq: 'hourly' },
      { path: '/business', priority: '0.8', changefreq: 'hourly' },
      { path: '/world', priority: '0.8', changefreq: 'hourly' },
    ],
    ai: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/models', priority: '0.9', changefreq: 'weekly' },
      { path: '/playground', priority: '0.9', changefreq: 'daily' },
      { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
      { path: '/api', priority: '0.8', changefreq: 'weekly' },
    ],
    hub: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/projects', priority: '0.9', changefreq: 'daily' },
      { path: '/developers', priority: '0.8', changefreq: 'weekly' },
      { path: '/resources', priority: '0.8', changefreq: 'weekly' },
    ],
    brain: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/insights', priority: '0.9', changefreq: 'daily' },
      { path: '/metrics', priority: '0.9', changefreq: 'hourly' },
      { path: '/analytics', priority: '0.8', changefreq: 'daily' },
    ],
    market: [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/browse', priority: '0.9', changefreq: 'daily' },
      { path: '/categories', priority: '0.8', changefreq: 'weekly' },
      { path: '/sellers', priority: '0.7', changefreq: 'weekly' },
    ]
  };

  return basePages[subdomain] || basePages.www;
}

/**
 * Generate hreflang links for a URL
 */
function generateHreflangLinks(baseUrl, path) {
  const links = [];

  LOCALES.forEach(locale => {
    const localeCode = locale.toLowerCase().replace('_', '-');
    links.push({
      rel: 'alternate',
      hreflang: localeCode,
      href: `${baseUrl}${path}?lang=${locale}`
    });
  });

  // Add x-default
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${baseUrl}${path}?lang=${FALLBACK_LOCALE}`
  });

  return links;
}

/**
 * Generate core sitemap XML
 */
function generateCoreSitemap(subdomain = 'www') {
  const baseUrl = `${PROTOCOL}://${subdomain === 'www' ? PRIMARY_DOMAIN : `${subdomain}.${PRIMARY_DOMAIN}`}`;
  const now = new Date().toISOString();
  const pages = getCorePages(subdomain);

  const urlEntries = pages.map(page => {
    const fullUrl = `${baseUrl}${page.path}`;
    const hreflangLinks = generateHreflangLinks(baseUrl, page.path);

    const hreflangXml = hreflangLinks.map(link =>
      `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${link.href}"/>`
    ).join('\n');

    return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${hreflangXml}
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`;

  return xml;
}

/**
 * Handle core sitemap request
 */
async function handleCoreSitemap(req, res) {
  try {
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

    // Check cache
    const cacheKey = `core-${subdomain}`;
    const cached = sitemapCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_SECONDS * 1000) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      res.setHeader('X-Robots-Tag', 'noindex');
      return res.send(cached.xml);
    }

    // Generate sitemap
    const sitemapXml = generateCoreSitemap(subdomain);

    // Update cache
    sitemapCache.set(cacheKey, {
      xml: sitemapXml,
      timestamp: now
    });

    // Send response
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
    res.setHeader('X-Robots-Tag', 'noindex');
    res.send(sitemapXml);

  } catch (error) {
    console.error('❌ Core sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
  }
}

module.exports = {
  handleCoreSitemap,
  generateCoreSitemap,
  getCorePages
};
