// 🕐 SEO-CRON Automation Server - 24/7 SEO Jobs
import express from 'express'
import cron from 'node-cron'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino'
import dotenv from 'dotenv'
import { runDiscovery, generateDiscoveryReport } from './jobs/discover.js'
import { runLighthouseAudits, generateLighthouseReport } from './jobs/lighthouse.js'

// Load environment variables
dotenv.config({ path: '../../../.env.shared' })

const app = express()
const port = process.env.PORT || 3003
const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
})

// Job status tracking
const jobStatus = {
  discover: { lastRun: null, running: false, lastResult: null },
  freshness: { lastRun: null, running: false, lastResult: null },
  i18nCheck: { lastRun: null, running: false, lastResult: null },
  cwvLighthouse: { lastRun: null, running: false, lastResult: null },
  backlinks: { lastRun: null, running: false, lastResult: null },
  security: { lastRun: null, running: false, lastResult: null }
}

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    'https://www.ailydian.com',
    /\.ailydian\.com$/,
    /\.vercel\.app$/
  ]
}))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip
  }, 'Incoming request')
  next()
})

// Health check
app.get('/health', (req, res) => {
  const runningJobs = Object.entries(jobStatus)
    .filter(([, status]) => status.running)
    .map(([job]) => job)

  res.json({
    service: 'seo-cron',
    status: 'operational',
    version: '1.0.0',
    features: [
      'URL Discovery & IndexNow',
      'Content Freshness Monitoring',
      'I18n Hreflang Validation',
      'Core Web Vitals (Lighthouse)',
      'Backlink Monitoring',
      'Security SEO Checks'
    ],
    jobs: {
      running: runningJobs,
      last_runs: Object.fromEntries(
        Object.entries(jobStatus).map(([job, status]) => [job, status.lastRun])
      )
    },
    timestamp: new Date().toISOString()
  })
})

// ============================================================================
// MANUAL JOB ENDPOINTS (for testing and manual runs)
// ============================================================================

// Manual URL discovery
app.post('/jobs/discover', async (req, res) => {
  if (jobStatus.discover.running) {
    return res.status(409).json({
      success: false,
      error: 'Job Already Running',
      message: 'URL discovery job is already in progress'
    })
  }

  try {
    jobStatus.discover.running = true
    jobStatus.discover.lastRun = new Date().toISOString()

    logger.info('Starting manual URL discovery job')
    const result = await runDiscovery()
    const report = generateDiscoveryReport(result)

    jobStatus.discover.lastResult = report
    jobStatus.discover.running = false

    logger.info({
      discoveredUrls: result.discovered_urls,
      newUrls: result.new_urls,
      submitted: result.submitted_to_indexnow
    }, 'Manual URL discovery completed')

    res.json({
      success: true,
      job: 'discover',
      result: report
    })

  } catch (error) {
    jobStatus.discover.running = false
    logger.error({ error: error.message }, 'Manual URL discovery failed')

    res.status(500).json({
      success: false,
      error: 'Discovery Failed',
      message: error.message
    })
  }
})

// Manual Lighthouse audit
app.post('/jobs/lighthouse', async (req, res) => {
  if (jobStatus.cwvLighthouse.running) {
    return res.status(409).json({
      success: false,
      error: 'Job Already Running',
      message: 'Lighthouse audit job is already in progress'
    })
  }

  try {
    jobStatus.cwvLighthouse.running = true
    jobStatus.cwvLighthouse.lastRun = new Date().toISOString()

    logger.info('Starting manual Lighthouse audit job')
    const result = await runLighthouseAudits()
    const report = generateLighthouseReport(result)

    jobStatus.cwvLighthouse.lastResult = report
    jobStatus.cwvLighthouse.running = false

    logger.info({
      audits: result.audits.length,
      passed: result.passed_audits,
      failed: result.failed_audits
    }, 'Manual Lighthouse audit completed')

    res.json({
      success: true,
      job: 'lighthouse',
      result: report
    })

  } catch (error) {
    jobStatus.cwvLighthouse.running = false
    logger.error({ error: error.message }, 'Manual Lighthouse audit failed')

    res.status(500).json({
      success: false,
      error: 'Lighthouse Audit Failed',
      message: error.message
    })
  }
})

