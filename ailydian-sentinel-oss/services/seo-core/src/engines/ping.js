// 🌍 Sitemap Ping Service - Google, Bing, Baidu, Yandex
import pino from 'pino'
import pRetry from 'p-retry'

const logger = pino({ name: 'ping' })

// Search engine ping endpoints
export const PING_ENDPOINTS = {
  google: 'https://www.google.com/ping',
  bing: 'https://www.bing.com/ping',
  baidu: 'https://ping.baidu.com/ping/RPC2',
  yandex: 'https://webmaster.yandex.com/ping'
}

/**
 * Ping search engines with sitemap updates
 * @param {Object} params - Ping parameters
 * @param {string} params.siteUrl - Site URL (https://www.ailydian.com)
 * @param {string} params.sitemapUrl - Optional sitemap URL (defaults to /sitemap.xml)
 * @param {string[]} params.engines - Engines to ping (default: all)
 * @returns {Promise<Object>} Ping results from all engines
 */
export async function pingSitemaps({ siteUrl, sitemapUrl, engines = ['google', 'bing', 'baidu', 'yandex'] }) {
  if (!siteUrl) {
    throw new Error('siteUrl is required')
  }

  // Build sitemap URL
  const sitemap = sitemapUrl || `${siteUrl}/sitemap.xml`

  // Validate sitemap URL
  try {
    new URL(sitemap)
  } catch {
    throw new Error(`Invalid sitemap URL: ${sitemap}`)
  }

  logger.info({
    siteUrl,
    sitemap,
    engines
  }, 'Starting sitemap ping to search engines')

  const results = {}

  // Ping all engines in parallel
  const promises = engines.map(async (engine) => {
    if (!PING_ENDPOINTS[engine]) {
      logger.warn({ engine }, 'Unknown search engine, skipping')
      results[engine] = {
        success: false,
        error: 'Unknown search engine',
        timestamp: new Date().toISOString()
      }
      return
    }

    try {
      const result = await pingSearchEngine(engine, sitemap)
      results[engine] = result
    } catch (error) {
      logger.error({
        engine,
        sitemap,
        error: error.message
      }, 'Sitemap ping failed')

      results[engine] = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  })

  await Promise.all(promises)

  // Calculate summary
  const successful = Object.values(results).filter(r => r.success).length
  const total = engines.length

  logger.info({
    siteUrl,
    sitemap,
    engines: total,
    successful,
    failed: total - successful,
    successRate: `${Math.round((successful / total) * 100)}%`
  }, 'Sitemap ping completed')

  return {
    success: successful > 0,
    sitemap,
    results,
    summary: {
      engines: {
        total,
        successful,
        failed: total - successful
      },
      success_rate: Math.round((successful / total) * 100)
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * Ping individual search engine with retry logic
 */
async function pingSearchEngine(engine, sitemapUrl) {
  const retryOptions = {
    retries: 3,
    factor: 1.5,
    minTimeout: 2000,
    maxTimeout: 10000,
    onFailedAttempt: (error) => {
      logger.warn({
        engine,
        attempt: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        error: error.message
      }, `Sitemap ping to ${engine} attempt failed`)
    }
  }

  return pRetry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      let pingUrl
      let method = 'GET'
      let headers = {
        'User-Agent': 'Ailydian-SEO-Bot/1.0 (+https://www.ailydian.com/bot)'
      }

      // Build engine-specific ping URL
      switch (engine) {
        case 'google':
        case 'bing':
          pingUrl = `${PING_ENDPOINTS[engine]}?sitemap=${encodeURIComponent(sitemapUrl)}`
          break

        case 'baidu':
          // Baidu uses POST with XML-RPC format
          pingUrl = PING_ENDPOINTS[engine]
          method = 'POST'
          headers['Content-Type'] = 'text/xml'
          break

        case 'yandex':
          pingUrl = `${PING_ENDPOINTS[engine]}?url=${encodeURIComponent(sitemapUrl)}`
          break

        default:
          throw new Error(`Unknown engine: ${engine}`)
      }

      let body = null
      if (engine === 'baidu') {
        // Baidu XML-RPC format
        body = `<?xml version="1.0"?>
<methodCall>
  <methodName>weblogUpdates.extendedPing</methodName>
  <params>
    <param><value><string>Ailydian</string></value></param>
    <param><value><string>${sitemapUrl}</string></value></param>
  </params>
</methodCall>`
      }

      const response = await fetch(pingUrl, {
        method,
        headers,
        body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Most ping endpoints return 200 for success
      if (response.ok) {
        logger.info({
          engine,
          status: response.status,
          sitemap: sitemapUrl
        }, `Sitemap ping to ${engine} successful`)

        return {
          success: true,
          status: response.status,
          engine,
          timestamp: new Date().toISOString()
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '300'
        const error = new Error(`${engine} rate limit exceeded. Retry after ${retryAfter} seconds`)
        error.code = 'RATE_LIMITED'
        throw error
      }

      const responseText = await response.text().catch(() => 'Unknown error')
      throw new Error(`${engine} returned ${response.status}: ${responseText}`)

    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`${engine} ping timeout`)
      }

      throw error
    }
  }, retryOptions)
}

/**
 * Ping multiple sitemaps
 */
export async function pingMultipleSitemaps({ sitemaps, engines }) {
  if (!Array.isArray(sitemaps) || sitemaps.length === 0) {
    throw new Error('sitemaps must be a non-empty array')
  }

  logger.info({
    sitemapCount: sitemaps.length,
    engines
  }, 'Starting multiple sitemap ping')

  const results = []

  for (const sitemapData of sitemaps) {
    try {
      const result = await pingSitemaps({
        siteUrl: sitemapData.siteUrl,
        sitemapUrl: sitemapData.sitemapUrl,
        engines
      })

      results.push({
        ...sitemapData,
        ...result
      })

      // Small delay between sitemap pings
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      results.push({
        ...sitemapData,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Calculate overall statistics
  const successful = results.filter(r => r.success).length
  const total = sitemaps.length

  return {
    success: successful > 0,
    summary: {
      sitemaps: {
        total,
        successful,
        failed: total - successful
      },
      success_rate: Math.round((successful / total) * 100)
    },
    results,
    timestamp: new Date().toISOString()
  }
}

/**
 * Ping subdomain sitemaps
 */
export async function pingSubdomainSitemaps(subdomains, engines) {
  const sitemaps = subdomains.map(subdomain => ({
    siteUrl: `https://${subdomain}`,
    sitemapUrl: `https://${subdomain}/sitemap.xml`,
    subdomain
  }))

  return pingMultipleSitemaps({ sitemaps, engines })
}

/**
 * Validate sitemap URL accessibility
 */
export async function validateSitemapUrl(sitemapUrl) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(sitemapUrl, {
      method: 'HEAD',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    return {
      valid: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified')
    }

  } catch (error) {
    return {
      valid: false,
      error: error.message
    }
  }
}