#!/usr/bin/env node

/**
 * AILYDIAN Dynamic Sitemap Generator
 * Automatically generates sitemap.xml for all HTML pages
 *
 * Features:
 * - Multi-language support (20+ languages)
 * - Priority calculation based on page importance
 * - Automatic lastmod detection
 * - Change frequency optimization
 * - Google/Bing/Yandex compatible
 */

const fs = require('fs');
const path = require('path');

// Import SEO configuration
const SEO_CONFIG = require('../public/seo-config.js');

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

/**
 * Calculate priority based on page name
 * Higher priority = more important page
 */
function calculatePriority(fileName) {
  // Homepage gets highest priority
  if (fileName === 'index.html') return 1.0;

  // Main pages get high priority
  const highPriorityPages = ['chat.html', 'ai-chat.html', 'about.html', 'pricing.html'];
  if (highPriorityPages.includes(fileName)) return 0.9;

  // Auth and account pages
  const mediumPriorityPages = ['auth.html', 'dashboard.html', 'settings.html', 'profile.html'];
  if (mediumPriorityPages.includes(fileName)) return 0.7;

  // Feature pages
  const featurePages = fileName.includes('ai-') || fileName.includes('expert');
  if (featurePages) return 0.8;

  // API and docs
  if (fileName.includes('api') || fileName.includes('docs')) return 0.6;

  // All other pages
  return 0.5;
}

/**
 * Calculate change frequency based on page type
 */
function calculateChangeFreq(fileName) {
  // Homepage changes frequently
  if (fileName === 'index.html') return 'daily';

  // Chat and AI features change often
  if (fileName.includes('chat') || fileName.includes('ai-')) return 'weekly';

  // Static pages change rarely
  if (fileName.includes('about') || fileName.includes('terms') || fileName.includes('privacy')) {
    return 'monthly';
  }

  // API docs change occasionally
  if (fileName.includes('api') || fileName.includes('docs')) return 'monthly';

  // Default
  return 'weekly';
}

/**
 * Get last modification date of a file
 */
function getLastMod(filePath) {
  const stat = fs.statSync(filePath);
  const date = new Date(stat.mtime);
  return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

/**
 * Generate sitemap.xml
 */
function generateSitemap() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   AILYDIAN SITEMAP GENERATOR                          ║');
  console.log('║   Multi-Language SEO Optimization                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const baseUrl = SEO_CONFIG.global.domain;
  const languages = SEO_CONFIG.global.supportedLanguages;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

  // Get all HTML files
  const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));

  console.log(`📁 Found ${files.length} HTML files`);
  console.log(`🌍 Generating URLs for ${languages.length} languages\n`);

  let urlCount = 0;

  // For each HTML file
  files.forEach(fileName => {
    const filePath = path.join(PUBLIC_DIR, fileName);
    const priority = calculatePriority(fileName);
    const changefreq = calculateChangeFreq(fileName);
    const lastmod = getLastMod(filePath);

    // Default language (Turkish) - main URL
    const mainUrl = `${baseUrl}/${fileName}`;

    xml += '  <url>\n';
    xml += `    <loc>${mainUrl}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;

    // Add xhtml:link alternate for all languages
    languages.forEach(lang => {
      const langUrl = lang === 'tr' ? `${baseUrl}/${fileName}` : `${baseUrl}/${lang}/${fileName}`;

      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${langUrl}"/>\n`;
    });

    // x-default
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${mainUrl}"/>\n`;
    xml += '  </url>\n\n';

    urlCount++;

    // Also add language-specific URLs (for other languages)
    languages.forEach(lang => {
      if (lang !== 'tr') {
        const langUrl = `${baseUrl}/${lang}/${fileName}`;

        xml += '  <url>\n';
        xml += `    <loc>${langUrl}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${(priority * 0.9).toFixed(1)}</priority>\n`;

        // Add xhtml:link alternate for all languages
        languages.forEach(l => {
          const altUrl = l === 'tr' ? `${baseUrl}/${fileName}` : `${baseUrl}/${l}/${fileName}`;

          xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${altUrl}"/>\n`;
        });

        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${mainUrl}"/>\n`;
        xml += '  </url>\n\n';

        urlCount++;
      }
    });

    console.log(`  ✅ ${fileName} - Priority: ${priority.toFixed(1)}, Changefreq: ${changefreq}`);
  });

  xml += '</urlset>';

  // Write sitemap.xml
  fs.writeFileSync(SITEMAP_PATH, xml);

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   SITEMAP GENERATION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`  ✅ Generated ${urlCount} URLs`);
  console.log(`  ✅ Sitemap saved to: ${SITEMAP_PATH}`);
  console.log(`  📊 File size: ${(fs.statSync(SITEMAP_PATH).size / 1024).toFixed(2)} KB`);
  console.log('\n🎯 Next Steps:');
  console.log(
    '  1. Submit sitemap to Google Search Console: https://search.google.com/search-console'
  );
  console.log('  2. Submit to Bing Webmaster Tools: https://www.bing.com/webmasters');
  console.log('  3. Add to robots.txt: Sitemap: https://www.ailydian.com/sitemap.xml');
  console.log('  4. Test sitemap: https://www.xml-sitemaps.com/validate-xml-sitemap.html\n');
}

// Run the script
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
