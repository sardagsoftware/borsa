// 🔍 Bing URL Submission API Implementation
import pino from 'pino'
import pRetry from 'p-retry'

const logger = pino({ name: 'bing' })

const BING_URL_SUBMISSION_API = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl'

/**
 * Submit single URL to Bing URL Submission API
 * @param {Object} params - Submission parameters
 * @param {string} params.apiKey - Bing Webmaster Tools API key
 * @param {string} params.siteUrl - Site URL (https://www.ailydian.com)
 * @param {string} params.url - URL to submit
 * @returns {Promise<Object>} Submission result
 */
export async function submitUrlToBing({ apiKey, siteUrl, url }) {
  if (!apiKey || !siteUrl || !url) {
    throw new Error('Missing required parameters: apiKey, siteUrl, or url')
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(`Invalid URL format: ${url}`)
  }

  const retryOptions = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
    onFailedAttempt: (error) => {
      logger.warn({
        url,
        attempt: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        error: error.message
      }, 'Bing URL submission attempt failed')
    }
  }

  return pRetry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(`${BING_URL_SUBMISSION_API}?apikey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ailydian-SEO-Bot/1.0'
        },
        body: JSON.stringify({
          siteUrl,
          url
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { message: responseText }
      }

      if (response.ok) {
        logger.info({
          url,
          siteUrl,
          status: response.status
        }, 'Bing URL submission successful')

        return {
          success: true,
          status: response.status,
          data: responseData,
          timestamp: new Date().toISOString()
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '3600'
        const error = new Error(`Bing rate limit exceeded. Retry after ${retryAfter} seconds`)
        error.code = 'RATE_LIMITED'
        error.retryAfter = parseInt(retryAfter)
        throw error
      }

      // Handle quota exceeded
      if (response.status === 403 && responseText.includes('quota')) {
        throw new Error('Bing URL submission quota exceeded for today')
      }

      throw new Error(`Bing API returned ${response.status}: ${responseText}`)

    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Bing API request timeout')
      }

      throw error
    }
  }, retryOptions)
}

/**
 * Submit multiple URLs to Bing (with queue management)
 * @param {Object} params - Batch submission parameters
 * @param {string} params.apiKey - Bing Webmaster Tools API key
 * @param {string} params.siteUrl - Site URL
 * @param {string[]} params.urls - URLs to submit
 * @param {number} params.delayMs - Delay between submissions (default: 1000ms)
 * @returns {Promise<Object>} Batch submission results
 */
export async function submitUrlsToBing({ apiKey, siteUrl, urls, delayMs = 1000 }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('URLs must be a non-empty array')
  }

  // Bing API has daily quota limits, so be conservative
  const maxUrlsPerBatch = 100
  const urlsToSubmit = urls.slice(0, maxUrlsPerBatch)

  logger.info({
    siteUrl,
    totalUrls: urls.length,
    submittingUrls: urlsToSubmit.length,
    delayMs
  }, 'Starting Bing batch URL submission')

  const results = []
  let successful = 0
  let failed = 0

  for (let i = 0; i < urlsToSubmit.length; i++) {
    const url = urlsToSubmit[i]

    try {
      const result = await submitUrlToBing({ apiKey, siteUrl, url })
      results.push({
        url,
        ...result
      })
      successful++

      logger.debug({
        url,
        progress: `${i + 1}/${urlsToSubmit.length}`
      }, 'Bing URL submitted successfully')

    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      })
      failed++

      logger.warn({
        url,
        error: error.message,
        progress: `${i + 1}/${urlsToSubmit.length}`
      }, 'Bing URL submission failed')

      // Stop if we hit rate limit or quota
      if (error.code === 'RATE_LIMITED' || error.message.includes('quota')) {
        logger.warn({
          error: error.message,
          processed: i + 1,
          remaining: urlsToSubmit.length - (i + 1)
        }, 'Stopping Bing submission due to limits')
        break
      }
    }

    // Delay between requests to avoid rate limiting
    if (i < urlsToSubmit.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  const successRate = Math.round((successful / urlsToSubmit.length) * 100)

  logger.info({
    siteUrl,
    totalUrls: urls.length,
    processed: urlsToSubmit.length,
    successful,
    failed,
    successRate: `${successRate}%`
  }, 'Bing batch URL submission completed')

  return {
    success: successful > 0,
    summary: {
      total_urls: urls.length,
      processed_urls: urlsToSubmit.length,
      successful,
      failed,
      success_rate: successRate
    },
    results,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get Bing quota information (if supported by API)
 */
export async function getBingQuotaInfo(apiKey) {
  logger.info('Bing quota info not available via public API')

  return {
    quota_available: 'unknown',
    daily_limit: 'varies by account',
    note: 'Check Bing Webmaster Tools dashboard for quota information'
  }
}

/**
 * Validate Bing API key format
 */
export function validateBingApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  // Bing API keys are typically 32-character hex strings
  const keyRegex = /^[a-fA-F0-9]{32}$/
  return keyRegex.test(apiKey)
}

/**
 * Check if URL is valid for Bing submission
 */
export function validateUrlForBing(url, siteUrl) {
  try {
    const urlObj = new URL(url)
    const siteUrlObj = new URL(siteUrl)

    // URL must be from the same domain as siteUrl
    if (urlObj.hostname !== siteUrlObj.hostname) {
      return {
        valid: false,
        error: 'URL must be from the same domain as siteUrl'
      }
    }

    // URL must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return {
        valid: false,
        error: 'URL must use HTTPS protocol'
      }
    }

    return { valid: true }

  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}