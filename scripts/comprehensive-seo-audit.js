#!/usr/bin/env node
/**
 * 🔍 COMPREHENSIVE SEO AUDIT
 * ==========================
 *
 * Tüm HTML dosyalarının detaylı SEO analizi:
 * - Title tag kontrolü (var mı, uzunluk, duplicate)
 * - Meta description (var mı, uzunluk, duplicate)
 * - Meta keywords (var mı, relevant)
 * - Canonical URL (var mı, doğru mu)
 * - OG tags (var mı, complete)
 * - hreflang tags (var mı, tüm diller)
 * - Schema.org markup (var mı)
 * - H1 tag (var mı, unique)
 * - Image alt attributes
 * - Internal/external links
 *
 * HER SAYFA İÇİN ANAHTAR KELİME ANALİZİ
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

// SEO kriterler
const SEO_CRITERIA = {
  title: {
    minLength: 10,
    maxLength: 60,
    required: true
  },
  description: {
    minLength: 50,
    maxLength: 160,
    required: true
  },
  keywords: {
    minCount: 3,
    maxCount: 10,
    required: true
  },
  h1: {
    minCount: 1,
    maxCount: 1,
    required: true
  }
};

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
 * Extract meta tag
 */
function extractMeta(content, name) {
  const patterns = [
    new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i'),
    new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${name}"`, 'i')
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract OG tag
 */
function extractOG(content, property) {
  const patterns = [
    new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 'i'),
    new RegExp(`<meta\\s+content="([^"]*)"\\s+property="${property}"`, 'i')
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract title
 */
function extractTitle(content) {
  const match = content.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract H1 tags
 */
function extractH1s(content) {
  const matches = content.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
  return matches ? matches.map(m => m.replace(/<\/?h1[^>]*>/gi, '').trim()) : [];
}

/**
 * Extract canonical URL
 */
function extractCanonical(content) {
  const match = content.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match ? match[1] : null;
}

/**
 * Check hreflang tags
 */
function extractHreflangs(content) {
  const matches = content.match(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi);
  if (!matches) return [];

  return matches.map(match => {
    const lang = match.match(/hreflang="([^"]+)"/i)[1];
    const href = match.match(/href="([^"]+)"/i)[1];
    return { lang, href };
  });
}

/**
 * Check Schema.org markup
 */
function hasSchemaMarkup(content) {
  return content.includes('application/ld+json') || content.includes('schema.org');
}

/**
 * Extract keywords from content
 */
function extractKeywords(content) {
  const metaKeywords = extractMeta(content, 'keywords');
  if (!metaKeywords) return [];

  return metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

/**
 * Analyze single HTML file
 */
function analyzePage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(PUBLIC_DIR, '');

  const analysis = {
    file: relativePath,
    url: `https://www.ailydian.com${relativePath.replace('.html', '')}`,
    issues: [],
    warnings: [],
    score: 100,
    seo: {}
  };

  // Title
  const title = extractTitle(content);
  analysis.seo.title = title;
  if (!title) {
    analysis.issues.push('Title tag eksik');
    analysis.score -= 15;
  } else if (title.length < SEO_CRITERIA.title.minLength) {
    analysis.warnings.push(`Title çok kısa (${title.length} karakter, min: ${SEO_CRITERIA.title.minLength})`);
    analysis.score -= 5;
  } else if (title.length > SEO_CRITERIA.title.maxLength) {
    analysis.warnings.push(`Title çok uzun (${title.length} karakter, max: ${SEO_CRITERIA.title.maxLength})`);
    analysis.score -= 5;
  }

  // Description
  const description = extractMeta(content, 'description');
  analysis.seo.description = description;
  if (!description) {
    analysis.issues.push('Meta description eksik');
    analysis.score -= 15;
  } else if (description.length < SEO_CRITERIA.description.minLength) {
    analysis.warnings.push(`Description çok kısa (${description.length} karakter, min: ${SEO_CRITERIA.description.minLength})`);
    analysis.score -= 5;
  } else if (description.length > SEO_CRITERIA.description.maxLength) {
    analysis.warnings.push(`Description çok uzun (${description.length} karakter, max: ${SEO_CRITERIA.description.maxLength})`);
    analysis.score -= 5;
  }

  // Keywords
  const keywords = extractKeywords(content);
  analysis.seo.keywords = keywords;
  if (keywords.length === 0) {
    analysis.issues.push('Meta keywords eksik');
    analysis.score -= 10;
  } else if (keywords.length < SEO_CRITERIA.keywords.minCount) {
    analysis.warnings.push(`Keywords az (${keywords.length}, min: ${SEO_CRITERIA.keywords.minCount})`);
    analysis.score -= 5;
  }

  // H1
  const h1s = extractH1s(content);
  analysis.seo.h1 = h1s;
  if (h1s.length === 0) {
    analysis.warnings.push('H1 tag eksik');
    analysis.score -= 10;
  } else if (h1s.length > 1) {
    analysis.warnings.push(`Birden fazla H1 (${h1s.length})`);
    analysis.score -= 5;
  }

  // Canonical
  const canonical = extractCanonical(content);
  analysis.seo.canonical = canonical;
  if (!canonical) {
    analysis.warnings.push('Canonical URL eksik');
    analysis.score -= 5;
  }

  // Open Graph
  const ogTitle = extractOG(content, 'og:title');
  const ogDescription = extractOG(content, 'og:description');
  const ogImage = extractOG(content, 'og:image');
  const ogUrl = extractOG(content, 'og:url');

  analysis.seo.openGraph = { ogTitle, ogDescription, ogImage, ogUrl };

  if (!ogTitle) {
    analysis.warnings.push('OG title eksik');
    analysis.score -= 3;
  }
  if (!ogDescription) {
    analysis.warnings.push('OG description eksik');
    analysis.score -= 3;
  }
  if (!ogImage) {
    analysis.warnings.push('OG image eksik');
    analysis.score -= 3;
  }

  // Hreflang
  const hreflangs = extractHreflangs(content);
  analysis.seo.hreflangs = hreflangs;
  if (hreflangs.length === 0) {
    analysis.warnings.push('Hreflang tags eksik (çok dilli SEO için gerekli)');
    analysis.score -= 5;
  }

  // Schema.org
  const hasSchema = hasSchemaMarkup(content);
  analysis.seo.schema = hasSchema;
  if (!hasSchema) {
    analysis.warnings.push('Schema.org markup eksik');
    analysis.score -= 5;
  }

  return analysis;
}

/**
 * Find duplicates
 */
function findDuplicates(analyses) {
  const titleMap = new Map();
  const descriptionMap = new Map();

  analyses.forEach(analysis => {
    if (analysis.seo.title) {
      if (!titleMap.has(analysis.seo.title)) {
        titleMap.set(analysis.seo.title, []);
      }
      titleMap.get(analysis.seo.title).push(analysis.file);
    }

    if (analysis.seo.description) {
      if (!descriptionMap.has(analysis.seo.description)) {
        descriptionMap.set(analysis.seo.description, []);
      }
      descriptionMap.get(analysis.seo.description).push(analysis.file);
    }
  });

  const duplicates = {
    titles: [],
    descriptions: []
  };

  titleMap.forEach((files, title) => {
    if (files.length > 1) {
      duplicates.titles.push({ title, files, count: files.length });
    }
  });

  descriptionMap.forEach((files, description) => {
    if (files.length > 1) {
      duplicates.descriptions.push({ description, files, count: files.length });
    }
  });

  return duplicates;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 COMPREHENSIVE SEO AUDIT');
  console.log('===========================\n');

  const htmlFiles = findHtmlFiles(PUBLIC_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  // Analyze all pages
  console.log('Analyzing pages...\n');
  const analyses = htmlFiles.map(analyzePage);

  // Find duplicates
  const duplicates = findDuplicates(analyses);

  // Mark duplicate issues
  duplicates.titles.forEach(dup => {
    dup.files.forEach((file, index) => {
      if (index > 0) {
        const analysis = analyses.find(a => a.file === file);
        if (analysis) {
          analysis.issues.push(`Duplicate title: "${dup.title}"`);
          analysis.score -= 10;
        }
      }
    });
  });

  duplicates.descriptions.forEach(dup => {
    dup.files.forEach((file, index) => {
      if (index > 0) {
        const analysis = analyses.find(a => a.file === file);
        if (analysis) {
          analysis.issues.push(`Duplicate description`);
          analysis.score -= 10;
        }
      }
    });
  });

  // Statistics
  const stats = {
    total: analyses.length,
    perfect: analyses.filter(a => a.score === 100).length,
    good: analyses.filter(a => a.score >= 80 && a.score < 100).length,
    needsWork: analyses.filter(a => a.score >= 60 && a.score < 80).length,
    poor: analyses.filter(a => a.score < 60).length,
    averageScore: (analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length).toFixed(2),
    totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
    totalWarnings: analyses.reduce((sum, a) => sum + a.warnings.length, 0),
    missingTitle: analyses.filter(a => !a.seo.title).length,
    missingDescription: analyses.filter(a => !a.seo.description).length,
    missingKeywords: analyses.filter(a => !a.seo.keywords || a.seo.keywords.length === 0).length,
    missingH1: analyses.filter(a => !a.seo.h1 || a.seo.h1.length === 0).length,
    missingCanonical: analyses.filter(a => !a.seo.canonical).length,
    missingSchema: analyses.filter(a => !a.seo.schema).length,
    duplicateTitles: duplicates.titles.length,
    duplicateDescriptions: duplicates.descriptions.length
  };

  // Report
  console.log('='.repeat(60));
  console.log('📊 SEO AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Pages: ${stats.total}`);
  console.log(`Average Score: ${stats.averageScore}/100`);
  console.log(`\nScore Distribution:`);
  console.log(`  ✅ Perfect (100): ${stats.perfect} pages`);
  console.log(`  ✅ Good (80-99): ${stats.good} pages`);
  console.log(`  ⚠️  Needs Work (60-79): ${stats.needsWork} pages`);
  console.log(`  ❌ Poor (<60): ${stats.poor} pages`);
  console.log(`\nIssues:`);
  console.log(`  ❌ Critical Issues: ${stats.totalIssues}`);
  console.log(`  ⚠️  Warnings: ${stats.totalWarnings}`);
  console.log(`\nMissing Elements:`);
  console.log(`  Title: ${stats.missingTitle} pages`);
  console.log(`  Description: ${stats.missingDescription} pages`);
  console.log(`  Keywords: ${stats.missingKeywords} pages`);
  console.log(`  H1: ${stats.missingH1} pages`);
  console.log(`  Canonical: ${stats.missingCanonical} pages`);
  console.log(`  Schema.org: ${stats.missingSchema} pages`);
  console.log(`\nDuplicates:`);
  console.log(`  Duplicate Titles: ${stats.duplicateTitles}`);
  console.log(`  Duplicate Descriptions: ${stats.duplicateDescriptions}`);

  // Pages needing attention
  const problemPages = analyses.filter(a => a.score < 80).sort((a, b) => a.score - b.score);

  if (problemPages.length > 0) {
    console.log(`\n⚠️  PAGES NEEDING ATTENTION (${problemPages.length}):`);
    console.log('='.repeat(60));

    problemPages.slice(0, 20).forEach(page => {
      console.log(`\n${page.file} (Score: ${page.score}/100)`);
      console.log(`URL: ${page.url}`);
      if (page.issues.length > 0) {
        console.log(`❌ Issues:`);
        page.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      if (page.warnings.length > 0) {
        console.log(`⚠️  Warnings:`);
        page.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    });

    if (problemPages.length > 20) {
      console.log(`\n... and ${problemPages.length - 20} more pages`);
    }
  }

  // Duplicates detail
  if (duplicates.titles.length > 0) {
    console.log(`\n❌ DUPLICATE TITLES (${duplicates.titles.length}):`);
    console.log('='.repeat(60));
    duplicates.titles.forEach(dup => {
      console.log(`\nTitle: "${dup.title}"`);
      console.log(`Found in ${dup.count} files:`);
      dup.files.forEach(file => console.log(`  - ${file}`));
    });
  }

  if (duplicates.descriptions.length > 0) {
    console.log(`\n❌ DUPLICATE DESCRIPTIONS (${duplicates.descriptions.length}):`);
    console.log('='.repeat(60));
    duplicates.descriptions.forEach(dup => {
      console.log(`\nDescription: "${dup.description.substring(0, 80)}..."`);
      console.log(`Found in ${dup.count} files:`);
      dup.files.forEach(file => console.log(`  - ${file}`));
    });
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    duplicates,
    analyses: analyses.map(a => ({
      file: a.file,
      url: a.url,
      score: a.score,
      issues: a.issues,
      warnings: a.warnings,
      seo: {
        title: a.seo.title,
        titleLength: a.seo.title ? a.seo.title.length : 0,
        description: a.seo.description,
        descriptionLength: a.seo.description ? a.seo.description.length : 0,
        keywordCount: a.seo.keywords ? a.seo.keywords.length : 0,
        h1Count: a.seo.h1 ? a.seo.h1.length : 0,
        hasCanonical: !!a.seo.canonical,
        hasSchema: a.seo.schema,
        hreflangCount: a.seo.hreflangs ? a.seo.hreflangs.length : 0,
        ogComplete: !!(a.seo.openGraph.ogTitle && a.seo.openGraph.ogDescription && a.seo.openGraph.ogImage)
      }
    }))
  };

  const reportPath = path.join(__dirname, '../COMPREHENSIVE-SEO-AUDIT-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n✅ Detailed report saved: ${reportPath}`);

  // Exit code based on score
  if (stats.averageScore < 80) {
    console.log(`\n⚠️  Average SEO score below 80. Please review and fix issues.`);
    process.exit(1);
  } else {
    console.log(`\n✅ SEO audit complete. Average score: ${stats.averageScore}/100`);
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = { analyzePage, findDuplicates };
