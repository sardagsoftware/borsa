/**
 * 🗺️ Sitemap Index Generator
 *
 * Features:
 * - Master index for all child sitemaps
 * - Multi-subdomain support
 * - Dynamic sitemap references
 * - Caching (10 minutes)
 * - SEO best practices
 */

const SUBDOMAINS = process.env.SEO_SUBDOMAINS?.split(',') || [
  'www', 'borsa', 'travel', 'dev', 'docs', 'news', 'ai', 'hub', 'brain', 'market'
];

const PRIMARY_DOMAIN = process.env.SEO_PRIMARY_DOMAIN || 'ailydian.com';
const PROTOCOL = process.env.SEO_PROTOCOL || 'https';
const CACHE_SECONDS = parseInt(process.env.SEO_CACHE_SECONDS || '600', 10);
const LOCALES = process.env.SEO_LOCALES?.split(',') || ['tr-TR', 'en-US'];

// Cache storage
let cachedSitemap = null;
let cacheTime = 0;

/**
 * Generate sitemap index XML based on subdomain
 */
function generateSitemapIndex(subdomain = 'www') {
  const baseUrl = `${PROTOCOL}://${subdomain === 'www' ? PRIMARY_DOMAIN : `${subdomain}.${PRIMARY_DOMAIN}`}`;
  const now = new Date().toISOString();

  const sitemaps = [];

  // Core sitemap (always present)
  sitemaps.push({
    loc: `${baseUrl}/sitemap-core.xml`,
    lastmod: now
  });

  // Add locale-specific sitemaps
  LOCALES.forEach(locale => {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-${locale}.xml`,
      lastmod: now
    });
  });

  // News sitemap (for news subdomain)
  if (subdomain === 'news') {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-news.xml`,
      lastmod: now
    });
  }

  // Image sitemap (for visual content subdomains)
  if (['www', 'news', 'travel', 'market'].includes(subdomain)) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-images.xml`,
      lastmod: now
    });
  }

  // Video sitemap (for video content subdomains)
  if (['www', 'news', 'travel', 'ai'].includes(subdomain)) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-videos.xml`,
      lastmod: now
    });
  }

  // Build XML
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map(sitemap => `
  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`),
    '</sitemapindex>'
  ].join('\n');

  return xml;
}

/**
 * Handle sitemap index request
 */
async function handleSitemapIndex(req, res) {
  try {
    // Check cache
    const now = Date.now();
    if (cachedSitemap && (now - cacheTime) < CACHE_SECONDS * 1000) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      res.setHeader('X-Robots-Tag', 'noindex');
      return res.send(cachedSitemap);
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

    // Generate sitemap index
    const sitemapXml = generateSitemapIndex(subdomain);

    // Update cache
    cachedSitemap = sitemapXml;
    cacheTime = now;

    // Send response
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
    res.setHeader('X-Robots-Tag', 'noindex');
    res.send(sitemapXml);

  } catch (error) {
    console.error('❌ Sitemap index generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
  }
}

module.exports = {
  handleSitemapIndex,
  generateSitemapIndex
};
