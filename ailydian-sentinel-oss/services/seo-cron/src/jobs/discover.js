// 🔍 URL Discovery & IndexNow Automation
import fetch from 'node-fetch'
import { parseString as parseXML } from 'xml2js'
import { promisify } from 'util'
import pino from 'pino'
import { diffLines } from 'diff'

const logger = pino({ name: 'discover' })
const parseXMLAsync = promisify(parseXML)

const DOMAINS = [
  process.env.SITE_URL || 'https://www.ailydian.com',
  ...(process.env.SUBDOMAINS?.split(',') || []).map(sub => `https://${sub}`)
]

const SEO_CORE_URL = process.env.SEO_CORE_URL || 'http://localhost:3001'

/**
 * Discover new URLs across all domains and submit to IndexNow
 */
export async function runDiscovery() {
  logger.info({ domains: DOMAINS.length }, 'Starting URL discovery across all domains')

  const results = {
    domains: DOMAINS.length,
    discovered_urls: 0,
    new_urls: 0,
    submitted_to_indexnow: 0,
    errors: [],
    timestamp: new Date().toISOString()
  }

  for (const domain of DOMAINS) {
    try {
      const domainResult = await discoverDomainUrls(domain)

      results.discovered_urls += domainResult.total_urls
      results.new_urls += domainResult.new_urls.length

      // Submit new URLs to IndexNow if any found
      if (domainResult.new_urls.length > 0) {
        const indexNowResult = await submitToIndexNow(domain, domainResult.new_urls)
        if (indexNowResult.success) {
          results.submitted_to_indexnow += domainResult.new_urls.length
        }
      }

      logger.info({
        domain,
        totalUrls: domainResult.total_urls,
        newUrls: domainResult.new_urls.length,
        submitted: domainResult.new_urls.length
      }, 'Domain discovery completed')

    } catch (error) {
      logger.error({ domain, error: error.message }, 'Domain discovery failed')
      results.errors.push({
        domain,
        error: error.message
      })
    }
  }

  logger.info({
    domains: results.domains,
    discoveredUrls: results.discovered_urls,
    newUrls: results.new_urls,
    submitted: results.submitted_to_indexnow
  }, 'URL discovery completed')

  return results
}

/**
 * Discover URLs for a specific domain
 */
async function discoverDomainUrls(domain) {
  const urls = new Set()

  // 1. Parse sitemap(s)
  const sitemapUrls = await parseSitemap(`${domain}/sitemap.xml`)
  sitemapUrls.forEach(url => urls.add(url))

  // 2. Check RSS/Atom feeds
  const feedUrls = await parseFeed(`${domain}/feed.xml`)
  feedUrls.forEach(url => urls.add(url))

  // 3. Discover from robots.txt sitemap references
  const robotsSitemaps = await parseRobotsSitemaps(`${domain}/robots.txt`)
  for (const sitemapUrl of robotsSitemaps) {
    const additionalUrls = await parseSitemap(sitemapUrl)
    additionalUrls.forEach(url => urls.add(url))
  }

  const allUrls = Array.from(urls)

  // Compare with previous discovery to find new URLs
  const previousUrls = await getPreviousUrls(domain)
  const newUrls = allUrls.filter(url => !previousUrls.includes(url))

  // Store current URLs for next comparison
  await storePreviousUrls(domain, allUrls)

  return {
    total_urls: allUrls.length,
    new_urls: newUrls,
    domain
  }
}

/**
 * Parse sitemap XML and extract URLs
 */
async function parseSitemap(sitemapUrl) {
  try {
    const response = await fetch(sitemapUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Ailydian-SEO-Bot/1.0' }
    })

    if (!response.ok) {
      logger.warn({ sitemapUrl, status: response.status }, 'Sitemap not accessible')
      return []
    }

    const xml = await response.text()
    const parsed = await parseXMLAsync(xml)

    const urls = []

    // Handle regular sitemap
    if (parsed.urlset?.url) {
      parsed.urlset.url.forEach(entry => {
        if (entry.loc?.[0]) {
          urls.push(entry.loc[0])
        }
      })
    }

    // Handle sitemap index
    if (parsed.sitemapindex?.sitemap) {
      for (const sitemap of parsed.sitemapindex.sitemap) {
        if (sitemap.loc?.[0]) {
          const childUrls = await parseSitemap(sitemap.loc[0])
          urls.push(...childUrls)
        }
      }
    }

    logger.debug({ sitemapUrl, urls: urls.length }, 'Parsed sitemap')
    return urls

  } catch (error) {
    logger.warn({ sitemapUrl, error: error.message }, 'Failed to parse sitemap')
    return []
  }
}

/**
 * Parse RSS/Atom feed
 */
