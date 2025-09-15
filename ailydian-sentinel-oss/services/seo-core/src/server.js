// 🌍 SEO-CORE Service - Multi-Engine Search Optimization API
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import NodeCache from 'node-cache'
import pino from 'pino'
import PQueue from 'p-queue'
import Joi from 'joi'
import { submitToIndexNow, submitLargeUrlList } from './engines/indexnow.js'
import { submitUrlToBing, submitUrlsToBing } from './engines/bing.js'
import { pingSitemaps, pingMultipleSitemaps, pingSubdomainSitemaps } from './engines/ping.js'

const app = express()
const port = process.env.PORT || 3001
const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
})

// Global cache for results
const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache

// Rate limiting per IP
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 50, // requests
  duration: 60, // per 60 seconds
})

// Global queue for expensive operations
const seoQueue = new PQueue({ concurrency: 3, interval: 1000, intervalCap: 1 })

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(cors({
  origin: [
    'https://www.ailydian.com',
    'https://borsa.ailydian.com',
    'https://newsai.earth',
    'https://music.ailydian.com',
    'https://travel.ailydian.com',
    'https://video.ailydian.com',
    'https://blockchain.ailydian.com',
    /\.ailydian\.com$/,
    /\.vercel\.app$/
  ],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (rejRes) {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded')
    res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retry_after: rejRes.msBeforeNext
    })
  }
})

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Incoming request')
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'seo-core',
    status: 'operational',
    version: '1.0.0',
    features: [
      'IndexNow (Bing, Yandex, Naver, Seznam)',
      'Bing URL Submission API',
      'Sitemap Ping (Google, Bing, Baidu, Yandex)',
      'Meta Verification',
      'Rate Limiting',
      'Retry Logic'
    ],
    queue: {
      size: seoQueue.size,
      pending: seoQueue.pending
    },
    cache_stats: cache.getStats(),
    timestamp: new Date().toISOString()
  })
})

// Validation schemas
const indexNowSchema = Joi.object({
  host: Joi.string().domain().required(),
  urls: Joi.array().items(Joi.string().uri()).min(1).max(10000).required(),
  key: Joi.string().alphanum().min(8).max(128).required(),
  keyLocation: Joi.string().uri().optional()
})

const bingSubmissionSchema = Joi.object({
  apiKey: Joi.string().hex().length(32).required(),
  siteUrl: Joi.string().uri().required(),
  urls: Joi.array().items(Joi.string().uri()).min(1).max(100).required()
})

const sitemapPingSchema = Joi.object({
  siteUrl: Joi.string().uri().required(),
  sitemapUrl: Joi.string().uri().optional(),
  engines: Joi.array().items(Joi.string().valid('google', 'bing', 'baidu', 'yandex')).optional()
})

// IndexNow submission endpoint
app.post('/api/indexnow/submit', async (req, res) => {
  try {
    // Validate request
    const { error, value } = indexNowSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    // Check cache first
    const cacheKey = `indexnow_${value.host}_${JSON.stringify(value.urls.sort())}`
    const cached = cache.get(cacheKey)
    if (cached) {
      logger.info({ host: value.host, urls: value.urls.length }, 'Returning cached IndexNow result')
      return res.json({ ...cached, from_cache: true })
    }

    // Queue the IndexNow submission
    const result = await seoQueue.add(async () => {
      if (value.urls.length > 1000) {
        return submitLargeUrlList(value)
      } else {
        return submitToIndexNow(value)
      }
    })

    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result, 3600) // Cache for 1 hour
    }

    logger.info({
      host: value.host,
      urls: value.urls.length,
      success: result.success
    }, 'IndexNow submission completed')

    res.json({
      success: result.success,
      ...result
    })

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'IndexNow submission failed')
    res.status(500).json({
      success: false,
      error: 'IndexNow Submission Failed',
      message: error.message
    })
  }
})

// Bing URL submission endpoint
app.post('/api/bing/submit', async (req, res) => {
  try {
    // Validate request
    const { error, value } = bingSubmissionSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    // Check cache first
    const cacheKey = `bing_${value.siteUrl}_${JSON.stringify(value.urls.sort())}`
    const cached = cache.get(cacheKey)
    if (cached) {
      logger.info({ siteUrl: value.siteUrl, urls: value.urls.length }, 'Returning cached Bing result')
      return res.json({ ...cached, from_cache: true })
    }

    // Queue the Bing submission
    const result = await seoQueue.add(() => submitUrlsToBing(value))

    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result, 7200) // Cache for 2 hours (Bing has daily limits)
    }

    logger.info({
      siteUrl: value.siteUrl,
      urls: value.urls.length,
      success: result.success
    }, 'Bing URL submission completed')

    res.json({
      success: result.success,
      ...result
    })

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Bing URL submission failed')
    res.status(500).json({
      success: false,
      error: 'Bing URL Submission Failed',
      message: error.message
    })
  }
})

// Sitemap ping endpoint
app.post('/api/ping/sitemaps', async (req, res) => {
  try {
    // Validate request
    const { error, value } = sitemapPingSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    // Check cache first
    const cacheKey = `ping_${value.siteUrl}_${value.sitemapUrl || 'default'}`
    const cached = cache.get(cacheKey)
    if (cached) {
      logger.info({ siteUrl: value.siteUrl }, 'Returning cached sitemap ping result')
      return res.json({ ...cached, from_cache: true })
    }

    // Queue the sitemap ping
    const result = await seoQueue.add(() => pingSitemaps(value))

    // Cache successful results for 30 minutes
    if (result.success) {
      cache.set(cacheKey, result, 1800)
    }

    logger.info({
      siteUrl: value.siteUrl,
      engines: result.summary?.engines?.total,
      success: result.success
    }, 'Sitemap ping completed')

    res.json({
      success: result.success,
      ...result
    })

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Sitemap ping failed')
    res.status(500).json({
      success: false,
      error: 'Sitemap Ping Failed',
      message: error.message
    })
  }
})

// Ping all subdomains endpoint
app.post('/api/ping/subdomains', async (req, res) => {
  try {
    const { subdomains = [], engines } = req.body

    if (!Array.isArray(subdomains) || subdomains.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'subdomains must be a non-empty array'
      })
    }

    // Queue the subdomain ping
    const result = await seoQueue.add(() => pingSubdomainSitemaps(subdomains, engines))

    logger.info({
      subdomains: subdomains.length,
      success: result.success
    }, 'Subdomain sitemap ping completed')

    res.json({
      success: result.success,
      ...result
    })

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Subdomain ping failed')
    res.status(500).json({
      success: false,
      error: 'Subdomain Ping Failed',
      message: error.message
    })
  }
})

// Get queue status
app.get('/api/queue/status', (req, res) => {
  res.json({
    queue: {
      size: seoQueue.size,
      pending: seoQueue.pending,
      isPaused: seoQueue.isPaused
    },
    cache: cache.getStats(),
    timestamp: new Date().toISOString()
  })
})

// Clear cache (admin endpoint)
app.post('/api/admin/cache/clear', (req, res) => {
  const keys = cache.keys()
  cache.flushAll()

  logger.info({ clearedKeys: keys.length }, 'Cache cleared')

  res.json({
    success: true,
    message: 'Cache cleared',
    cleared_entries: keys.length
  })
})

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  }, 'Unhandled error')

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'API endpoint not found'
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
app.listen(port, () => {
  logger.info({
    port,
    environment: process.env.NODE_ENV || 'development',
    features: ['IndexNow', 'Bing API', 'Sitemap Ping', 'Rate Limiting']
  }, 'SEO-CORE service started')
})