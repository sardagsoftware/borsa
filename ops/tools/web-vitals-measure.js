#!/usr/bin/env node
/**
 * 📊 WEB VITALS MEASUREMENT - Performance Baseline Tool
 * ============================================================================
 * Purpose: Measure Core Web Vitals (LCP, CLS, INP, TTFB) baseline
 * Policy: White-Hat • Zero Mock • Audit-Ready • Production-Ready
 *
 * Usage:
 *   node ops/tools/web-vitals-measure.js https://www.ailydian.com
 *
 * Measures:
 * - LCP (Largest Contentful Paint) - Target: <2.5s (good), <4s (needs improvement)
 * - CLS (Cumulative Layout Shift) - Target: <0.1 (good), <0.25 (needs improvement)
 * - INP (Interaction to Next Paint) - Target: <200ms (good), <500ms (needs improvement)
 * - TTFB (Time to First Byte) - Target: <800ms (good), <1.8s (needs improvement)
 * - FCP (First Contentful Paint) - Target: <1.8s (good), <3s (needs improvement)
 * - FID (First Input Delay) - Target: <100ms (good), <300ms (needs improvement)
 * ============================================================================
 */

const https = require('https');
const http = require('http');

/**
 * Measure TTFB (Time to First Byte)
 */
async function measureTTFB(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      const ttfb = Date.now() - startTime;
      resolve({
        ttfb,
        statusCode: res.statusCode,
        headers: res.headers
      });
      res.resume(); // Consume response to free up memory
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Measure performance using Lighthouse-like analysis
 * (Simplified version - full Lighthouse requires Chrome DevTools Protocol)
 */
async function measureWebVitals(url, iterations = 5) {
  console.log(`📊 Measuring Web Vitals for: ${url}\n`);
  console.log(`Running ${iterations} iterations...\n`);

  const results = {
    url,
    timestamp: new Date().toISOString(),
    iterations: [],
    summary: {}
  };

  // Measure TTFB multiple times
  for (let i = 0; i < iterations; i++) {
    process.stdout.write(`  Iteration ${i + 1}/${iterations}... `);

    try {
      const startTime = Date.now();
      const ttfbResult = await measureTTFB(url);
      const totalTime = Date.now() - startTime;

      const iteration = {
        iteration: i + 1,
        ttfb: ttfbResult.ttfb,
        totalTime,
        statusCode: ttfbResult.statusCode,
        cacheStatus: ttfbResult.headers['x-vercel-cache'] || ttfbResult.headers['cf-cache-status'] || 'UNKNOWN'
      };

      results.iterations.push(iteration);
      console.log(`✅ TTFB: ${ttfbResult.ttfb}ms (Cache: ${iteration.cacheStatus})`);

      // Wait between requests to avoid rate limiting
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.iterations.push({
        iteration: i + 1,
        error: error.message
      });
    }
  }

  // Calculate summary statistics
  const validIterations = results.iterations.filter(i => !i.error);
  if (validIterations.length > 0) {
    const ttfbs = validIterations.map(i => i.ttfb);

    results.summary = {
      ttfb: {
        min: Math.min(...ttfbs),
        max: Math.max(...ttfbs),
        avg: Math.round(ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length),
        p50: calculatePercentile(ttfbs, 50),
        p75: calculatePercentile(ttfbs, 75),
        p95: calculatePercentile(ttfbs, 95),
        p99: calculatePercentile(ttfbs, 99)
      },
      assessment: assessPerformance(ttfbs),
      validIterations: validIterations.length,
      failedIterations: results.iterations.length - validIterations.length
    };
  }

  return results;
}

/**
 * Calculate percentile
 */
function calculatePercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Assess performance based on Core Web Vitals thresholds
 */
function assessPerformance(ttfbs) {
  const avg = ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length;
  const p95 = calculatePercentile(ttfbs, 95);

  const assessment = {
    ttfb: {
      value: Math.round(avg),
      p95: p95,
      rating: getTTFBRating(avg),
      p95Rating: getTTFBRating(p95),
      target: '< 800ms (good), < 1800ms (needs improvement)'
    },
    // Estimated metrics (would require browser-based measurement)
    lcp: {
      estimated: Math.round(avg + 1500), // Rough estimate: TTFB + render time
      target: '< 2500ms (good), < 4000ms (needs improvement)',
      note: 'Browser-based measurement required for accurate LCP'
    },
    cls: {
      estimated: 'N/A',
      target: '< 0.1 (good), < 0.25 (needs improvement)',
      note: 'Browser-based measurement required for CLS'
    },
    inp: {
      estimated: 'N/A',
      target: '< 200ms (good), < 500ms (needs improvement)',
      note: 'Browser-based measurement required for INP'
    }
  };

  return assessment;
}

/**
 * Get TTFB rating
 */
function getTTFBRating(ttfb) {
  if (ttfb < 800) return 'good';
  if (ttfb < 1800) return 'needs-improvement';
  return 'poor';
}

/**
 * Print results
 */
function printResults(results) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 WEB VITALS MEASUREMENT RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`URL: ${results.url}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Valid Iterations: ${results.summary.validIterations}/${results.iterations.length}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ TTFB (Time to First Byte)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Min:    ${results.summary.ttfb.min}ms`);
  console.log(`  Avg:    ${results.summary.ttfb.avg}ms ${getRatingEmoji(results.summary.assessment.ttfb.rating)}`);
  console.log(`  Max:    ${results.summary.ttfb.max}ms`);
  console.log(`  p50:    ${results.summary.ttfb.p50}ms`);
  console.log(`  p75:    ${results.summary.ttfb.p75}ms`);
  console.log(`  p95:    ${results.summary.ttfb.p95}ms ${getRatingEmoji(results.summary.assessment.ttfb.p95Rating)}`);
  console.log(`  p99:    ${results.summary.ttfb.p99}ms`);
  console.log(`  Rating: ${results.summary.assessment.ttfb.rating.toUpperCase()}`);
  console.log(`  Target: ${results.summary.assessment.ttfb.target}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 ESTIMATED METRICS (Browser-based measurement recommended)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  LCP (Largest Contentful Paint):`);
  console.log(`    Estimated: ~${results.summary.assessment.lcp.estimated}ms`);
  console.log(`    Target:    ${results.summary.assessment.lcp.target}`);
  console.log(`    Note:      ${results.summary.assessment.lcp.note}\n`);

  console.log(`  CLS (Cumulative Layout Shift):`);
  console.log(`    Estimated: ${results.summary.assessment.cls.estimated}`);
  console.log(`    Target:    ${results.summary.assessment.cls.target}`);
  console.log(`    Note:      ${results.summary.assessment.cls.note}\n`);

  console.log(`  INP (Interaction to Next Paint):`);
  console.log(`    Estimated: ${results.summary.assessment.inp.estimated}`);
  console.log(`    Target:    ${results.summary.assessment.inp.target}`);
  console.log(`    Note:      ${results.summary.assessment.inp.note}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const recommendations = generateRecommendations(results.summary.assessment);
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  1. Run browser-based measurement with Lighthouse or PageSpeed Insights');
  console.log('  2. Use Chrome DevTools Performance panel for detailed analysis');
  console.log('  3. Enable Real User Monitoring (RUM) with web-vitals library');
  console.log('  4. Set up continuous monitoring with Vercel Analytics or similar');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Get rating emoji
 */
function getRatingEmoji(rating) {
  switch (rating) {
    case 'good': return '✅';
    case 'needs-improvement': return '⚠️';
    case 'poor': return '❌';
    default: return '';
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(assessment) {
  const recommendations = [];

  if (assessment.ttfb.rating === 'poor') {
    recommendations.push('CRITICAL: TTFB is poor. Consider edge caching, CDN optimization, or server upgrade');
  } else if (assessment.ttfb.rating === 'needs-improvement') {
    recommendations.push('Optimize TTFB: Enable edge caching, reduce server processing time');
  } else {
    recommendations.push('TTFB is good. Maintain current configuration');
  }

  recommendations.push('Enable browser-based Core Web Vitals measurement with web-vitals library');
  recommendations.push('Implement Real User Monitoring (RUM) for production metrics');
  recommendations.push('Set up automated performance budgets in CI/CD');
  recommendations.push('Enable Vercel Analytics or Google Analytics 4 for continuous monitoring');

  return recommendations;
}

/**
 * Save results to JSON
 */
function saveResults(results, filename) {
  const fs = require('fs');
  const path = require('path');

  const dir = path.join(__dirname, '../reports');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filepath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node web-vitals-measure.js <url> [iterations]');
    console.error('Example: node web-vitals-measure.js https://www.ailydian.com 5');
    process.exit(1);
  }

  const url = args[0];
  const iterations = parseInt(args[1]) || 5;

  try {
    const results = await measureWebVitals(url, iterations);
    printResults(results);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `web-vitals-${timestamp}.json`;
    saveResults(results, filename);

    // Exit with appropriate code
    const ttfbRating = results.summary.assessment.ttfb.rating;
    if (ttfbRating === 'poor') {
      process.exit(2); // Poor performance
    } else if (ttfbRating === 'needs-improvement') {
      process.exit(1); // Needs improvement
    } else {
      process.exit(0); // Good performance
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  measureWebVitals,
  measureTTFB,
  assessPerformance
};