async function parseFeed(feedUrl) {
  try {
    const response = await fetch(feedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Ailydian-SEO-Bot/1.0' }
    })

    if (!response.ok) {
      return []
    }

    const xml = await response.text()
    const parsed = await parseXMLAsync(xml)

    const urls = []

    // RSS 2.0
    if (parsed.rss?.channel?.[0]?.item) {
      parsed.rss.channel[0].item.forEach(item => {
        if (item.link?.[0]) {
          urls.push(item.link[0])
        }
      })
    }

    // Atom
    if (parsed.feed?.entry) {
      parsed.feed.entry.forEach(entry => {
        if (entry.link?.[0]?.$.href) {
          urls.push(entry.link[0].$.href)
        }
      })
    }

    logger.debug({ feedUrl, urls: urls.length }, 'Parsed feed')
    return urls

  } catch (error) {
    logger.debug({ feedUrl, error: error.message }, 'Feed not found or invalid')
    return []
  }
}

/**
 * Parse robots.txt for additional sitemaps
 */
async function parseRobotsSitemaps(robotsUrl) {
  try {
    const response = await fetch(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'Ailydian-SEO-Bot/1.0' }
    })

    if (!response.ok) {
      return []
    }

    const text = await response.text()
    const sitemapLines = text
      .split('\n')
      .filter(line => line.toLowerCase().startsWith('sitemap:'))
      .map(line => line.substring(8).trim())

    logger.debug({ robotsUrl, sitemaps: sitemapLines.length }, 'Found sitemaps in robots.txt')
    return sitemapLines

  } catch (error) {
    logger.debug({ robotsUrl, error: error.message }, 'Could not parse robots.txt')
    return []
  }
}

/**
 * Get previously discovered URLs (simple file-based storage)
 */
async function getPreviousUrls(domain) {
  try {
    const hostname = new URL(domain).hostname
    const filename = `/tmp/seo-discovery-${hostname}.json`

    const fs = await import('fs/promises')
    const data = await fs.readFile(filename, 'utf8')
    const parsed = JSON.parse(data)

    return parsed.urls || []
  } catch {
    return []
  }
}

/**
 * Store current URLs for next comparison
 */
async function storePreviousUrls(domain, urls) {
  try {
    const hostname = new URL(domain).hostname
    const filename = `/tmp/seo-discovery-${hostname}.json`

    const data = {
      domain,
      urls,
      last_updated: new Date().toISOString(),
      total_urls: urls.length
    }

    const fs = await import('fs/promises')
    await fs.writeFile(filename, JSON.stringify(data, null, 2))

    logger.debug({ domain, urls: urls.length }, 'Stored URLs for next comparison')
  } catch (error) {
    logger.warn({ domain, error: error.message }, 'Failed to store URLs')
  }
}

/**
 * Submit new URLs to IndexNow via SEO-CORE service
 */
async function submitToIndexNow(domain, urls) {
  if (urls.length === 0) {
    return { success: true, submitted: 0 }
  }

  try {
    const hostname = new URL(domain).hostname

    const response = await fetch(`${SEO_CORE_URL}/api/indexnow/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ailydian-SEO-Cron/1.0'
      },
      body: JSON.stringify({
        host: hostname,
        urls: urls.slice(0, 1000), // IndexNow limit
        key: process.env.INDEXNOW_KEY
      }),
      timeout: 30000
    })

    const result = await response.json()

    if (result.success) {
      logger.info({
        domain: hostname,
        urls: urls.length,
        engines: result.summary?.engines?.successful || 0
      }, 'IndexNow submission successful')
    } else {
      logger.warn({
        domain: hostname,
        urls: urls.length,
        error: result.error
      }, 'IndexNow submission failed')
    }

    return result

  } catch (error) {
    logger.error({
      domain,
      urls: urls.length,
      error: error.message
    }, 'Failed to submit to IndexNow')

    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate discovery report
 */
export function generateDiscoveryReport(results) {
  const successRate = results.domains > 0
    ? Math.round(((results.domains - results.errors.length) / results.domains) * 100)
    : 0

  return {
    title: '🔍 URL Discovery Report',
    summary: {
      domains_checked: results.domains,
      total_discovered_urls: results.discovered_urls,
      new_urls_found: results.new_urls,
      submitted_to_indexnow: results.submitted_to_indexnow,
      success_rate: `${successRate}%`
    },
    errors: results.errors,
    recommendations: generateRecommendations(results),
    generated_at: results.timestamp
  }
}

/**
 * Generate recommendations based on discovery results
 */
function generateRecommendations(results) {
  const recommendations = []

  if (results.errors.length > 0) {
    recommendations.push({
      type: 'error',
      message: `${results.errors.length} domain(s) had discovery errors. Check logs for details.`
    })
  }

  if (results.new_urls === 0) {
    recommendations.push({
      type: 'info',
      message: 'No new URLs discovered. Consider publishing new content or checking sitemap generation.'
    })
  }

  if (results.submitted_to_indexnow < results.new_urls) {
    recommendations.push({
      type: 'warning',
      message: 'Some new URLs were not submitted to IndexNow. Check SEO-CORE service health.'
    })
  }

  if (results.new_urls > 100) {
    recommendations.push({
      type: 'success',
      message: `High content activity detected (${results.new_urls} new URLs). Excellent for SEO growth!`
    })
  }

  return recommendations
}