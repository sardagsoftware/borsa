/**
 * SHARD_11.1 - Sitemap Generator
 * Generate XML sitemap for search engines
 *
 * Security: Only public pages included
 * White Hat: Privacy-first, no user data
 */

export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Public pages to include in sitemap
 */
const PUBLIC_PAGES: SitemapURL[] = [
  {
    loc: '/',
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    loc: '/privacy',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: '/terms',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: '/security',
    changefreq: 'monthly',
    priority: 0.9
  }
];

/**
 * Generate sitemap XML
 */
export function generateSitemap(baseUrl: string = 'https://messaging.ailydian.com'): string {
  const now = new Date().toISOString();

  const urls = PUBLIC_PAGES.map((page) => {
    const lastmod = page.lastmod || now;
    const changefreq = page.changefreq || 'weekly';
    const priority = page.priority || 0.5;

    return `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Get robots.txt content
 */
export function generateRobotsTxt(baseUrl: string = 'https://messaging.ailydian.com'): string {
  return `# Ailydian Messaging - Robots.txt
# E2EE Secure Messaging Platform

User-agent: *
Allow: /
Disallow: /chat-test
Disallow: /crypto-test
Disallow: /delivery-test
Disallow: /files-test
Disallow: /video-test
Disallow: /location-test
Disallow: /billing-test
Disallow: /dashboard-test
Disallow: /api/
Disallow: /auth/

Sitemap: ${baseUrl}/sitemap.xml

Crawl-delay: 10
`;
}
