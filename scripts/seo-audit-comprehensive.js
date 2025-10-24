#!/usr/bin/env node

/**
 * AILYDIAN COMPREHENSIVE SEO AUDIT SCRIPT
 * Beyaz şapkalı SEO analizi - Tüm sayfalar
 *
 * Features:
 * - HTML meta tag analysis
 * - i18n coverage check
 * - Content-SEO alignment
 * - Multi-language support (tr, en, de, ar, ru, zh)
 * - GEO targeting analysis
 * - White-hat compliance check
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Supported languages
const LANGUAGES = ['tr', 'en', 'de', 'ar', 'ru', 'zh'];

// GEO targeting map
const GEO_MAP = {
  tr: { country: 'TR', region: 'Turkey', currency: 'TRY' },
  en: { country: 'US', region: 'United States', currency: 'USD' },
  de: { country: 'DE', region: 'Germany', currency: 'EUR' },
  ar: { country: 'SA', region: 'Saudi Arabia', currency: 'SAR' },
  ru: { country: 'RU', region: 'Russia', currency: 'RUB' },
  zh: { country: 'CN', region: 'China', currency: 'CNY' }
};

// SEO best practices thresholds
const SEO_THRESHOLDS = {
  titleMinLength: 30,
  titleMaxLength: 60,
  descriptionMinLength: 120,
  descriptionMaxLength: 160,
  keywordsMin: 3,
  keywordsMax: 10,
  h1Count: 1, // Exactly 1 H1 tag
  imageAltRequired: true
};

/**
 * Get all HTML files from public directory
 */
