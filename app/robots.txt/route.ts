import { COPYRIGHT_NOTICE } from '@/lib/copyright';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailydian.com';
  
  const robotsTxt = `# Robots.txt for ${COPYRIGHT_NOTICE.project}
# © ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} - ${COPYRIGHT_NOTICE.rights}
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Ana sayfalar ve önemli içerik
Allow: /tr/
Allow: /en/
Allow: /ar/
Allow: /fa/
Allow: /fr/
Allow: /de/
Allow: /nl/

# Trading ve dashboard sayfaları
Allow: /dashboard
Allow: /trading
Allow: /portfolio
Allow: /security
Allow: /wallet

# API documentation
Allow: /api-docs

# Blog ve içerik
Allow: /blog
Allow: /about
Allow: /contact
Allow: /help

# Kripto coin sayfaları
Allow: /crypto/

# Engellenen alanlar
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/
Disallow: /tmp/
Disallow: *.json$
Disallow: *.log$
Disallow: /user/
Disallow: /account/

# Özel bot kuralları
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot  
Allow: /
Crawl-delay: 2

User-agent: YandexBot
Allow: /
Crawl-delay: 3

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

# Zararlı botları engelle
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

# Sitemap referansları
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-images.xml
Sitemap: ${baseUrl}/sitemap-news.xml

# Telif hakkı ve güvenlik
# Bu robots.txt dosyası ${COPYRIGHT_NOTICE.project} için
# ${COPYRIGHT_NOTICE.owner} tarafından oluşturulmuştur.
# İzinsiz kopyalama yasaktır.
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
