// 📊 Core Web Vitals & Lighthouse Automation
import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'
import pino from 'pino'
import fetch from 'node-fetch'

const logger = pino({ name: 'lighthouse' })

const DOMAINS = [
  process.env.SITE_URL || 'https://www.ailydian.com',
  ...(process.env.SUBDOMAINS?.split(',') || []).map(sub => `https://${sub}`)
]

const TARGET_SCORES = {
  performance: parseInt(process.env.LIGHTHOUSE_MIN_SCORE) || 90,
  accessibility: 90,
  'best-practices': 85,
  seo: 95,
  pwa: 80
}

/**
 * Run Lighthouse audits across all domains
 */
export async function runLighthouseAudits() {
  logger.info({ domains: DOMAINS.length, targets: TARGET_SCORES }, 'Starting Lighthouse audits')

  const results = {
    domains: DOMAINS.length,
    audits: [],
    failed_audits: 0,
    passed_audits: 0,
    average_scores: {},
    timestamp: new Date().toISOString()
  }

  for (const domain of DOMAINS) {
    try {
      // Test both mobile and desktop for each domain
      const mobileResult = await runLighthouseAudit(domain, 'mobile')
      const desktopResult = await runLighthouseAudit(domain, 'desktop')

      results.audits.push(mobileResult, desktopResult)

      // Check if scores meet targets
      const mobilePass = meetsTargets(mobileResult.scores)
      const desktopPass = meetsTargets(desktopResult.scores)

      if (mobilePass && desktopPass) {
        results.passed_audits++
      } else {
        results.failed_audits++
      }

      logger.info({
        domain,
        mobile: { pass: mobilePass, performance: mobileResult.scores.performance },
        desktop: { pass: desktopPass, performance: desktopResult.scores.performance }
      }, 'Domain audit completed')

      // Small delay between audits to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 5000))

    } catch (error) {
      logger.error({ domain, error: error.message }, 'Lighthouse audit failed')
      results.audits.push({
        url: domain,
        device: 'unknown',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      results.failed_audits++
    }
  }

  // Calculate average scores
  results.average_scores = calculateAverageScores(results.audits)

  logger.info({
    totalAudits: results.audits.length,
    passed: results.passed_audits,
    failed: results.failed_audits,
    averages: results.average_scores
  }, 'Lighthouse audits completed')

  return results
}

/**
 * Run single Lighthouse audit
 */
async function runLighthouseAudit(url, device = 'mobile') {
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  })

  try {
    const config = {
      logLevel: 'error',
      output: 'json',
      port: chrome.port,
      emulatedFormFactor: device,
      throttling: {
        rttMs: device === 'mobile' ? 150 : 40,
        throughputKbps: device === 'mobile' ? 1600 : 10240,
        cpuSlowdownMultiplier: device === 'mobile' ? 4 : 1
      }
    }

    const result = await lighthouse(url, config)

    if (!result || !result.lhr) {
      throw new Error('Invalid Lighthouse result')
    }

    const lhr = result.lhr

    // Extract key metrics
    const scores = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      'best-practices': Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      pwa: lhr.categories.pwa ? Math.round(lhr.categories.pwa.score * 100) : null
    }

    // Core Web Vitals
    const cwv = {
      lcp: lhr.audits['largest-contentful-paint']?.numericValue || null,
      fid: lhr.audits['max-potential-fid']?.numericValue || null,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue || null,
      inp: lhr.audits['experimental-interaction-to-next-paint']?.numericValue || null,
      ttfb: lhr.audits['server-response-time']?.numericValue || null,
      fcp: lhr.audits['first-contentful-paint']?.numericValue || null
    }

    // Performance opportunities
    const opportunities = lhr.audits
      ? Object.values(lhr.audits)
          .filter(audit => audit.details?.type === 'opportunity' && audit.numericValue > 100)
          .map(audit => ({
            id: audit.id,
            title: audit.title,
            description: audit.description,
            savings: Math.round(audit.numericValue),
            score: audit.score
          }))
          .sort((a, b) => b.savings - a.savings)
          .slice(0, 5)
      : []

    return {
      url,
      device,
      success: true,
      scores,
      core_web_vitals: cwv,
      opportunities,
      passes_targets: meetsTargets(scores),
      audit_time: lhr.fetchTime,
      timestamp: new Date().toISOString()
    }

  } finally {
    await chrome.kill()
  }
}

/**
 * Check if scores meet targets
 */
function meetsTargets(scores) {
  for (const [category, targetScore] of Object.entries(TARGET_SCORES)) {
    if (scores[category] !== null && scores[category] < targetScore) {
      return false
    }
  }
  return true
}

/**
 * Calculate average scores across all audits
 */
function calculateAverageScores(audits) {
  const successful = audits.filter(audit => audit.success && audit.scores)

  if (successful.length === 0) {
    return {}
  }

  const averages = {}
  const categories = ['performance', 'accessibility', 'best-practices', 'seo']

  categories.forEach(category => {
    const scores = successful
      .map(audit => audit.scores[category])
      .filter(score => score !== null && score !== undefined)

    if (scores.length > 0) {
      averages[category] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    }
  })

  return averages
}

