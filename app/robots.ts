import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailydian.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/_next/',
          '/private/',
          '/tmp/',
          '*.json$',
          '*.log$',
          '/user/',
          '/account/',
        ],
      },
      {
        userAgent: ['Googlebot'],
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: ['Bingbot'],
        allow: '/',
        crawlDelay: 2,
      },
      {
        userAgent: ['YandexBot'],
        allow: '/',
        crawlDelay: 3,
      },
      {
        userAgent: ['SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