// Content freshness check
app.post('/jobs/freshness', async (req, res) => {
  if (jobStatus.freshness.running) {
    return res.status(409).json({
      success: false,
      error: 'Job Already Running',
      message: 'Freshness check job is already in progress'
    })
  }

  try {
    jobStatus.freshness.running = true
    jobStatus.freshness.lastRun = new Date().toISOString()

    logger.info('Starting manual freshness check job')
    const result = await runFreshnessCheck()

    jobStatus.freshness.lastResult = result
    jobStatus.freshness.running = false

    res.json({
      success: true,
      job: 'freshness',
      result
    })

  } catch (error) {
    jobStatus.freshness.running = false
    logger.error({ error: error.message }, 'Manual freshness check failed')

    res.status(500).json({
      success: false,
      error: 'Freshness Check Failed',
      message: error.message
    })
  }
})

// I18n hreflang validation
app.post('/jobs/i18n-check', async (req, res) => {
  if (jobStatus.i18nCheck.running) {
    return res.status(409).json({
      success: false,
      error: 'Job Already Running',
      message: 'I18n check job is already in progress'
    })
  }

  try {
    jobStatus.i18nCheck.running = true
    jobStatus.i18nCheck.lastRun = new Date().toISOString()

    logger.info('Starting manual I18n hreflang validation job')
    const result = await runI18nCheck()

    jobStatus.i18nCheck.lastResult = result
    jobStatus.i18nCheck.running = false

    res.json({
      success: true,
      job: 'i18n-check',
      result
    })

  } catch (error) {
    jobStatus.i18nCheck.running = false
    logger.error({ error: error.message }, 'Manual I18n check failed')

    res.status(500).json({
      success: false,
      error: 'I18n Check Failed',
      message: error.message
    })
  }
})

// Get job status
app.get('/jobs/status', (req, res) => {
  res.json({
    jobs: jobStatus,
    server_uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Get job results
app.get('/jobs/:jobName/result', (req, res) => {
  const { jobName } = req.params

  if (!jobStatus[jobName]) {
    return res.status(404).json({
      success: false,
      error: 'Job Not Found',
      message: `Unknown job: ${jobName}`
    })
  }

  const job = jobStatus[jobName]

  res.json({
    job: jobName,
    last_run: job.lastRun,
    running: job.running,
    result: job.lastResult
  })
})

// ============================================================================
// CRON JOBS SETUP
// ============================================================================

// URL Discovery & IndexNow - Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  if (jobStatus.discover.running) {
    logger.warn('Skipping URL discovery - job already running')
    return
  }

  try {
    jobStatus.discover.running = true
    jobStatus.discover.lastRun = new Date().toISOString()

    logger.info('Starting scheduled URL discovery')
    const result = await runDiscovery()
    const report = generateDiscoveryReport(result)

    jobStatus.discover.lastResult = report

    logger.info({
      discoveredUrls: result.discovered_urls,
      newUrls: result.new_urls,
      submitted: result.submitted_to_indexnow
    }, 'Scheduled URL discovery completed')

  } catch (error) {
    logger.error({ error: error.message }, 'Scheduled URL discovery failed')
  } finally {
    jobStatus.discover.running = false
  }
}, {
  timezone: 'UTC'
})

// Content Freshness Check - Every hour
cron.schedule('0 * * * *', async () => {
  if (jobStatus.freshness.running) return

  try {
    jobStatus.freshness.running = true
    jobStatus.freshness.lastRun = new Date().toISOString()

    logger.info('Starting scheduled freshness check')
    const result = await runFreshnessCheck()
    jobStatus.freshness.lastResult = result

    logger.info({ changedPages: result.changed_pages }, 'Scheduled freshness check completed')

  } catch (error) {
    logger.error({ error: error.message }, 'Scheduled freshness check failed')
  } finally {
    jobStatus.freshness.running = false
  }
})

// I18n Hreflang Check - Daily at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  if (jobStatus.i18nCheck.running) return

  try {
    jobStatus.i18nCheck.running = true
    jobStatus.i18nCheck.lastRun = new Date().toISOString()

    logger.info('Starting scheduled I18n hreflang validation')
    const result = await runI18nCheck()
    jobStatus.i18nCheck.lastResult = result

    logger.info({ issues: result.total_issues }, 'Scheduled I18n check completed')

  } catch (error) {
    logger.error({ error: error.message }, 'Scheduled I18n check failed')
  } finally {
    jobStatus.i18nCheck.running = false
  }
})

