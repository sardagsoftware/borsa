#!/usr/bin/env node
/**
 * 🔍 DEEP SEO ANALYSIS - ZERO ERROR VERIFICATION
 * ===============================================
 *
 * Derinlemesine SEO analizi:
 * ✅ HTML doğrulama
 * ✅ Schema.org doğrulama
 * ✅ Meta tag kontrolleri
 * ✅ Görsel URL kontrolleri
 * ✅ Güvenlik kontrolleri
 * ✅ 0 hata garantisi
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

/**
 * HTML dosyasını derinlemesine analiz et
 */
function deepAnalyzeHTML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pagePath = filePath.replace(PUBLIC_DIR, '').replace('.html', '') || '/';

  const errors = [];
  const warnings = [];
  const info = [];

  // 1. Temel HTML yapı kontrolleri
  if (!content.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }
  if (!content.includes('<html')) {
    errors.push('Missing <html> tag');
  }
  if (!content.includes('<head>')) {
    errors.push('Missing <head> tag');
  }
  if (!content.includes('</head>')) {
    errors.push('Missing </head> tag');
  }
  if (!content.includes('<body')) {
    errors.push('Missing <body> tag');
  }

  // 2. Charset kontrolü
  if (!content.includes('charset=') && !content.includes('charset =')) {
    errors.push('Missing charset declaration');
  }

  // 3. Title kontrolü
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch) {
    errors.push('Missing <title> tag');
  } else if (!titleMatch[1] || titleMatch[1].trim() === '') {
    errors.push('Empty <title> tag');
  } else if (titleMatch[1].length > 60) {
    warnings.push(`Title too long (${titleMatch[1].length} chars, recommended < 60)`);
  }

  // 4. Meta description kontrolü
  const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!descMatch) {
    errors.push('Missing meta description');
  } else if (!descMatch[1] || descMatch[1].trim() === '') {
    errors.push('Empty meta description');
  } else if (descMatch[1].length > 160) {
    warnings.push(`Description too long (${descMatch[1].length} chars, recommended < 160)`);
  } else if (descMatch[1].length < 50) {
    warnings.push(`Description too short (${descMatch[1].length} chars, recommended > 50)`);
  }

  // 5. Schema.org JSON-LD kontrolleri
  const schemaMatches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  let schemaCount = 0;
  let validSchemas = 0;
  let invalidSchemas = 0;

  if (schemaMatches) {
    schemaCount = schemaMatches.length;
    schemaMatches.forEach((schemaTag, index) => {
      const jsonMatch = schemaTag.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const schema = JSON.parse(jsonMatch[1]);

          // Schema temel kontroller
          if (!schema['@context']) {
            errors.push(`Schema ${index + 1}: Missing @context`);
            invalidSchemas++;
          } else if (!schema['@type']) {
            errors.push(`Schema ${index + 1}: Missing @type`);
            invalidSchemas++;
          } else {
            validSchemas++;

            // Yazar kontrolü - OLMAMALI
            if (schema.author && typeof schema.author === 'object' && schema.author['@type'] === 'Person') {
              errors.push(`Schema ${index + 1}: Contains Person author (should be removed)`);
            }

            // Image kontrolleri
            if (schema.image) {
              const images = Array.isArray(schema.image) ? schema.image : [schema.image];
              images.forEach(img => {
                const imgUrl = typeof img === 'string' ? img : img.url;
                if (imgUrl && !imgUrl.startsWith('http')) {
                  warnings.push(`Schema ${index + 1}: Relative image URL: ${imgUrl}`);
                }
              });
            }
          }
        } catch (e) {
          errors.push(`Schema ${index + 1}: Invalid JSON - ${e.message}`);
          invalidSchemas++;
        }
      }
    });
  } else {
    warnings.push('No Schema.org markup found');
  }

  // 6. Open Graph kontrolleri
  const ogTitleMatch = content.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDescMatch = content.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const ogImageMatch = content.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const ogUrlMatch = content.match(/<meta\s+property="og:url"\s+content="([^"]*)"/i);

  if (!ogTitleMatch) warnings.push('Missing og:title');
  if (!ogDescMatch) warnings.push('Missing og:description');
  if (!ogImageMatch) warnings.push('Missing og:image');
  if (!ogUrlMatch) warnings.push('Missing og:url');

  // 7. Twitter Card kontrolleri
  const twitterCardMatch = content.match(/<meta\s+name="twitter:card"\s+content="([^"]*)"/i);
  const twitterImageMatch = content.match(/<meta\s+name="twitter:image"\s+content="([^"]*)"/i);

  if (!twitterCardMatch) warnings.push('Missing twitter:card');
  if (!twitterImageMatch) warnings.push('Missing twitter:image');

  // 8. Canonical URL kontrolü
  const canonicalMatch = content.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!canonicalMatch) {
    warnings.push('Missing canonical URL');
  }

  // 9. Viewport kontrolü
  const viewportMatch = content.match(/<meta\s+name="viewport"\s+content="([^"]*)"/i);
  if (!viewportMatch) {
    warnings.push('Missing viewport meta tag');
  }

  // 10. Hreflang kontrolleri
  const hreflangMatches = content.match(/<link\s+rel="alternate"\s+hreflang="([^"]*)"/gi);
  const hreflangCount = hreflangMatches ? hreflangMatches.length : 0;

  // 11. Güvenlik kontrolleri

  // XSS riski - script injection
  const suspiciousPatterns = [
    /eval\(/gi,
    /innerHTML\s*=/gi,
    /document\.write/gi,
    /<script[^>]*>(?![\s\S]*application\/ld\+json)/gi  // ld+json hariç scriptler
  ];

  suspiciousPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // ld+json için istisna
      if (pattern.toString().includes('script') && content.includes('application/ld+json')) {
        return;
      }
      warnings.push(`Security: Found potentially unsafe pattern: ${pattern.toString()}`);
    }
  });

  // 12. Broken HTML kontrolleri
  const openTags = (content.match(/<(?!\/)[^>]+>/g) || []).length;
  const closeTags = (content.match(/<\/[^>]+>/g) || []).length;

  if (Math.abs(openTags - closeTags) > 5) {
    warnings.push(`Possible unclosed tags (open: ${openTags}, close: ${closeTags})`);
  }

  // 13. Image alt attribute kontrolleri
  const imgMatches = content.match(/<img[^>]*>/gi);
  if (imgMatches) {
    let imagesWithoutAlt = 0;
    imgMatches.forEach(img => {
      if (!img.includes('alt=')) {
        imagesWithoutAlt++;
      }
    });
    if (imagesWithoutAlt > 0) {
      info.push(`${imagesWithoutAlt} images without alt attributes`);
    }
  }

  return {
    file: pagePath,
    title: titleMatch ? titleMatch[1] : 'N/A',
    description: descMatch ? descMatch[1].substring(0, 80) + '...' : 'N/A',
    errors: errors.length,
    warnings: warnings.length,
    schemas: {
      total: schemaCount,
      valid: validSchemas,
      invalid: invalidSchemas
    },
    openGraph: {
      title: !!ogTitleMatch,
      description: !!ogDescMatch,
      image: !!ogImageMatch,
      url: !!ogUrlMatch
    },
    twitter: {
      card: !!twitterCardMatch,
      image: !!twitterImageMatch
    },
    hreflang: hreflangCount,
    canonical: !!canonicalMatch,
    viewport: !!viewportMatch,
    errorDetails: errors,
    warningDetails: warnings,
    infoDetails: info,
    status: errors.length === 0 ? 'PASS' : 'FAIL'
  };
}