function getAllHTMLFiles() {
  const publicDir = path.join(__dirname, '../public');
  const files = [];

  function walkDir(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip backup and old directories
        if (!item.includes('backup') && !item.includes('old') && !item.includes('Old')) {
          walkDir(fullPath);
        }
      } else if (item.endsWith('.html')) {
        // Skip backup files
        if (!item.includes('backup') && !item.includes('BACKUP') && !item.includes('old')) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(publicDir);
  return files;
}

/**
 * Analyze single HTML file for SEO
 */
function analyzeSEO(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  const fileName = path.relative(path.join(__dirname, '../public'), filePath);

  const analysis = {
    file: fileName,
    url: '/' + fileName.replace('.html', ''),
    issues: [],
    warnings: [],
    good: [],
    scores: {
      overall: 0,
      title: 0,
      description: 0,
      keywords: 0,
      structure: 0,
      i18n: 0,
      geo: 0
    }
  };

  // 1. Check <title> tag
  const title = $('title').text().trim();
  if (!title) {
    analysis.issues.push('❌ Missing <title> tag');
    analysis.scores.title = 0;
  } else if (title.length < SEO_THRESHOLDS.titleMinLength) {
    analysis.warnings.push(`⚠️  Title too short (${title.length} chars, min: ${SEO_THRESHOLDS.titleMinLength})`);
    analysis.scores.title = 50;
  } else if (title.length > SEO_THRESHOLDS.titleMaxLength) {
    analysis.warnings.push(`⚠️  Title too long (${title.length} chars, max: ${SEO_THRESHOLDS.titleMaxLength})`);
    analysis.scores.title = 70;
  } else {
    analysis.good.push(`✅ Title length optimal (${title.length} chars)`);
    analysis.scores.title = 100;
  }

  // 2. Check meta description
  const description = $('meta[name="description"]').attr('content') || '';
  if (!description) {
    analysis.issues.push('❌ Missing meta description');
    analysis.scores.description = 0;
  } else if (description.length < SEO_THRESHOLDS.descriptionMinLength) {
    analysis.warnings.push(`⚠️  Description too short (${description.length} chars, min: ${SEO_THRESHOLDS.descriptionMinLength})`);
    analysis.scores.description = 50;
  } else if (description.length > SEO_THRESHOLDS.descriptionMaxLength) {
    analysis.warnings.push(`⚠️  Description too long (${description.length} chars, max: ${SEO_THRESHOLDS.descriptionMaxLength})`);
    analysis.scores.description = 70;
  } else {
    analysis.good.push(`✅ Description length optimal (${description.length} chars)`);
    analysis.scores.description = 100;
  }

  // 3. Check keywords
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  if (!keywords) {
    analysis.warnings.push('⚠️  Missing meta keywords (optional but helpful)');
    analysis.scores.keywords = 60;
  } else {
    const keywordCount = keywords.split(',').filter(k => k.trim()).length;
    if (keywordCount < SEO_THRESHOLDS.keywordsMin) {
      analysis.warnings.push(`⚠️  Too few keywords (${keywordCount}, min: ${SEO_THRESHOLDS.keywordsMin})`);
      analysis.scores.keywords = 50;
    } else if (keywordCount > SEO_THRESHOLDS.keywordsMax) {
      analysis.warnings.push(`⚠️  Too many keywords (${keywordCount}, max: ${SEO_THRESHOLDS.keywordsMax}) - keyword stuffing`);
      analysis.scores.keywords = 40;
    } else {
      analysis.good.push(`✅ Keywords count optimal (${keywordCount})`);
      analysis.scores.keywords = 100;
    }
  }

  // 4. Check H1 tag
  const h1Count = $('h1').length;
  if (h1Count === 0) {
    analysis.issues.push('❌ Missing H1 tag');
    analysis.scores.structure = 0;
  } else if (h1Count > 1) {
    analysis.warnings.push(`⚠️  Multiple H1 tags (${h1Count}, should be 1)`);
    analysis.scores.structure = 50;
  } else {
    analysis.good.push('✅ Exactly 1 H1 tag');
    analysis.scores.structure = 100;
  }

  // 5. Check lang attribute
  const langAttr = $('html').attr('lang');
  if (!langAttr) {
    analysis.warnings.push('⚠️  Missing <html lang="..."> attribute');
    analysis.scores.i18n = 0;
  } else if (!LANGUAGES.includes(langAttr)) {
    analysis.warnings.push(`⚠️  Unsupported language code: ${langAttr}`);
    analysis.scores.i18n = 40;
  } else {
    analysis.good.push(`✅ Language attribute set (${langAttr})`);
    analysis.scores.i18n = 100;
  }

  // 6. Check Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');

  let ogScore = 0;
  if (ogTitle) {
    analysis.good.push('✅ og:title present');
    ogScore += 33;
  } else {
    analysis.warnings.push('⚠️  Missing og:title (social sharing)');
  }

  if (ogDescription) {
    analysis.good.push('✅ og:description present');
    ogScore += 33;
  } else {
    analysis.warnings.push('⚠️  Missing og:description (social sharing)');
  }

  if (ogImage) {
    analysis.good.push('✅ og:image present');
    ogScore += 34;
  } else {
    analysis.warnings.push('⚠️  Missing og:image (social sharing)');
  }

  // 7. Check Twitter Card tags
  const twitterCard = $('meta[name="twitter:card"]').attr('content');
  if (twitterCard) {
    analysis.good.push('✅ Twitter Card configured');
  } else {
    analysis.warnings.push('⚠️  Missing Twitter Card meta tags');
  }

  // 8. Check canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    analysis.warnings.push('⚠️  Missing canonical URL');
  } else {
    analysis.good.push('✅ Canonical URL present');
  }

  // 9. Check robots meta
  const robots = $('meta[name="robots"]').attr('content');
  if (robots && (robots.includes('noindex') || robots.includes('nofollow'))) {
    analysis.warnings.push(`⚠️  Robots: ${robots} (may block search engines)`);
  }

  // 10. Check images without alt text
  const imagesWithoutAlt = $('img:not([alt])').length;
  if (imagesWithoutAlt > 0) {
    analysis.warnings.push(`⚠️  ${imagesWithoutAlt} images missing alt text`);
  }

  // 11. Check GEO targeting
  const geoPosition = $('meta[name="geo.position"]').attr('content');
  const geoPlacename = $('meta[name="geo.placename"]').attr('content');
  const geoRegion = $('meta[name="geo.region"]').attr('content');

  if (geoPosition && geoPlacename && geoRegion) {
    analysis.good.push('✅ GEO targeting configured');
    analysis.scores.geo = 100;
  } else {
    analysis.warnings.push('⚠️  Missing GEO targeting meta tags');
    analysis.scores.geo = 0;
  }

  // Calculate overall score
  const scoreValues = Object.values(analysis.scores).filter(s => s > 0);
  analysis.scores.overall = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 0;

  return analysis;
}

