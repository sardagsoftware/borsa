#!/usr/bin/env node
/**
 * 🚀 RUN SEO OPTIMIZATION
 * =======================
 *
 * Tam otomatik SEO optimizasyonu ve monitoring
 * - Duplicate detection & auto-fix
 * - Multi-language SEO
 * - IndexNow submission
 * - Sitemap generation
 * - Search engine notification
 *
 * BEYAZ ŞAPKA GÜVENLİK KURALLARI
 */

const path = require('path');
const fs = require('fs');
const seoEngine = require('../seo/ai-seo-engine');
const seoMonitor = require('../seo/auto-seo-monitor');

const PUBLIC_DIR = path.join(__dirname, '../public');

async function main() {
  console.log('🤖 LyDian AI SEO Optimization');
  console.log('==============================\n');

  const startTime = Date.now();

  try {
    // Run full SEO audit
    const report = await seoMonitor.runFullSEOAudit(PUBLIC_DIR, seoEngine);

    // Save IndexNow key
    const keyPath = path.join(PUBLIC_DIR, 'indexnow-key.txt');
    fs.writeFileSync(keyPath, seoMonitor.INDEXNOW_CONFIG.key, 'utf8');
    console.log(`✅ IndexNow key saved: ${keyPath}\n`);

    // Generate report
    const reportPath = path.join(__dirname, '../SEO-OPTIMIZATION-REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✅ SEO report saved: ${reportPath}\n`);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('='.repeat(50));
    console.log('📊 SEO OPTIMIZATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Duplicate descriptions: ${report.duplicates.descriptions.length}`);
    console.log(`✅ Duplicate titles: ${report.duplicates.titles.length}`);
    console.log(`✅ Fixed issues: ${report.fixes.length}`);
    console.log(`✅ Search engines notified: ${report.indexnow.filter(r => r.success).length}`);
    console.log(`✅ Duration: ${duration}s`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ SEO Optimization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = main;
