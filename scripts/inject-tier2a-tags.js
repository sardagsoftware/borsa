#!/usr/bin/env node

/**
 * TIER 2A SEO TAG INJECTION SCRIPT
 *
 * Injects SEO tags into Tier 2A HTML pages (10 pages)
 * - about.html, billing.html, contact.html, enterprise.html, api.html
 * - docs.html, auth.html, help.html, models.html, research.html
 *
 * @version 1.0.0
 * @date 2025-10-25
 */

const fs = require('fs');
const path = require('path');
const { TIER_2A_CONTENT } = require('./tier2a-seo-content');

// Import generator functions from existing script
const { generateSEOTags, generateOrganizationSchema, generateSoftwareApplicationSchema } = require('./tier2-seo-meta-generator');

const PUBLIC_DIR = path.join(__dirname, '../public');
const BACKUP_DIR = path.join(__dirname, '../backups/tier2a-seo-injection');

const TIER_2A_PAGES = [
  'about.html',
  'billing.html',
  'contact.html',
  'enterprise.html',
  'api.html',
  'docs.html',
  'auth.html',
  'help.html',
  'models.html',
  'research.html'
];

// ==================== HELPER FUNCTIONS ====================

function createBackup(page) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const originalPath = path.join(PUBLIC_DIR, page);
  if (!fs.existsSync(originalPath)) {
    console.log(`  ⚠️  File not found: ${page}, skipping backup`);
    return null;
  }

  const backupPath = path.join(BACKUP_DIR, `${page.replace('.html', '')}-${timestamp}.html`);
  fs.copyFileSync(originalPath, backupPath);
  return backupPath;
}

