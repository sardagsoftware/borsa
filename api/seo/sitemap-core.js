const CACHE_SECONDS = parseInt(process.env.SEO_CACHE_SECONDS || '600', 10);

/**
 * Express.js Handler
 */
async function handleCoreSitemap(req, res) {
  try {
    const now = new Date().toISOString();
    const baseUrl = `https://www.ailydian.com`;

    const pages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/chat', priority: '0.9', changefreq: 'weekly' },
      { path: '/dashboard', priority: '0.9', changefreq: 'daily' },
      { path: '/models', priority: '0.9', changefreq: 'weekly' },
      { path: '/api-docs', priority: '0.8', changefreq: 'weekly' },
    ];

    const urlEntries = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
    res.status(200).send(xml);

  } catch (error) {
    console.error('❌ Sitemap core generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
  }
}

module.exports = { handleCoreSitemap };
