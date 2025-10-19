#!/usr/bin/env node
/**
 * TIER 1 SEO IMPLEMENTATION
 * Implements SEO for 6 pages x 6 languages with:
 * - HTML meta tag injection
 * - i18n JSON file generation
 * - GEO targeting
 * - Social media tags
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const TIER1_CONFIG = require('/tmp/tier1-pages.json').tier1;
const SEO_CONTENT = require('../ops/reports/tier1-seo-content.json');

// Create i18n JSON files for all pages
function createI18nFiles() {
  console.log('📝 Creating i18n JSON files...\n');
  let created = 0;

  for (const page of TIER1_CONFIG.pages) {
    for (const lang of TIER1_CONFIG.languages) {
      const seo = SEO_CONTENT[page.id][lang];
      const i18nPath = path.join(__dirname, `../public/locales/${lang}/${page.id}.json`);

      fs.mkdirSync(path.dirname(i18nPath), { recursive: true });

      const i18nContent = {
        meta: {
          title: seo.title,
          description: seo.description,
          keywords: seo.keywords
        },
        seo: {
          og: seo.og,
          twitter: seo.twitter,
          geo: seo.geo,
          canonical: seo.canonical
        }
      };

      fs.writeFileSync(i18nPath, JSON.stringify(i18nContent, null, 2));
      created++;
      console.log(`  ✅ ${lang}/${page.id}.json`);
    }
  }

  console.log(`\n✅ Created ${created} i18n files\n`);
}

// Inject SEO meta tags into HTML files
function injectMetaTags() {
  console.log('🔧 Injecting meta tags into HTML files...\n');

  for (const page of TIER1_CONFIG.pages) {
    const htmlPath = path.join(__dirname, '../public', page.file);

    if (!fs.existsSync(htmlPath)) {
      console.log(`  ⚠️  ${page.file} not found, skipping`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);

    // Use TR as default for HTML (i18n will handle other languages)
    const seo = SEO_CONTENT[page.id]['tr'];

    // Update title
    $('title').text(seo.title);

    // Remove existing meta tags we'll replace
    $('meta[name="description"]').remove();
    $('meta[name="keywords"]').remove();
    $('meta[property^="og:"]').remove();
    $('meta[name^="twitter:"]').remove();
    $('meta[name^="geo."]').remove();
    $('meta[name="ICBM"]').remove();
    $('link[rel="canonical"]').remove();

    // Add new meta tags
    $('head').append(`
    <!-- SEO Meta Tags -->
    <meta name="description" content="${seo.description}">
    <meta name="keywords" content="${seo.keywords}">

    <!-- Open Graph -->
    <meta property="og:title" content="${seo.og.title}">
    <meta property="og:description" content="${seo.og.description}">
    <meta property="og:image" content="${seo.og.image}">
    <meta property="og:type" content="${seo.og.type}">
    <meta property="og:locale" content="${seo.og.locale}">
    <meta property="og:url" content="${seo.canonical}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="${seo.twitter.card}">
    <meta name="twitter:title" content="${seo.twitter.title}">
    <meta name="twitter:description" content="${seo.twitter.description}">
    <meta name="twitter:image" content="${seo.twitter.image}">

    <!-- GEO Targeting -->
    <meta name="geo.region" content="${seo.geo['geo.region']}">
    <meta name="geo.placename" content="${seo.geo['geo.placename']}">
    <meta name="geo.position" content="${seo.geo['geo.position']}">
    <meta name="ICBM" content="${seo.geo.ICBM}">

    <!-- Canonical -->
    <link rel="canonical" href="${seo.canonical}">

    <!-- Alternate Languages -->
    ${TIER1_CONFIG.languages.map(l =>
      `<link rel="alternate" hreflang="${l}" href="${seo.canonical}?lang=${l}">`
    ).join('\n    ')}
`);

    // Save updated HTML
    fs.writeFileSync(htmlPath, $.html());
    console.log(`  ✅ ${page.file} - Meta tags injected`);
  }

  console.log(`\n✅ All HTML files updated\n`);
}

// Run implementation
try {
  console.log('🚀 TIER 1 SEO IMPLEMENTATION\n');
  console.log('=' .repeat(50));
  console.log('');

  createI18nFiles();
  injectMetaTags();

  console.log('=' .repeat(50));
  console.log('\n✅ TIER 1 SEO IMPLEMENTATION COMPLETE!');
  console.log('\n📊 Summary:');
  console.log(`   - Pages: ${TIER1_CONFIG.pages.length}`);
  console.log(`   - Languages: ${TIER1_CONFIG.languages.length}`);
  console.log(`   - Total i18n files: ${TIER1_CONFIG.pages.length * TIER1_CONFIG.languages.length}`);
  console.log('');
} catch (error) {
  console.error('❌ Implementation failed:', error.message);
  process.exit(1);
}