function readHTMLFile(page) {
  const filePath = path.join(PUBLIC_DIR, page);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function writeHTMLFile(page, content) {
  const filePath = path.join(PUBLIC_DIR, page);
  fs.writeFileSync(filePath, content, 'utf-8');
}

function removeOldSEOTags(html) {
  // Remove old title
  html = html.replace(/<title>.*?<\/title>/s, '');

  // Remove old meta tags
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="keywords"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="alternate"\s+hreflang[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="geo\.[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="ICBM"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="robots"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="googlebot"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="bingbot"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="language"[^>]*>/gi, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

  return html;
}

function generateTier2aSEOTags(page, lang = 'tr') {
  const content = TIER_2A_CONTENT[page]?.[lang];

  if (!content) {
    console.error(`  ❌ No SEO content found for ${page} (${lang})`);
    return '';
  }

  const { title, description, keywords } = content;

  const canonical = `https://www.ailydian.com/${lang}/${page}`;

  const geoData = {
    tr: { country: 'TR', region: 'İstanbul', position: '41.0082;28.9784' },
    en: { country: 'US', region: 'California', position: '37.7749;-122.4194' },
    de: { country: 'DE', region: 'Berlin', position: '52.5200;13.4050' },
    ar: { country: 'SA', region: 'Riyadh', position: '24.7136;46.6753' },
    ru: { country: 'RU', region: 'Moscow', position: '55.7558;37.6173' },
    zh: { country: 'CN', region: 'Beijing', position: '39.9042;116.4074' }
  };

  const geo = geoData[lang] || geoData.tr;

  return `
    <!-- SEO Meta Tags (${lang.toUpperCase()}) -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${canonical}" />

    <!-- hreflang Tags -->
    <link rel="alternate" hreflang="tr" href="https://www.ailydian.com/tr/${page}" />
    <link rel="alternate" hreflang="en" href="https://www.ailydian.com/en/${page}" />
    <link rel="alternate" hreflang="de" href="https://www.ailydian.com/de/${page}" />
    <link rel="alternate" hreflang="ar" href="https://www.ailydian.com/ar/${page}" />
    <link rel="alternate" hreflang="ru" href="https://www.ailydian.com/ru/${page}" />
    <link rel="alternate" hreflang="zh" href="https://www.ailydian.com/zh/${page}" />
    <link rel="alternate" hreflang="x-default" href="https://www.ailydian.com/en/${page}" />

    <!-- GEO Targeting -->
    <meta name="geo.region" content="${geo.country}" />
    <meta name="geo.placename" content="${geo.region}" />
    <meta name="geo.position" content="${geo.position}" />
    <meta name="ICBM" content="${geo.position}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LyDian AI" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="https://www.ailydian.com/lydian-og-image.png" />
    <meta property="og:locale" content="${lang}_${geo.country}" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lydianai" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://www.ailydian.com/lydian-twitter-card.png" />

    <!-- Robots -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />

    <!-- Additional Meta -->
    <meta name="author" content="LyDian AI Ecosystem" />
    <meta name="language" content="${lang}" />
`;
}

function injectSEOTags(html, page, lang = 'tr') {
  html = removeOldSEOTags(html);

  const seoTags = generateTier2aSEOTags(page, lang);
  const organizationSchema = `
    <!-- Schema.org: Organization -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "LyDian AI Ecosystem",
      "url": "https://www.ailydian.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ailydian.com/lydian-logo.png"
      },
      "sameAs": [
        "https://twitter.com/lydianai",
        "https://linkedin.com/company/lydian-ai",
        "https://github.com/lydian-ai"
      ]
    }
    </script>
`;

  const headEndIndex = html.indexOf('</head>');
  if (headEndIndex === -1) {
    console.error(`  ❌ No </head> tag found in ${page}`);
    return html;
  }

  const before = html.substring(0, headEndIndex);
  const after = html.substring(headEndIndex);

  return before + seoTags + organizationSchema + after;
}

function processPage(page, lang = 'tr') {
  console.log(`\n📄 Processing: ${page}`);

  try {
    // Check if content exists
    if (!TIER_2A_CONTENT[page]) {
      console.log(`  ⏭️  Skipping: No SEO content available`);
      return { success: false, page, reason: 'No content' };
    }

    // Create backup
    const backupPath = createBackup(page);
    if (backupPath) {
      console.log(`  💾 Backup: ${path.basename(backupPath)}`);
    }

    // Read HTML
    let html = readHTMLFile(page);
    if (!html) {
      console.log(`  ❌ File not found: ${page}`);
      return { success: false, page, reason: 'File not found' };
    }

    // Inject SEO tags
    html = injectSEOTags(html, page, lang);

    // Write updated HTML
    writeHTMLFile(page, html);
    console.log(`  ✅ Injected SEO tags (${lang.toUpperCase()})`);

    return { success: true, page, lang };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, page, error: error.message };
  }
}

// ==================== MAIN EXECUTION ====================

function main() {
  console.log('🚀 TIER 2A SEO TAG INJECTION\n');
  console.log('━'.repeat(60));
  console.log(`📄 Pages to process: ${TIER_2A_PAGES.length}`);
  console.log(`🌍 Default language: TR (Turkish)`);
  console.log(`💾 Backup directory: ${BACKUP_DIR}`);
  console.log('━'.repeat(60));

  const results = [];

  for (const page of TIER_2A_PAGES) {
    const result = processPage(page, 'tr');
    results.push(result);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n' + '━'.repeat(60));
  console.log('📊 INJECTION SUMMARY');
  console.log('━'.repeat(60));
  console.log(`Total Pages:       ${TIER_2A_PAGES.length}`);
  console.log(`✅ Successful:     ${successful}`);
  console.log(`❌ Failed:         ${failed}`);
  console.log(`📈 Success Rate:   ${((successful / TIER_2A_PAGES.length) * 100).toFixed(1)}%`);
  console.log('━'.repeat(60));

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    tier: '2A',
    results,
    summary: {
      total: TIER_2A_PAGES.length,
      successful,
      failed,
      success_rate: (successful / TIER_2A_PAGES.length) * 100
    }
  };

  const reportPath = path.join(__dirname, '../ops/reports/tier2a-injection-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📁 Report saved: ${reportPath}`);
  console.log('\n✅ Tier 2A injection complete!\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  processPage,
  injectSEOTags
};
