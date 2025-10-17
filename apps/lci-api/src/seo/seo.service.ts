// LCI API - SEO Service
// White-hat: Dynamic sitemap generation + meta data

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);
  private readonly baseUrl = process.env.BASE_URL || 'https://lci.lydian.ai';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates XML sitemap for search engines
   * White-hat: Only includes public, OPEN complaints (KVKK compliant)
   */
  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // 1. Static pages
    urls.push(
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/brands', changefreq: 'daily', priority: 0.9 },
      { loc: '/auth/login', changefreq: 'monthly', priority: 0.5 },
      { loc: '/auth/register', changefreq: 'monthly', priority: 0.5 },
    );

    // 2. Brand pages
    const brands = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        updatedAt: true,
        _count: {
          select: {
            complaints: {
              where: { state: 'OPEN' },
            },
          },
        },
      },
    });

    brands.forEach((brand) => {
      urls.push({
        loc: `/brands/${brand.slug}`,
        lastmod: brand.updatedAt.toISOString(),
        changefreq: 'daily',
        priority: 0.8,
      });
    });

    // 3. Public complaints (only OPEN state, for SEO)
    // White-hat: DRAFT complaints are private, not indexed
    const complaints = await this.prisma.complaint.findMany({
      where: {
        state: 'OPEN', // Only public complaints
        publishedAt: { not: null },
      },
      select: {
        id: true,
        updatedAt: true,
        publishedAt: true,
        brand: {
          select: { slug: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5000, // Limit for performance
    });

    complaints.forEach((complaint) => {
      urls.push({
        loc: `/brands/${complaint.brand.slug}/complaints/${complaint.id}`,
        lastmod: complaint.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Generate XML
    const xml = this.buildSitemapXml(urls);

    this.logger.log(
      `Sitemap generated: ${urls.length} URLs (${brands.length} brands, ${complaints.length} complaints)`,
    );

    return xml;
  }

  /**
   * Builds sitemap XML from URL list
   */
  private buildSitemapXml(urls: SitemapUrl[]): string {
    const urlElements = urls
      .map((url) => {
        const { loc, lastmod, changefreq, priority } = url;
        return `  <url>
    <loc>${this.baseUrl}${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority !== undefined ? `\n    <priority>${priority.toFixed(1)}</priority>` : ''}
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
  }

  /**
   * Gets meta tags for a complaint page
   * White-hat: PII-safe, KVKK compliant
   */
  async getComplaintMeta(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        brand: {
          select: { name: true, slug: true },
        },
        product: {
          select: { name: true },
        },
      },
    });

    if (!complaint || complaint.state !== 'OPEN') {
      return null; // Private or non-existent complaint
    }

    // Truncate for meta description (155 chars recommended)
    const description =
      complaint.body.length > 155
        ? `${complaint.body.substring(0, 152)}...`
        : complaint.body;

    const meta = {
      title: `${complaint.title} - ${complaint.brand.name} Şikayeti | LCI`,
      description: description,
      canonical: `${this.baseUrl}/brands/${complaint.brand.slug}/complaints/${complaint.id}`,
      keywords: [
        complaint.brand.name,
        complaint.product?.name,
        'şikayet',
        'müşteri deneyimi',
        'sorun',
      ]
        .filter(Boolean)
        .join(', '),
      robots: complaint.state === 'OPEN' ? 'index, follow' : 'noindex, nofollow',

      // Open Graph (social media)
      og: {
        type: 'article',
        title: complaint.title,
        description: description,
        url: `${this.baseUrl}/brands/${complaint.brand.slug}/complaints/${complaint.id}`,
        site_name: 'Lydian Complaint Intelligence',
        locale: 'tr_TR',
        article: {
          published_time: complaint.publishedAt?.toISOString(),
          modified_time: complaint.updatedAt.toISOString(),
          author: 'LCI User', // Anonymous for KVKK
          section: complaint.brand.name,
          tag: [complaint.brand.name, complaint.product?.name].filter(Boolean),
        },
      },

      // Twitter Card
      twitter: {
        card: 'summary',
        title: complaint.title,
        description: description,
        site: '@LydianAI',
      },
    };

    return meta;
  }

  /**
   * Gets meta tags for a brand page
   */
  async getBrandMeta(brandSlug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug: brandSlug },
      include: {
        _count: {
          select: {
            complaints: {
              where: { state: 'OPEN' },
            },
          },
        },
      },
    });

    if (!brand) {
      return null;
    }

    const complaintCount = brand._count.complaints;
    const description = `${brand.name} hakkında ${complaintCount} şikayet ve müşteri yorumu. ${brand.name} şikayetlerini inceleyin ve çözüm süreçlerini takip edin.`;

    const meta = {
      title: `${brand.name} Şikayetleri (${complaintCount}) | LCI`,
      description: description,
      canonical: `${this.baseUrl}/brands/${brandSlug}`,
      keywords: `${brand.name}, ${brand.name} şikayet, müşteri yorumları, memnuniyet`,
      robots: 'index, follow',

      og: {
        type: 'website',
        title: `${brand.name} Şikayetleri`,
        description: description,
        url: `${this.baseUrl}/brands/${brandSlug}`,
        site_name: 'Lydian Complaint Intelligence',
        locale: 'tr_TR',
      },

      twitter: {
        card: 'summary',
        title: `${brand.name} Şikayetleri`,
        description: description,
        site: '@LydianAI',
      },
    };

    return meta;
  }

  /**
   * Generates robots.txt content
   */
  generateRobotsTxt(): string {
    const env = process.env.NODE_ENV || 'development';

    if (env === 'production') {
      // Production: Allow all bots
      return `# LCI Robots.txt - Production
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /auth/
Disallow: /complaints/new

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay for specific bots
User-agent: Googlebot
Crawl-delay: 1

User-agent: Bingbot
Crawl-delay: 2
`;
    } else {
      // Development: Block all bots
      return `# LCI Robots.txt - Development
User-agent: *
Disallow: /
`;
    }
  }
}
