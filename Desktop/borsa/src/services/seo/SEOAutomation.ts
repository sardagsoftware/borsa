/**
 * SEO Automation System
 * Multi-language sitemap, keyword extraction, auto-indexing
 * Supports: Google, Bing, Yandex, Baidu, DuckDuckGo
 */

interface SEOConfig {
  baseUrl: string;
  languages: string[];
  keywords: string[];
}

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  alternates?: { lang: string; url: string }[];
}

interface IndexingResponse {
  engine: string;
  success: boolean;
  url: string;
  message?: string;
}

export class SEOAutomation {
  private config: SEOConfig;

  constructor(config: SEOConfig) {
    this.config = config;
  }

  /**
   * Generate multi-language sitemap XML
   */
  generateSitemap(pages: string[]): string {
    const entries: SitemapEntry[] = [];

    for (const page of pages) {
      const mainEntry: SitemapEntry = {
        url: `${this.config.baseUrl}${page}`,
        lastmod: new Date().toISOString(),
        changefreq: this.getChangeFreq(page),
        priority: this.getPriority(page),
        alternates: [],
      };

      // Add language alternates
      for (const lang of this.config.languages) {
        mainEntry.alternates!.push({
          lang,
          url: `${this.config.baseUrl}/${lang}${page}`,
        });
      }

      entries.push(mainEntry);
    }

    return this.entriesToXML(entries);
  }

