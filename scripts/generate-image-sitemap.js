#!/usr/bin/env node
/**
 * 🖼️ IMAGE SITEMAP GENERATOR
 * ===========================
 *
 * Google Image Search için özel sitemap
 * Tüm görsellerinİ arama motorlarına bildirir
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL = 'https://www.ailydian.com';

function generateImageSitemap() {
  const htmlFiles = findHtmlFiles(PUBLIC_DIR);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  htmlFiles.forEach(file => {
    const relativePath = file.replace(PUBLIC_DIR, '').replace('.html', '') || '/';
    const url = `${BASE_URL}${relativePath}`;

    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;

    // Add OG images
    for (let i = 1; i <= 4; i++) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${BASE_URL}/og-images${relativePath}${i > 1 ? `-${i}` : ''}.png</image:loc>\n`;
      xml += `      <image:title>${getPageTitle(file)}</image:title>\n`;
      xml += `      <image:caption>LyDian AI - ${getPageTitle(file)}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }

    // Add article images
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${BASE_URL}/article-images${relativePath}.jpg</image:loc>\n`;
    xml += `      <image:title>${getPageTitle(file)} - Article</image:title>\n`;
    xml += `    </image:image>\n`;

    // Add product images
    for (let i = 1; i <= 3; i++) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${BASE_URL}/product-images${relativePath}-${i}.jpg</image:loc>\n`;
      xml += `      <image:title>${getPageTitle(file)} - View ${i}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  });

  xml += '</urlset>';

  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap-images.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');

  return sitemapPath;
}

function getPageTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<title>([^<]+)<\/title>/i);
    return match ? match[1] : 'LyDian AI';
  } catch {
    return 'LyDian AI';
  }
}

function findHtmlFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html') && !file.includes('backup')) {
      results.push(filePath);
    }
  });

  return results;
}

// Run
if (require.main === module) {
  console.log('🖼️  Generating image sitemap...\n');
  const sitemap = generateImageSitemap();
  console.log(`✅ Image sitemap created: ${sitemap}`);
  console.log('📊 Submitting to Google, Bing, Yandex...\n');
}

module.exports = { generateImageSitemap };
