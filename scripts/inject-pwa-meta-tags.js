#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * 📱 PWA META TAGS INJECTION
 * ═══════════════════════════════════════════════════════════════════
 * Inject complete PWA meta tags to all HTML pages
 * iOS, Android, Desktop compatibility
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const PUBLIC_DIR = path.join(__dirname, '../public');

const PWA_META_TAGS = `
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#C4A962">

<!-- iOS Safari -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="aiLyDian AI">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png">

<!-- Apple Splash Screens -->
<link rel="apple-touch-startup-image" href="/icons/splash/iphone-x.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/icons/splash/iphone-xr.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/iphone-12.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/icons/splash/ipad.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/ipad-pro-11.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/ipad-pro-12.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">

<!-- Android/Chrome -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="aiLyDian AI">

<!-- Microsoft -->
<meta name="msapplication-TileColor" content="#C4A962">
<meta name="msapplication-TileImage" content="/icons/ms-icon-144.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Favicon (all sizes) -->
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png">
<link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
<link rel="shortcut icon" href="/icons/favicon.ico">
`;

function injectPWAMetaTags(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const head = document.querySelector('head');

    if (!head) {
      console.log(`⚠️  No <head> found: ${path.basename(filePath)}`);
      return false;
    }

    // Remove existing PWA meta tags to avoid duplicates
    const existingPWA = document.querySelectorAll(
      'link[rel="manifest"], ' +
      'meta[name="theme-color"], ' +
      'meta[name="apple-mobile-web-app-capable"], ' +
      'link[rel="apple-touch-icon"], ' +
      'link[rel="apple-touch-startup-image"], ' +
      'meta[name="mobile-web-app-capable"], ' +
      'meta[name="msapplication-TileColor"], ' +
      'link[rel="icon"]'
    );

    existingPWA.forEach(el => el.remove());

    // Create a temporary div to parse PWA meta tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = PWA_META_TAGS.trim();

    // Inject all PWA meta tags into head
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeType === 1) { // Element node
        head.appendChild(node.cloneNode(true));
      } else if (node.nodeType === 8) { // Comment node
        head.appendChild(document.createComment(node.textContent));
      }
    });

    // Save updated HTML
    fs.writeFileSync(filePath, dom.serialize(), 'utf8');
    return true;

  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

function getAllHTMLFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(getAllHTMLFiles(filePath));
    } else if (file.endsWith('.html')) {
      // Skip utility files
      if (!file.includes('verifyforzoho') && !file.includes('i18n')) {
        results.push(filePath);
      }
    }
  });

  return results;
}

// Main execution
console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('📱 PWA META TAGS INJECTION');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
console.log('🔧 Injecting PWA meta tags to all HTML pages...');
console.log('');

const htmlFiles = getAllHTMLFiles(PUBLIC_DIR);
let successCount = 0;
let failCount = 0;

htmlFiles.forEach((filePath, index) => {
  const success = injectPWAMetaTags(filePath);
  if (success) {
    successCount++;
  } else {
    failCount++;
  }

  if ((index + 1) % 20 === 0) {
    console.log(`   Processed ${index + 1}/${htmlFiles.length} files...`);
  }
});

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('✅ PWA META TAGS INJECTION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
console.log(`📊 Results:`);
console.log(`   Total HTML Files:  ${htmlFiles.length}`);
console.log(`   Success:           ${successCount}`);
console.log(`   Failed:            ${failCount}`);
console.log('');
console.log('📱 PWA Features Added:');
console.log('   ✅ Manifest.json link');
console.log('   ✅ Theme color (iOS/Android)');
console.log('   ✅ Apple touch icons (5 sizes)');
console.log('   ✅ Apple splash screens (6 devices)');
console.log('   ✅ iOS web app capable');
console.log('   ✅ Android mobile-web-app-capable');
console.log('   ✅ Microsoft tiles');
console.log('   ✅ Favicons (all sizes)');
console.log('');
console.log('🎉 All pages now PWA-ready!');
console.log('');