  /**
   * Convert sitemap entries to XML
   */
  private entriesToXML(entries: SitemapEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXML(entry.url)}</loc>\n`;
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;

      // Add language alternates
      if (entry.alternates && entry.alternates.length > 0) {
        for (const alt of entry.alternates) {
          xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${this.escapeXML(alt.url)}" />\n`;
        }
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Get change frequency based on page type
   */
  private getChangeFreq(page: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' {
    if (page === '/' || page.includes('/dashboard')) return 'hourly';
    if (page.includes('/crypto') || page.includes('/stocks')) return 'daily';
    if (page.includes('/news')) return 'daily';
    if (page.includes('/portfolio')) return 'weekly';
    return 'monthly';
  }

  /**
   * Get priority based on page importance
   */
  private getPriority(page: string): number {
    if (page === '/') return 1.0;
    if (page.includes('/dashboard')) return 0.9;
    if (page.includes('/crypto') || page.includes('/stocks')) return 0.8;
    if (page.includes('/news')) return 0.7;
    return 0.5;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Extract keywords from content using AI-like heuristics
   */
  extractKeywords(content: string, topN: number = 20): string[] {
    // Remove HTML tags
    const cleanContent = content.replace(/<[^>]*>/g, ' ');

    // Tokenize
    const words = cleanContent
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // Filter short words

    // Common stop words (Turkish + English)
    const stopWords = new Set([
      've', 'ile', 'için', 'olan', 'bu', 'bir', 'her', 'ya', 'da', 'gibi',
      'the', 'is', 'at', 'which', 'on', 'and', 'or', 'to', 'from', 'with',
      'that', 'this', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
    ]);

    // Count word frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      if (!stopWords.has(word)) {
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }

    // Sort by frequency
    const sorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * Ping search engines for indexing
   */
  async submitToSearchEngines(urls: string[]): Promise<IndexingResponse[]> {
    const results: IndexingResponse[] = [];

    for (const url of urls) {
      // Google IndexNow
      results.push(await this.pingGoogle(url));

      // Bing IndexNow
      results.push(await this.pingBing(url));

      // Yandex
      results.push(await this.pingYandex(url));

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Ping Google Search Console
   */
  private async pingGoogle(url: string): Promise<IndexingResponse> {
    try {
      const sitemapUrl = `${this.config.baseUrl}/sitemap.xml`;
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

      const response = await fetch(pingUrl, { method: 'GET' });

      return {
        engine: 'Google',
        success: response.ok,
        url,
        message: response.ok ? 'Sitemap submitted successfully' : `Error: ${response.status}`,
      };
    } catch (error) {
      return {
        engine: 'Google',
        success: false,
        url,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ping Bing via IndexNow
   */
  private async pingBing(url: string): Promise<IndexingResponse> {
    try {
      const indexNowUrl = 'https://www.bing.com/indexnow';
      const payload = {
        host: new URL(this.config.baseUrl).hostname,
        key: 'lydian-trading-indexnow-key', // Generate real key in production
        keyLocation: `${this.config.baseUrl}/indexnow-key.txt`,
        urlList: [url],
      };

      const response = await fetch(indexNowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return {
        engine: 'Bing',
        success: response.ok,
        url,
        message: response.ok ? 'URL submitted via IndexNow' : `Error: ${response.status}`,
      };
    } catch (error) {
      return {
        engine: 'Bing',
        success: false,
        url,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ping Yandex Webmaster
   */
  private async pingYandex(url: string): Promise<IndexingResponse> {
    try {
      const sitemapUrl = `${this.config.baseUrl}/sitemap.xml`;
      const pingUrl = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

      const response = await fetch(pingUrl, { method: 'GET' });

      return {
        engine: 'Yandex',
        success: response.ok,
        url,
        message: response.ok ? 'Sitemap submitted successfully' : `Error: ${response.status}`,
      };
    } catch (error) {
      return {
        engine: 'Yandex',
        success: false,
        url,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    let robots = '# LyDian Trader - Robots.txt\n\n';
    robots += 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += 'Disallow: /api/\n';
    robots += 'Disallow: /admin/\n';
    robots += 'Disallow: /dashboard/\n\n';
    robots += `Sitemap: ${this.config.baseUrl}/sitemap.xml\n\n`;

    // Search engine specific
    robots += '# Google\n';
    robots += 'User-agent: Googlebot\n';
    robots += 'Allow: /\n\n';

    robots += '# Bing\n';
    robots += 'User-agent: Bingbot\n';
    robots += 'Allow: /\n\n';

    robots += '# Yandex\n';
    robots += 'User-agent: YandexBot\n';
    robots += 'Allow: /\n\n';

    return robots;
  }

  /**
   * Generate structured data (JSON-LD) for rich snippets
   */
  generateStructuredData(type: 'WebSite' | 'WebPage' | 'Article', data: any): string {
    const baseStructure = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    const structuredData = { ...baseStructure, ...data };

    return JSON.stringify(structuredData, null, 2);
  }

  /**
   * Calculate SEO score based on various factors
   */
  calculateSEOScore(page: {
    title: string;
    description: string;
    keywords: string[];
    headings: string[];
    images: { alt: string }[];
    links: { internal: number; external: number };
    wordCount: number;
  }): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Title check
    if (!page.title || page.title.length < 30) {
      score -= 10;
      issues.push('Title too short (< 30 characters)');
      recommendations.push('Add descriptive title (50-60 characters)');
    } else if (page.title.length > 60) {
      score -= 5;
      issues.push('Title too long (> 60 characters)');
    }

    // Description check
    if (!page.description || page.description.length < 120) {
      score -= 10;
      issues.push('Meta description too short');
      recommendations.push('Add detailed description (150-160 characters)');
    } else if (page.description.length > 160) {
      score -= 5;
      issues.push('Meta description too long');
    }

    // Keywords check
    if (page.keywords.length < 5) {
      score -= 10;
      issues.push('Too few keywords');
      recommendations.push('Add more relevant keywords (5-10)');
    }

    // Headings check
    if (page.headings.length === 0) {
      score -= 15;
      issues.push('No headings found');
      recommendations.push('Add H1, H2, H3 headings for structure');
    }

    // Images check
    const imagesWithoutAlt = page.images.filter(img => !img.alt).length;
    if (imagesWithoutAlt > 0) {
      score -= imagesWithoutAlt * 2;
      issues.push(`${imagesWithoutAlt} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }

    // Content length check
    if (page.wordCount < 300) {
      score -= 10;
      issues.push('Content too short (< 300 words)');
      recommendations.push('Add more content (aim for 500+ words)');
    }

    // Links check
    if (page.links.internal < 3) {
      score -= 5;
      issues.push('Too few internal links');
      recommendations.push('Add more internal links');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations,
    };
  }
}

// Singleton instance
let seoInstance: SEOAutomation | null = null;

export function getSEOAutomation(config: SEOConfig): SEOAutomation {
  if (!seoInstance) {
    seoInstance = new SEOAutomation(config);
  }
  return seoInstance;
}