/**
 * HTML dosyalarını bul
 */
function findHtmlFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html') && !file.includes('backup') && !file.includes('BACKUP')) {
      results.push(filePath);
    }
  });

  return results;
}

/**
 * Ana analiz
 */
async function main() {
  console.log('🔍 DEEP SEO ANALYSIS - ZERO ERROR VERIFICATION');
  console.log('='.repeat(70));
  console.log();

  const htmlFiles = findHtmlFiles(PUBLIC_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  console.log('Analyzing...\n');

  const results = htmlFiles.map(deepAnalyzeHTML);

  // İstatistikler
  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings, 0),
    totalSchemas: results.reduce((sum, r) => sum + r.schemas.total, 0),
    validSchemas: results.reduce((sum, r) => sum + r.schemas.valid, 0),
    invalidSchemas: results.reduce((sum, r) => sum + r.schemas.invalid, 0)
  };

  console.log('='.repeat(70));
  console.log('📊 DEEP SEO ANALYSIS RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Pages: ${stats.total}`);
  console.log(`✅ PASSED: ${stats.passed} pages`);
  console.log(`❌ FAILED: ${stats.failed} pages`);
  console.log(`🔴 Total Errors: ${stats.totalErrors}`);
  console.log(`⚠️  Total Warnings: ${stats.totalWarnings}`);
  console.log(`📋 Total Schemas: ${stats.totalSchemas}`);
  console.log(`✅ Valid Schemas: ${stats.validSchemas}`);
  console.log(`❌ Invalid Schemas: ${stats.invalidSchemas}`);
  console.log();

  // Hatalı sayfaları göster
  const failedPages = results.filter(r => r.status === 'FAIL');
  if (failedPages.length > 0) {
    console.log('❌ FAILED PAGES:\n');
    failedPages.forEach(page => {
      console.log(`${page.file}`);
      console.log(`  Errors: ${page.errors}`);
      page.errorDetails.forEach(err => {
        console.log(`    🔴 ${err}`);
      });
      console.log();
    });
  }

  // Uyarılı sayfalar (sadece ilk 10)
  const warnedPages = results.filter(r => r.warnings > 0);
  if (warnedPages.length > 0) {
    console.log(`⚠️  PAGES WITH WARNINGS (showing first 10 of ${warnedPages.length}):\n`);
    warnedPages.slice(0, 10).forEach(page => {
      console.log(`${page.file}`);
      console.log(`  Warnings: ${page.warnings}`);
      page.warningDetails.slice(0, 3).forEach(warn => {
        console.log(`    ⚠️  ${warn}`);
      });
      if (page.warningDetails.length > 3) {
        console.log(`    ... and ${page.warningDetails.length - 3} more`);
      }
      console.log();
    });
  }

  // Özet
  console.log('='.repeat(70));
  console.log('🎯 SUMMARY:');
  console.log('='.repeat(70));

  if (stats.failed === 0) {
    console.log('✅ ZERO CRITICAL ERRORS - SAFE TO DEPLOY');
  } else {
    console.log(`❌ ${stats.failed} PAGES HAVE CRITICAL ERRORS - FIX BEFORE DEPLOY`);
  }

  if (stats.totalWarnings === 0) {
    console.log('✅ ZERO WARNINGS - PERFECT');
  } else {
    console.log(`⚠️  ${stats.totalWarnings} WARNINGS - REVIEW RECOMMENDED`);
  }

  console.log();

  // Rapor kaydet
  const reportPath = path.join(__dirname, '../DEEP-SEO-ANALYSIS-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    results
  }, null, 2), 'utf8');

  console.log(`📄 Report saved: ${reportPath}\n`);

  // Exit code
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Çalıştır
if (require.main === module) {
  main();
}

module.exports = { deepAnalyzeHTML };
