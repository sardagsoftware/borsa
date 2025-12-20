#!/usr/bin/env node
/**
 * 🔄 AUTO SEARCH CONSOLE UPDATE
 * ==============================
 *
 * Otomatik arama motoru güncelleme ve bildirim sistemi
 * - Google Search Console sitemap ping
 * - Bing Webmaster Tools IndexNow
 * - Yandex Webmaster IndexNow
 * - Tüm sayfaların otomatik bildirimi
 *
 * Site zaten Google ve Bing'de kayıtlı olduğu için:
 * 1. Sitemap'i otomatik submit eder
 * 2. IndexNow ile tüm sayfaları bildirir
 * 3. Arama motorlarının tekrar crawl etmesini sağlar
 *
 * BEYAZ ŞAPKA - WHITE HAT SEO
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'https://www.ailydian.com';
const PUBLIC_DIR = path.join(__dirname, '../public');
const INDEXNOW_KEY_PATH = path.join(PUBLIC_DIR, 'indexnow-key.txt');

// IndexNow configuration
const INDEXNOW_CONFIG = {
  key: fs.existsSync(INDEXNOW_KEY_PATH)
    ? fs.readFileSync(INDEXNOW_KEY_PATH, 'utf8').trim()
    : crypto.randomBytes(32).toString('hex'),
  endpoints: {
    bing: 'https://www.bing.com/indexnow',
    yandex: 'https://yandex.com/indexnow',
    seznam: 'https://search.seznam.cz/indexnow',
    naver: 'https://searchadvisor.naver.com/indexnow'
  }
};

/**
 * HTTP/HTTPS request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Submit sitemap to Google
 */
async function submitToGoogle() {
  console.log('\n📍 GOOGLE SEARCH CONSOLE');
  console.log('='.repeat(50));

  try {
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

    console.log(`Sitemap URL: ${sitemapUrl}`);
    console.log(`Ping URL: ${pingUrl}`);

    const response = await makeRequest(pingUrl);

    if (response.statusCode === 200) {
      console.log('✅ Google sitemap ping SUCCESSFUL');
      return { success: true, engine: 'google', status: response.statusCode };
    } else {
      console.log(`⚠️  Google sitemap ping: HTTP ${response.statusCode}`);
      return { success: false, engine: 'google', status: response.statusCode };
    }
  } catch (error) {
    console.log(`❌ Google sitemap ping failed: ${error.message}`);
    return { success: false, engine: 'google', error: error.message };
  }
}

/**
 * Submit to IndexNow (Bing & Yandex)
 */
