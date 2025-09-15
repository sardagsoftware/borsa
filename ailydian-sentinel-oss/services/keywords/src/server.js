// 🌍 Keywords Service - 40+ Language AI Keyword Clustering Server
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import NodeCache from 'node-cache'
import pino from 'pino'
import { generateKeywordCluster, generateContentBrief, AI_KEYWORDS } from './keywords.js'

const app = express()
const port = process.env.PORT || 3002
const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty' }
})

// Cache for 24 hours
const cache = new NodeCache({ stdTTL: 86400 })

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // requests
  duration: 60, // per 60 seconds
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: ['https://www.ailydian.com', /\.ailydian\.com$/],
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'keywords-service',
    status: 'operational',
    supported_languages: Object.keys(AI_KEYWORDS).length,
    cache_stats: cache.getStats(),
    timestamp: new Date().toISOString()
  })
})

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: Object.keys(AI_KEYWORDS),
      total: Object.keys(AI_KEYWORDS).length,
      default_locale: 'tr'
    }
  })
})

// Generate keyword clusters
app.post('/api/cluster', async (req, res) => {
  try {
    const { locale = 'tr', seed_keywords = [], competitors = [] } = req.body

    if (!AI_KEYWORDS[locale]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported Language',
        message: `Locale '${locale}' is not supported`
      })
    }

    // Check cache first
    const cacheKey = `cluster_${locale}_${JSON.stringify(seed_keywords)}_${JSON.stringify(competitors)}`
    const cached = cache.get(cacheKey)

    if (cached) {
      logger.info({ locale, cache_hit: true }, 'Returning cached keyword cluster')
      return res.json({
        success: true,
        data: cached,
        from_cache: true
      })
    }

    const cluster = generateKeywordCluster(locale, seed_keywords, competitors)
    cache.set(cacheKey, cluster)

    logger.info({
      locale,
      total_keywords: cluster.total_keywords,
      cache_hit: false
    }, 'Generated new keyword cluster')

    res.json({
      success: true,
      data: cluster,
      from_cache: false
    })

  } catch (error) {
    logger.error({ error: error.message }, 'Keyword clustering failed')
    res.status(500).json({
      success: false,
      error: 'Clustering Failed',
      message: 'Failed to generate keyword cluster'
    })
  }
})

// Generate content brief
app.post('/api/brief', async (req, res) => {
  try {
    const { locale = 'tr', seed_keywords = [], competitors = [] } = req.body

    if (!AI_KEYWORDS[locale]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported Language',
        message: `Locale '${locale}' is not supported`
      })
    }

    // Check cache first
    const cacheKey = `brief_${locale}_${JSON.stringify(seed_keywords)}_${JSON.stringify(competitors)}`
    const cached = cache.get(cacheKey)

    if (cached) {
      logger.info({ locale, cache_hit: true }, 'Returning cached content brief')
      return res.json({
        success: true,
        data: cached,
        from_cache: true
      })
    }

    // Generate keyword cluster first
    const cluster = generateKeywordCluster(locale, seed_keywords, competitors)
    const brief = generateContentBrief(cluster, locale)

    cache.set(cacheKey, brief)

    logger.info({
      locale,
      title_variations: brief.titles.length,
      faq_count: brief.faqs.length,
      cache_hit: false
    }, 'Generated new content brief')

    res.json({
      success: true,
      data: brief,
      from_cache: false
    })

  } catch (error) {
    logger.error({ error: error.message }, 'Content brief generation failed')
    res.status(500).json({
      success: false,
      error: 'Brief Generation Failed',
      message: 'Failed to generate content brief'
    })
  }
})

// Batch generate for multiple locales
app.post('/api/batch', async (req, res) => {
  try {
    const { locales = ['tr', 'en'], seed_keywords = [], competitors = [] } = req.body

    const results = {}
    const unsupported = []

    for (const locale of locales) {
      if (!AI_KEYWORDS[locale]) {
        unsupported.push(locale)
        continue
      }

      try {
        const cluster = generateKeywordCluster(locale, seed_keywords, competitors)
        const brief = generateContentBrief(cluster, locale)

        results[locale] = {
          cluster,
          brief
        }
      } catch (error) {
        logger.error({ locale, error: error.message }, 'Failed to process locale')
        results[locale] = { error: error.message }
      }
    }

    logger.info({
      processed_locales: Object.keys(results).length,
      unsupported_locales: unsupported.length
    }, 'Batch processing completed')

    res.json({
      success: true,
      data: results,
      unsupported_locales: unsupported,
      processed_at: new Date().toISOString()
    })

  } catch (error) {
    logger.error({ error: error.message }, 'Batch processing failed')
    res.status(500).json({
      success: false,
      error: 'Batch Processing Failed',
      message: 'Failed to process batch request'
    })
  }
})

// Clear cache (admin endpoint)
app.post('/api/admin/cache/clear', (req, res) => {
  const keys = cache.keys()
  cache.flushAll()

  logger.info({ cleared_keys: keys.length }, 'Cache cleared')

  res.json({
    success: true,
    message: 'Cache cleared',
    cleared_entries: keys.length
  })
})

// Error handler
app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error')
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  })
})

// Start server
app.listen(port, () => {
  logger.info({
    port,
    supported_languages: Object.keys(AI_KEYWORDS).length,
    cache_ttl: '24h'
  }, 'Keywords Service started')
})