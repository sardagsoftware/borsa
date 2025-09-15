// 🌍 IndexNow API Implementation - Bing, Yandex, Naver, Seznam
import pino from 'pino'
import pRetry from 'p-retry'

const logger = pino({ name: 'indexnow' })

// IndexNow search engine endpoints
export const INDEXNOW_ENDPOINTS = {
  bing: 'https://api.indexnow.org/indexnow',
  yandex: 'https://yandex.com/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
  seznam: 'https://search.seznam.cz/indexnow'
}

/**
 * Submit URLs to IndexNow compatible search engines
 * @param {Object} params - IndexNow parameters
 * @param {string} params.host - Host domain (e.g., 'www.ailydian.com')
 * @param {string[]} params.urls - Array of URLs to submit
 * @param {string} params.key - IndexNow key
 * @param {string} params.keyLocation - Optional key file location
 * @returns {Promise<Object>} Results from all search engines
 */
export async function submitToIndexNow({ host, urls, key, keyLocation }) {
  const results = {}

  // Validate inputs
  if (!host || !urls?.length || !key) {
    throw new Error('Missing required parameters: host, urls, or key')
  }

  if (urls.length > 10000) {
    throw new Error('Too many URLs. Maximum 10,000 URLs per request.')
  }

  const payload = {
    host,
    key,
    urls: urls.slice(0, 10000), // Ensure we don't exceed limit
    ...(keyLocation && { keyLocation })
  }

  logger.info({
    host,
    urlCount: urls.length,
    engines: Object.keys(INDEXNOW_ENDPOINTS).length
  }, 'Starting IndexNow submission')

  // Submit to all search engines in parallel
  const promises = Object.entries(INDEXNOW_ENDPOINTS).map(async ([engine, endpoint]) => {
    try {
      const result = await submitToEngine(engine, endpoint, payload)
      results[engine] = result
    } catch (error) {
      logger.error({ engine, error: error.message }, 'IndexNow submission failed')
      results[engine] = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  })

  await Promise.all(promises)

  // Calculate overall success rate
  const successful = Object.values(results).filter(r => r.success).length
  const total = Object.keys(results).length

  logger.info({
    host,
    urlCount: urls.length,
    successful,
    total,
    successRate: `${Math.round((successful / total) * 100)}%`
  }, 'IndexNow submission completed')

  return {
    success: successful > 0,
    results,
    summary: {
      submitted_urls: urls.length,
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
 * Submit to individual search engine with retry logic
 */
async function submitToEngine(engine, endpoint, payload) {
  const retryOptions = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
    onFailedAttempt: (error) => {
      logger.warn({
        engine,
        attempt: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        error: error.message
      }, `IndexNow ${engine} submission attempt failed`)
    }
  }

  return pRetry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ailydian-SEO-Bot/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // IndexNow returns 200/202 for success
      if (response.status === 200 || response.status === 202) {
        logger.info({
          engine,
          status: response.status,
          host: payload.host,
          urlCount: payload.urls.length
        }, `IndexNow ${engine} submission successful`)

        return {
          success: true,
          status: response.status,
          engine,
          timestamp: new Date().toISOString()
        }
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60'
        const error = new Error(`Rate limited by ${engine}. Retry after ${retryAfter} seconds`)
        error.code = 'RATE_LIMITED'
        throw error
      }

      // Handle other errors
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`${engine} returned ${response.status}: ${errorText}`)

    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`${engine} request timeout`)
      }

      throw error
    }
  }, retryOptions)
}

/**
 * Validate IndexNow key format
 */
export function validateIndexNowKey(key) {
  if (!key || typeof key !== 'string') {
    return false
  }

  // IndexNow key should be 8-128 characters, alphanumeric + hyphens
  const keyRegex = /^[a-zA-Z0-9-]{8,128}$/
  return keyRegex.test(key)
}

/**
 * Generate IndexNow key
 */
export function generateIndexNowKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

/**
 * Batch URLs for optimal submission
 */
export function batchUrls(urls, batchSize = 1000) {
  if (!Array.isArray(urls)) {
    throw new Error('URLs must be an array')
  }

  const batches = []
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize))
  }

  return batches
}

/**
 * Submit large URL lists in batches
 */
export async function submitLargeUrlList({ host, urls, key, keyLocation, batchSize = 1000 }) {
  const batches = batchUrls(urls, batchSize)
  const results = []

  logger.info({
    host,
    totalUrls: urls.length,
    batches: batches.length,
    batchSize
  }, 'Starting batch IndexNow submission')

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    try {
      const result = await submitToIndexNow({
        host,
        urls: batch,
        key,
        keyLocation
      })

      results.push({
        batch: i + 1,
        ...result
      })

      // Delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

    } catch (error) {
      logger.error({
        batch: i + 1,
        urlCount: batch.length,
        error: error.message
      }, 'Batch IndexNow submission failed')

      results.push({
        batch: i + 1,
        success: false,
        error: error.message,
        urlCount: batch.length
      })
    }
  }

  // Calculate overall statistics
  const successfulBatches = results.filter(r => r.success).length
  const totalSubmittedUrls = results.reduce((sum, r) => {
    return sum + (r.summary?.submitted_urls || 0)
  }, 0)

  return {
    success: successfulBatches > 0,
    batches: {
      total: batches.length,
      successful: successfulBatches,
      failed: batches.length - successfulBatches
    },
    urls: {
      total: urls.length,
      submitted: totalSubmittedUrls
    },
    results,
    timestamp: new Date().toISOString()
  }
}