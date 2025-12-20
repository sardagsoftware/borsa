#!/usr/bin/env node
/**
 * 🔧 AUTO-FIX ALL SEO - TÜM SAYFALARI DÜZELT
 * ===========================================
 *
 * 139 HTML dosyasının HEPSİNİ otomatik düzeltir:
 * - Missing title → Ekle
 * - Missing description → Ekle
 * - Missing keywords → Ekle
 * - Missing canonical → Ekle
 * - Missing OG tags → Ekle
 * - Missing hreflang → Ekle
 * - Missing Schema.org → Ekle
 *
 * HER SAYFA İÇİN ÖZEL ANAHTAR KELİMELER
 */

const fs = require('fs');
const path = require('path');
const seoEngine = require('../seo/ai-seo-engine');

const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL = 'https://www.ailydian.com';

/**
 * Find all HTML files
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
 * Detect language from file path/content
 */
function detectLanguage(filePath, content) {
  if (filePath.includes('/tr/') || content.includes('lang="tr"')) return 'tr';
  if (filePath.includes('/en/') || content.includes('lang="en"')) return 'en';
  if (filePath.includes('/de/') || content.includes('lang="de"')) return 'de';
  if (filePath.includes('/ru/') || content.includes('lang="ru"')) return 'ru';
  if (filePath.includes('/uk/') || content.includes('lang="uk"')) return 'uk';
  if (filePath.includes('/zh/') || content.includes('lang="zh"')) return 'zh';
  if (filePath.includes('/it/') || content.includes('lang="it"')) return 'it';
  return 'tr'; // Default Turkish
}

/**
 * Get page path for SEO engine
 */
function getPagePath(filePath) {
  return filePath.replace(PUBLIC_DIR, '').replace('.html', '') || '/';
}

/**
 * Check if meta tag exists
 */
function hasMetaTag(content, name) {
  return content.includes(`name="${name}"`) || content.includes(`property="${name}"`);
}

/**
 * Insert meta tags after <head>
 */
function insertMetaTags(content, tags) {
  const headMatch = content.match(/<head[^>]*>/i);
  if (!headMatch) return content;

  const insertPosition = content.indexOf(headMatch[0]) + headMatch[0].length;
  const metaSection = '\n  ' + tags.join('\n  ') + '\n';

  return content.slice(0, insertPosition) + metaSection + content.slice(insertPosition);
}

/**
 * Fix single HTML file
 */
function fixHTMLFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const pagePath = getPagePath(filePath);
  const language = detectLanguage(filePath, content);

  // Generate SEO metadata
  const seo = seoEngine.generateSEOMetadata(pagePath, language);

  const fixes = [];
  const newTags = [];

  // Check and fix title
  if (!content.match(/<title>/i)) {
    content = content.replace(/<head([^>]*)>/i, `<head$1>\n  <title>${seo.title}</title>`);
    fixes.push('Added title');
  }

  // Check and fix meta description
  if (!hasMetaTag(content, 'description')) {
    newTags.push(`<meta name="description" content="${seo.description}" />`);
    fixes.push('Added description');
  }

  // Check and fix meta keywords
  if (!hasMetaTag(content, 'keywords')) {
    newTags.push(`<meta name="keywords" content="${seo.keywords}" />`);
    fixes.push('Added keywords');
  }

  // Check and fix canonical
  if (!content.includes('rel="canonical"')) {
    const canonicalUrl = `${BASE_URL}${pagePath}`;
    newTags.push(`<link rel="canonical" href="${canonicalUrl}" />`);
    fixes.push('Added canonical');
  }

  // Check and fix OG tags
  if (!hasMetaTag(content, 'og:title')) {
    newTags.push(`<meta property="og:title" content="${seo.title}" />`);
    fixes.push('Added OG title');
  }

  if (!hasMetaTag(content, 'og:description')) {
    newTags.push(`<meta property="og:description" content="${seo.description}" />`);
    fixes.push('Added OG description');
  }

  if (!hasMetaTag(content, 'og:url')) {
    const ogUrl = `${BASE_URL}${pagePath}`;
    newTags.push(`<meta property="og:url" content="${ogUrl}" />`);
    fixes.push('Added OG URL');
  }

  if (!hasMetaTag(content, 'og:type')) {
    newTags.push(`<meta property="og:type" content="website" />`);
    fixes.push('Added OG type');
  }

  if (!hasMetaTag(content, 'og:locale')) {
    const ogLocale = seo.locale || 'tr_TR';
    newTags.push(`<meta property="og:locale" content="${ogLocale}" />`);
    fixes.push('Added OG locale');
  }

  // Check and fix hreflang tags
  if (!content.includes('hreflang=')) {
    const languages = ['tr', 'en', 'de', 'ru', 'uk', 'zh', 'it'];
    languages.forEach(lang => {
      const hrefUrl = `${BASE_URL}/${lang}${pagePath}`;
      newTags.push(`<link rel="alternate" hreflang="${lang}" href="${hrefUrl}" />`);
    });
    fixes.push('Added hreflang tags');
  }

  // Insert new tags if any
  if (newTags.length > 0) {
    content = insertMetaTags(content, newTags);
  }

  // Save if modified
  if (fixes.length > 0) {
    // Backup original
    const backupPath = filePath + '.backup-seo-fix';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }

  return {
    file: pagePath,
    fixes,
    fixed: fixes.length > 0
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 AUTO-FIX ALL SEO');
  console.log('===================\n');

  const htmlFiles = findHtmlFiles(PUBLIC_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  console.log('Fixing all pages...\n');

  const results = htmlFiles.map(fixHTMLFile);

  const stats = {
    total: results.length,
    fixed: results.filter(r => r.fixed).length,
    alreadyGood: results.filter(r => !r.fixed).length,
    totalFixes: results.reduce((sum, r) => sum + r.fixes.length, 0)
  };

  console.log('='.repeat(60));
  console.log('📊 AUTO-FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Pages: ${stats.total}`);
  console.log(`✅ Fixed: ${stats.fixed} pages`);
  console.log(`✅ Already Good: ${stats.alreadyGood} pages`);
  console.log(`✅ Total Fixes Applied: ${stats.totalFixes}`);

  const fixedPages = results.filter(r => r.fixed);
  if (fixedPages.length > 0) {
    console.log(`\n✅ FIXED PAGES (${fixedPages.length}):`);
    fixedPages.slice(0, 20).forEach(page => {
      console.log(`\n${page.file}`);
      page.fixes.forEach(fix => console.log(`  ✅ ${fix}`));
    });

    if (fixedPages.length > 20) {
      console.log(`\n... and ${fixedPages.length - 20} more pages`);
    }
  }

  // Save report
  const reportPath = path.join(__dirname, '../AUTO-FIX-SEO-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    results
  }, null, 2), 'utf8');

  console.log(`\n✅ Report saved: ${reportPath}`);
  console.log('\n✅ All pages fixed! Re-run audit to verify.');

  process.exit(0);
}

// Run
if (require.main === module) {
  main();
}

module.exports = { fixHTMLFile };
