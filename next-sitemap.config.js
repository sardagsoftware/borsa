/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://borsa.vercel.app',
  generateRobotstxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  generateIndexSitemap: true,
  exclude: [
    '/admin/*',
    '/api/*',
    '/dashboard/*',
    '/auth/*',
    '/server-sitemap.xml',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://borsa.vercel.app/server-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',
          '/api/*',
          '/dashboard/*',
          '/auth/*',
          '/tmp/',
          '/*.json$',
        ],
      },
    ],
  },
  transform: async (config, path) => {
    // Multi-language support
    const locales = ['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'];
    const defaultLocale = 'tr';
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === `/${defaultLocale}` || path === '/' ? 1.0 : config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: locales.map(locale => ({
        href: `${config.siteUrl}/${locale}${path === '/' ? '' : path}`,
        hreflang: locale,
      })),
    };
  },
  additionalPaths: async (config) => {
    const locales = ['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'];
    const staticPages = [
      '/trading',
      '/portfolio',
      '/analysis',
      '/markets',
      '/education',
      '/news',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];
    
    const paths = [];
    
    // Generate paths for all locales
    locales.forEach(locale => {
      staticPages.forEach(page => {
        paths.push({
          loc: `/${locale}${page}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      });
    });
    
    return paths;
  },
};