/**
 * Analyze Core Web Vitals trends
 */
export function analyzeCWVTrends(results) {
  const cwvData = results.audits
    .filter(audit => audit.success && audit.core_web_vitals)
    .map(audit => audit.core_web_vitals)

  if (cwvData.length === 0) {
    return null
  }

  // Calculate averages and check against targets
  const averages = {
    lcp: calculateAverage(cwvData, 'lcp'),
    fid: calculateAverage(cwvData, 'fid'),
    cls: calculateAverage(cwvData, 'cls'),
    inp: calculateAverage(cwvData, 'inp'),
    ttfb: calculateAverage(cwvData, 'ttfb'),
    fcp: calculateAverage(cwvData, 'fcp')
  }

  // CWV targets (in milliseconds except CLS)
  const cwvTargets = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    inp: 200,
    ttfb: 600,
    fcp: 1800
  }

  const assessment = {}
  Object.entries(averages).forEach(([metric, value]) => {
    if (value !== null) {
      const target = cwvTargets[metric]
      assessment[metric] = {
        value: Math.round(value),
        target,
        status: value <= target ? 'good' : value <= target * 1.5 ? 'needs-improvement' : 'poor'
      }
    }
  })

  return {
    averages: assessment,
    total_audits: cwvData.length,
    good_cwv_count: Object.values(assessment).filter(a => a.status === 'good').length
  }
}

/**
 * Generate Lighthouse report
 */
export function generateLighthouseReport(results) {
  const cwvTrends = analyzeCWVTrends(results)
  const failedDomains = results.audits
    .filter(audit => audit.success && !audit.passes_targets)
    .map(audit => ({ url: audit.url, device: audit.device, scores: audit.scores }))

  return {
    title: '📊 Lighthouse Performance Report',
    summary: {
      total_audits: results.audits.length,
      passed_domains: results.passed_audits,
      failed_domains: results.failed_audits,
      average_scores: results.average_scores,
      targets: TARGET_SCORES
    },
    core_web_vitals: cwvTrends,
    failed_audits: failedDomains,
    top_opportunities: extractTopOpportunities(results.audits),
    recommendations: generatePerformanceRecommendations(results, cwvTrends),
    generated_at: results.timestamp
  }
}

/**
 * Extract top performance opportunities
 */
function extractTopOpportunities(audits) {
  const allOpportunities = []

  audits
    .filter(audit => audit.success && audit.opportunities)
    .forEach(audit => {
      audit.opportunities.forEach(opp => {
        allOpportunities.push({
          ...opp,
          url: audit.url,
          device: audit.device
        })
      })
    })

  // Group by opportunity ID and calculate total savings
  const grouped = {}
  allOpportunities.forEach(opp => {
    if (!grouped[opp.id]) {
      grouped[opp.id] = {
        id: opp.id,
        title: opp.title,
        description: opp.description,
        total_savings: 0,
        occurrences: 0,
        affected_urls: []
      }
    }
    grouped[opp.id].total_savings += opp.savings
    grouped[opp.id].occurrences++
    grouped[opp.id].affected_urls.push(`${opp.url} (${opp.device})`)
  })

  return Object.values(grouped)
    .sort((a, b) => b.total_savings - a.total_savings)
    .slice(0, 10)
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(results, cwvTrends) {
  const recommendations = []

  // Check overall performance
  if (results.average_scores.performance < TARGET_SCORES.performance) {
    recommendations.push({
      type: 'error',
      category: 'performance',
      message: `Average performance score (${results.average_scores.performance}) is below target (${TARGET_SCORES.performance}). Focus on Core Web Vitals optimization.`
    })
  }

  // CWV-specific recommendations
  if (cwvTrends) {
    Object.entries(cwvTrends.averages).forEach(([metric, data]) => {
      if (data.status === 'poor') {
        recommendations.push({
          type: 'warning',
          category: 'cwv',
          message: `${metric.toUpperCase()} is in poor range (${data.value}ms vs target ${data.target}ms). This affects user experience significantly.`
        })
      }
    })
  }

  // SEO recommendations
  if (results.average_scores.seo < TARGET_SCORES.seo) {
    recommendations.push({
      type: 'warning',
      category: 'seo',
      message: `SEO score (${results.average_scores.seo}) is below target. Check meta tags, structured data, and crawlability.`
    })
  }

  // Success messages
  if (results.passed_audits > results.failed_audits) {
    recommendations.push({
      type: 'success',
      category: 'overall',
      message: `Good performance! ${results.passed_audits} domains are meeting targets.`
    })
  }

  return recommendations
}

/**
 * Utility function to calculate average
 */
function calculateAverage(data, property) {
  const values = data
    .map(item => item[property])
    .filter(val => val !== null && val !== undefined && !isNaN(val))

  if (values.length === 0) return null
  return values.reduce((sum, val) => sum + val, 0) / values.length
}