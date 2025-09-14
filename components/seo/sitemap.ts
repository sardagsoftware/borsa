/**
 * 🗺️ AILYDIAN Sitemap Generator - Dynamic XML Sitemap Creation
 * Auto-generates sitemap.xml for better search engine discovery
 * © Emrah Şardağ. All rights reserved.
 */

import { baseSEOConfig } from './index'

export interface SitemapEntry {
  url: string
  lastModified?: Date | string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: { [locale: string]: string }
}

// Static pages configuration
const staticPages: SitemapEntry[] = [
  {
    url: '',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: '/dashboard',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: '/trading',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: '/portfolio',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: '/analytics',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: '/settings',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    url: '/help',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: '/privacy',
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: '/terms',
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
]

// Generate sitemap entries with localization
export function generateSitemapEntries(
  additionalPages: SitemapEntry[] = [],
  supportedLocales: string[] = ['en', 'tr', 'es', 'zh']
): SitemapEntry[] {
  const allPages = [...staticPages, ...additionalPages]
  
  return allPages.flatMap(page => {
    // Main entry (default locale)
    const mainEntry: SitemapEntry = {
      ...page,
      url: `${baseSEOConfig.siteUrl}${page.url}`,
      alternates: Object.fromEntries(
        supportedLocales.map(locale => [
          locale,
          `${baseSEOConfig.siteUrl}${locale === 'en' ? '' : `/${locale}`}${page.url}`
        ])
      ),
    }

    // Localized entries
    const localizedEntries: SitemapEntry[] = supportedLocales
      .filter(locale => locale !== 'en')
      .map(locale => ({
        ...page,
        url: `${baseSEOConfig.siteUrl}/${locale}${page.url}`,
        priority: (page.priority || 0.5) * 0.9, // Slightly lower priority for non-default locales
        alternates: Object.fromEntries(
          supportedLocales.map(loc => [
            loc,
            `${baseSEOConfig.siteUrl}${loc === 'en' ? '' : `/${loc}`}${page.url}`
          ])
        ),
      }))

    return [mainEntry, ...localizedEntries]
  })
}

// Generate XML sitemap
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const sitemapHeader = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  const sitemapFooter = '</urlset>'

  const urlEntries = entries.map(entry => {
    const lastMod = entry.lastModified 
      ? new Date(entry.lastModified).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    const alternateLinks = entry.alternates 
      ? Object.entries(entry.alternates)
          .map(([locale, url]) => 
            `<xhtml:link rel="alternate" hreflang="${locale}" href="${url}" />`
          )
          .join('\n      ')
      : ''

    return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${entry.changeFrequency || 'weekly'}</changefreq>
    <priority>${entry.priority || 0.5}</priority>${alternateLinks ? '\n      ' + alternateLinks : ''}
  </url>`
  }).join('\n')

  return `${xmlHeader}
${sitemapHeader}
${urlEntries}
${sitemapFooter}`
}

// Generate robots.txt content
export function generateRobotsTXT(
  sitemapUrl: string = `${baseSEOConfig.siteUrl}/sitemap.xml`,
  additionalRules: string[] = []
): string {
  const baseRules = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /_next/',
    'Disallow: /private/',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
    '# Crawl-delay for specific bots',
    'User-agent: Bingbot',
    'Crawl-delay: 1',
    '',
    'User-agent: Slurp',
    'Crawl-delay: 1',
  ]

  return [...baseRules, ...additionalRules].join('\n')
}

// Generate RSS feed
export function generateRSSFeed(
  items: Array<{
    title: string
    description: string
    url: string
    pubDate: Date
    author?: string
  }>
): string {
  const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${baseSEOConfig.siteName}</title>
    <description>${baseSEOConfig.siteDescription}</description>
    <link>${baseSEOConfig.siteUrl}</link>
    <atom:link href="${baseSEOConfig.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`

  const rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      ${item.author ? `<author>${item.author}</author>` : ''}
    </item>`).join('')

  const rssFooter = `
  </channel>
</rss>`

  return rssHeader + rssItems + rssFooter
}

// Helper function to validate URLs
export function validateSitemapURLs(entries: SitemapEntry[]): {
  valid: SitemapEntry[]
  invalid: Array<{ entry: SitemapEntry; errors: string[] }>
} {
  const valid: SitemapEntry[] = []
  const invalid: Array<{ entry: SitemapEntry; errors: string[] }> = []

  entries.forEach(entry => {
    const errors: string[] = []

    // URL validation
    try {
      new URL(entry.url)
    } catch {
      errors.push('Invalid URL format')
    }

    // Priority validation
    if (entry.priority !== undefined && (entry.priority < 0 || entry.priority > 1)) {
      errors.push('Priority must be between 0.0 and 1.0')
    }

    // Date validation
    if (entry.lastModified && isNaN(Date.parse(entry.lastModified.toString()))) {
      errors.push('Invalid lastModified date')
    }

    if (errors.length > 0) {
      invalid.push({ entry, errors })
    } else {
      valid.push(entry)
    }
  })

  return { valid, invalid }
}

// Export utilities
const sitemapUtils = {
  generateSitemapEntries,
  generateSitemapXML,
  generateRobotsTXT,
  generateRSSFeed,
  validateSitemapURLs,
}

export default sitemapUtils