// Core Web Vitals Lighthouse - Daily at 4 AM UTC
cron.schedule('0 4 * * *', async () => {
  if (jobStatus.cwvLighthouse.running) return

  try {
    jobStatus.cwvLighthouse.running = true
    jobStatus.cwvLighthouse.lastRun = new Date().toISOString()

    logger.info('Starting scheduled Lighthouse audit')
    const result = await runLighthouseAudits()
    const report = generateLighthouseReport(result)

    jobStatus.cwvLighthouse.lastResult = report

    logger.info({
      audits: result.audits.length,
      passed: result.passed_audits,
      failed: result.failed_audits,
      avgPerformance: result.average_scores.performance
    }, 'Scheduled Lighthouse audit completed')

  } catch (error) {
    logger.error({ error: error.message }, 'Scheduled Lighthouse audit failed')
  } finally {
    jobStatus.cwvLighthouse.running = false
  }
})

// ============================================================================
// JOB IMPLEMENTATIONS (placeholders for missing functions)
// ============================================================================

async function runFreshnessCheck() {
  logger.info('Running content freshness check')

  // Simple implementation - check last modified headers
  const domains = [
    process.env.SITE_URL || 'https://www.ailydian.com',
    ...(process.env.SUBDOMAINS?.split(',') || []).map(sub => `https://${sub}`)
  ]

  const changedPages = []

  for (const domain of domains) {
    try {
      const response = await fetch(`${domain}/sitemap.xml`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Ailydian-SEO-Bot/1.0' }
      })

      if (response.ok) {
        const lastModified = response.headers.get('last-modified')
        if (lastModified) {
          const modifiedDate = new Date(lastModified)
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000)

          if (modifiedDate > hourAgo) {
            changedPages.push({
              domain,
              type: 'sitemap',
              last_modified: lastModified
            })
          }
        }
      }
    } catch (error) {
      logger.warn({ domain, error: error.message }, 'Freshness check failed for domain')
    }
  }

  return {
    checked_domains: domains.length,
    changed_pages: changedPages.length,
    changes: changedPages,
    timestamp: new Date().toISOString()
  }
}

async function runI18nCheck() {
  logger.info('Running I18n hreflang validation')

  const locales = process.env.I18N_LOCALES?.split(',') || ['tr', 'en']
  const baseUrl = process.env.SITE_URL || 'https://www.ailydian.com'
  const issues = []

  // Check main pages for hreflang presence
  const testPages = ['/', '/ai-search', '/models', '/docs']

  for (const page of testPages) {
    for (const locale of locales) {
      const url = locale === 'tr' ? `${baseUrl}${page}` : `${baseUrl}/${locale}${page}`

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Ailydian-SEO-Bot/1.0' }
        })

        if (response.ok) {
          const html = await response.text()

          // Check for hreflang links
          const hreflangCount = (html.match(/rel=["']alternate["'][^>]*hreflang/g) || []).length

          if (hreflangCount < locales.length) {
            issues.push({
              url,
              type: 'missing_hreflang',
              expected: locales.length,
              found: hreflangCount
            })
          }
        } else {
          issues.push({
            url,
            type: 'page_not_found',
            status: response.status
          })
        }
      } catch (error) {
        issues.push({
          url,
          type: 'fetch_error',
          error: error.message
        })
      }
    }
  }

  return {
    checked_locales: locales.length,
    checked_pages: testPages.length,
    total_issues: issues.length,
    issues,
    timestamp: new Date().toISOString()
  }
}

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url
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
    message: 'Endpoint not found'
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

// Start server
app.listen(port, () => {
  logger.info({
    port,
    environment: process.env.NODE_ENV || 'development',
    cron_jobs: [
      'URL Discovery (every 15 min)',
      'Freshness Check (hourly)',
      'I18n Validation (daily 2am)',
      'Lighthouse CWV (daily 4am)'
    ]
  }, 'SEO-CRON service started with scheduled jobs')
})