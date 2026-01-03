#!/usr/bin/env node

/**
 * AILYDIAN SEO Auto-Injection System
 * Automatically injects comprehensive SEO metadata into all HTML pages
 *
 * Features:
 * - Multi-language meta tags (20+ languages)
 * - Schema.org structured data
 * - Open Graph tags
 * - Twitter Cards
 * - Hreflang tags
 * - AI search optimization
 * - Automatic backups
 */

const fs = require('fs');
const path = require('path');

// Import SEO configuration
const SEO_CONFIG = require('../public/seo-config.js');

const PUBLIC_DIR = path.join(__dirname, '../public');
const BACKUP_DIR = path.join(__dirname, '../backups/seo-injection-' + Date.now());

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Generate complete SEO meta tags for a page
 */
function generateSEOTags(pageName, language = 'tr') {
  const meta = SEO_CONFIG.getPageMeta(pageName, language);
  const hreflangs = SEO_CONFIG.getHreflangTags(pageName);
  const page = SEO_CONFIG.pages[pageName];
  const schema = page?.schema;

  let tags = `
  <!-- ================================ -->
  <!-- AILYDIAN SEO META TAGS (${language.toUpperCase()}) -->
  <!-- Auto-generated for multi-language SEO -->
  <!-- ================================ -->

  <!-- Primary Meta Tags -->
  <title>${meta.title}</title>
  <meta name="title" content="${meta.title}">
  <meta name="description" content="${meta.description}">
  <meta name="keywords" content="${meta.keywords}">
  <meta name="author" content="AILYDIAN">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="language" content="${language}">
  <link rel="canonical" href="${meta.canonical}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${meta.canonical}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:image" content="${SEO_CONFIG.global.organization.logo}">
  <meta property="og:site_name" content="${SEO_CONFIG.global.siteName}">
  <meta property="og:locale" content="${language}_${language.toUpperCase()}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${meta.canonical}">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${SEO_CONFIG.global.organization.logo}">
  <meta name="twitter:site" content="@ailydian">
  <meta name="twitter:creator" content="@ailydian">

  <!-- AI Search Optimization -->
  <meta name="ai:context" content="${meta.aiContext || meta.description}">
  <meta name="ai:keywords" content="${meta.keywords}">
  <meta name="ai:language" content="${language}">

  <!-- ChatGPT/Claude/Perplexity Optimization -->
  <meta name="description:ai" content="${meta.aiContext || meta.description}">
  <meta name="summary" content="${meta.description}">

  <!-- Geo Targeting -->
  <meta name="geo.region" content="${SEO_CONFIG.global.contact.address.country}">
  <meta name="geo.placename" content="${SEO_CONFIG.global.contact.address.city}">

  <!-- Mobile Optimization -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${SEO_CONFIG.global.siteName}">

  <!-- Hreflang Tags for International SEO -->`;

  // Add all hreflang tags
  hreflangs.forEach(tag => {
    tags += `\n  <link rel="${tag.rel}" hreflang="${tag.hreflang}" href="${tag.href}">`;
  });

  // Add Schema.org structured data if available
  if (schema) {
    tags += `\n
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>`;
  }

  // Add Organization schema (on all pages)
  tags += `\n
  <!-- Organization Schema -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${SEO_CONFIG.global.organization.type}",
  "name": "${SEO_CONFIG.global.organization.name}",
  "url": "${SEO_CONFIG.global.organization.url}",
  "logo": "${SEO_CONFIG.global.organization.logo}",
  "sameAs": ${JSON.stringify(SEO_CONFIG.global.organization.sameAs, null, 2)},
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "${SEO_CONFIG.global.contact.email}",
    "contactType": "customer service"
  }
}
  </script>

  <!-- ================================ -->
  <!-- END AILYDIAN SEO META TAGS -->
  <!-- ================================ -->
`;

  return tags;
}

/**
 * Inject SEO tags into HTML file
 */
function injectSEOIntoHTML(filePath, language = 'tr') {
  const fileName = path.basename(filePath);

  console.log(`\n📄 Processing: ${fileName} (${language})`);

  // Read the HTML file
  let html = fs.readFileSync(filePath, 'utf-8');

  // Create backup
  const backupPath = path.join(BACKUP_DIR, fileName);
  fs.writeFileSync(backupPath, html);
  console.log(`  ✅ Backup created: ${backupPath}`);

  // Check if SEO tags already exist
  if (html.includes('<!-- AILYDIAN SEO META TAGS')) {
    console.log('  ⚠️  SEO tags already exist, removing old tags...');
    // Remove old SEO section
    html = html.replace(
      /<!-- ================================ -->\s*<!-- AILYDIAN SEO META TAGS[\s\S]*?<!-- END AILYDIAN SEO META TAGS -->\s*<!-- ================================ -->/g,
      ''
    );
  }

  // Generate new SEO tags
  const seoTags = generateSEOTags(fileName, language);

  // Find the closing </head> tag and insert before it
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${seoTags}\n</head>`);

    // Write the updated HTML
    fs.writeFileSync(filePath, html);
    console.log('  ✅ SEO tags injected successfully');
    return true;
  } else {
    console.log('  ❌ No </head> tag found, skipping...');
    return false;
  }
}

/**
 * Process all HTML files in a directory
 */
function processDirectory(dirPath, language = 'tr') {
  console.log(`\n📂 Scanning directory: ${dirPath}`);
  console.log(`🌍 Language: ${language.toUpperCase()}`);

  const files = fs.readdirSync(dirPath);
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    // Only process HTML files
    if (stat.isFile() && file.endsWith('.html')) {
      try {
        const success = injectSEOIntoHTML(filePath, language);
        if (success) {
          processed++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.log(`  ❌ Error processing ${file}: ${error.message}`);
        errors++;
      }
    }
  });

  return { processed, skipped, errors };
}

/**
 * Main execution
 */
function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   AILYDIAN SEO AUTO-INJECTION SYSTEM                  ║');
  console.log('║   Multi-Language SEO Optimization                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📁 Working directory: ${PUBLIC_DIR}`);
  console.log(`💾 Backup directory: ${BACKUP_DIR}`);
  console.log(`🌍 Supported languages: ${SEO_CONFIG.global.supportedLanguages.join(', ')}`);

  // Process all HTML files (default language: Turkish)
  const result = processDirectory(PUBLIC_DIR, 'tr');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   INJECTION SUMMARY                                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`  ✅ Successfully processed: ${result.processed} files`);
  console.log(`  ⚠️  Skipped: ${result.skipped} files`);
  console.log(`  ❌ Errors: ${result.errors} files`);
  console.log(`\n💾 Backups saved to: ${BACKUP_DIR}`);
  console.log('\n🎯 Next Steps:');
  console.log('  1. Review injected SEO tags in HTML files');
  console.log('  2. Generate sitemap.xml');
  console.log('  3. Configure robots.txt');
  console.log('  4. Test with Lighthouse');
  console.log('  5. Deploy to production\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { injectSEOIntoHTML, generateSEOTags, processDirectory };