async function submitToIndexNow(urls, engine = 'bing') {
  const endpoint = INDEXNOW_CONFIG.endpoints[engine];

  const payload = {
    host: 'www.ailydian.com',
    key: INDEXNOW_CONFIG.key,
    keyLocation: `${BASE_URL}/indexnow-key.txt`,
    urlList: Array.isArray(urls) ? urls : [urls]
  };

  const payloadString = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const urlObj = new URL(endpoint);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payloadString),
        'User-Agent': 'LyDian-SEO-Bot/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          resolve({ success: true, engine, status: res.statusCode, urlCount: payload.urlList.length });
        } else {
          reject(new Error(`IndexNow ${engine} failed: HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payloadString);
    req.end();
  });
}

/**
 * Get all URLs from sitemap
 */
function getUrlsFromSitemap() {
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');

  if (!fs.existsSync(sitemapPath)) {
    console.log('⚠️  Sitemap not found, generating URLs from HTML files...');
    return getUrlsFromHtmlFiles();
  }

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g) || [];

  return urlMatches.map(match => {
    const url = match.replace('<loc>', '').replace('</loc>', '');
    return url;
  });
}

/**
 * Get URLs from HTML files (fallback)
 */
function getUrlsFromHtmlFiles() {
  const htmlFiles = findHtmlFiles(PUBLIC_DIR);
  return htmlFiles.map(file => {
    const relativePath = file.replace(PUBLIC_DIR, '').replace('.html', '') || '/';
    return `${BASE_URL}${relativePath}`;
  });
}

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
 * Submit to Bing IndexNow
 */
async function submitToBing(urls) {
  console.log('\n🔵 BING WEBMASTER TOOLS');
  console.log('='.repeat(50));

  try {
    // Bing has a limit of 10,000 URLs per request, but we'll batch to 1000 for safety
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    console.log(`Total URLs: ${urls.length}`);
    console.log(`Batches: ${batches.length} (${batchSize} URLs per batch)`);

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\nSubmitting batch ${i + 1}/${batches.length} (${batch.length} URLs)...`);

      try {
        const result = await submitToIndexNow(batch, 'bing');
        results.push(result);
        console.log(`✅ Bing IndexNow batch ${i + 1}: SUCCESS (HTTP ${result.status})`);

        // Wait 1 second between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`❌ Bing IndexNow batch ${i + 1} failed: ${error.message}`);
        results.push({ success: false, engine: 'bing', error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Bing: ${successCount}/${batches.length} batches successful`);

    return results;
  } catch (error) {
    console.log(`❌ Bing submission failed: ${error.message}`);
    return [{ success: false, engine: 'bing', error: error.message }];
  }
}

/**
 * Submit to Yandex IndexNow
 */
async function submitToYandex(urls) {
  console.log('\n🟡 YANDEX WEBMASTER');
  console.log('='.repeat(50));

  try {
    // Yandex also supports bulk submission
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    console.log(`Total URLs: ${urls.length}`);
    console.log(`Batches: ${batches.length} (${batchSize} URLs per batch)`);

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\nSubmitting batch ${i + 1}/${batches.length} (${batch.length} URLs)...`);

      try {
        const result = await submitToIndexNow(batch, 'yandex');
        results.push(result);
        console.log(`✅ Yandex IndexNow batch ${i + 1}: SUCCESS (HTTP ${result.status})`);

        // Wait 1 second between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`❌ Yandex IndexNow batch ${i + 1} failed: ${error.message}`);
        results.push({ success: false, engine: 'yandex', error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Yandex: ${successCount}/${batches.length} batches successful`);

    return results;
  } catch (error) {
    console.log(`❌ Yandex submission failed: ${error.message}`);
    return [{ success: false, engine: 'yandex', error: error.message }];
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 AUTO SEARCH CONSOLE UPDATE');
  console.log('==============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const startTime = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results: {
      google: null,
      bing: [],
      yandex: []
    },
    summary: {
      totalUrls: 0,
      googleSuccess: false,
      bingBatches: 0,
      bingSuccess: 0,
      yandexBatches: 0,
      yandexSuccess: 0
    }
  };

  try {
    // Get all URLs
    console.log('📋 Getting URLs from sitemap...');
    const urls = getUrlsFromSitemap();
    report.summary.totalUrls = urls.length;
    console.log(`✅ Found ${urls.length} URLs\n`);

    // Submit to Google
    report.results.google = await submitToGoogle();
    report.summary.googleSuccess = report.results.google.success;

    // Submit to Bing
    report.results.bing = await submitToBing(urls);
    report.summary.bingBatches = report.results.bing.length;
    report.summary.bingSuccess = report.results.bing.filter(r => r.success).length;

    // Submit to Yandex
    report.results.yandex = await submitToYandex(urls);
    report.summary.yandexBatches = report.results.yandex.length;
    report.summary.yandexSuccess = report.results.yandex.filter(r => r.success).length;

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total URLs: ${report.summary.totalUrls}`);
    console.log(`Google Sitemap Ping: ${report.summary.googleSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Bing IndexNow: ${report.summary.bingSuccess}/${report.summary.bingBatches} batches ✅`);
    console.log(`Yandex IndexNow: ${report.summary.yandexSuccess}/${report.summary.yandexBatches} batches ✅`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(50));

    // Save report
    const reportPath = path.join(__dirname, '../AUTO-SEARCH-CONSOLE-UPDATE-REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n✅ Report saved: ${reportPath}`);

    console.log('\n✅ Search console update COMPLETE');
    console.log('Arama motorları 24-48 saat içinde güncellenecektir.');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Search console update failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { submitToGoogle, submitToBing, submitToYandex };