/**
 * Check i18n coverage for a page
 */
function checkI18nCoverage(fileName) {
  const pageName = fileName.replace('.html', '');
  const baseName = pageName.split('/').pop();

  const coverage = {
    page: pageName,
    languages: {},
    coverage: 0,
    missing: []
  };

  for (const lang of LANGUAGES) {
    const i18nPath = path.join(__dirname, `../public/locales/${lang}/${baseName}.json`);
    const exists = fs.existsSync(i18nPath);

    coverage.languages[lang] = exists;
    if (!exists) {
      coverage.missing.push(lang);
    }
  }

  coverage.coverage = Math.round(
    (Object.values(coverage.languages).filter(Boolean).length / LANGUAGES.length) * 100
  );

  return coverage;
}

/**
 * Generate comprehensive SEO report
 */
function generateReport() {
  console.log('\n🔍 AILYDIAN COMPREHENSIVE SEO AUDIT');
  console.log('=' .repeat(60));
  console.log('');

  const files = getAllHTMLFiles();
  console.log(`📊 Total pages found: ${files.length}`);
  console.log('');

  const results = [];
  const priorities = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  // Analyze each file
  for (const file of files) {
    const seoAnalysis = analyzeSEO(file);
    const fileName = path.relative(path.join(__dirname, '../public'), file);
    const i18nCoverage = checkI18nCoverage(fileName);

    const result = {
      ...seoAnalysis,
      i18n: i18nCoverage
    };

    results.push(result);

    // Categorize by priority
    if (seoAnalysis.issues.length > 3 || seoAnalysis.scores.overall < 40) {
      priorities.critical.push(result);
    } else if (seoAnalysis.issues.length > 0 || seoAnalysis.scores.overall < 60) {
      priorities.high.push(result);
    } else if (seoAnalysis.warnings.length > 3 || seoAnalysis.scores.overall < 80) {
      priorities.medium.push(result);
    } else {
      priorities.low.push(result);
    }
  }

  // Print summary
  console.log('📈 PRIORITY SUMMARY:');
  console.log(`   🔴 Critical: ${priorities.critical.length} pages`);
  console.log(`   🟠 High: ${priorities.high.length} pages`);
  console.log(`   🟡 Medium: ${priorities.medium.length} pages`);
  console.log(`   🟢 Low: ${priorities.low.length} pages`);
  console.log('');

  // Print top 10 worst pages
  console.log('🚨 TOP 10 PAGES NEEDING ATTENTION:');
  console.log('');

  const sortedByScore = results.sort((a, b) => a.scores.overall - b.scores.overall);

  for (let i = 0; i < Math.min(10, sortedByScore.length); i++) {
    const page = sortedByScore[i];
    console.log(`${i + 1}. ${page.file}`);
    console.log(`   Score: ${page.scores.overall}/100`);
    console.log(`   Issues: ${page.issues.length}, Warnings: ${page.warnings.length}`);
    console.log(`   i18n Coverage: ${page.i18n.coverage}%`);
    if (page.issues.length > 0) {
      page.issues.slice(0, 3).forEach(issue => console.log(`   ${issue}`));
    }
    console.log('');
  }

  // Save full report
  const reportPath = path.join(__dirname, '../ops/reports/seo-audit-comprehensive.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: files.length,
        priorities,
        averageScore: Math.round(
          results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
        )
      },
      pages: results
    }, null, 2)
  );

  console.log(`📄 Full report saved: ${reportPath}`);
  console.log('');

  return results;
}

// Run audit
if (require.main === module) {
  try {
    generateReport();
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

module.exports = { analyzeSEO, checkI18nCoverage, getAllHTMLFiles };
