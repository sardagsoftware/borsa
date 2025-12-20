/**
 * 🤖 AUTO SEO MONITOR - 7/24 SEO OTOMASYONU
 * ==========================================
 *
 * Otomatik SEO izleme ve güncelleme sistemi
 * - IndexNow protokolü entegrasyonu
 * - Gerçek zamanlı arama motoru bildirimleri
 * - Duplicate detection & auto-fix
 * - Keyword optimization
 * - Sitemap auto-update
 *
 * BEYAZ ŞAPKA - GOOGLE/BING/YANDEX STANDARTLARI
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// IndexNow configuration
const INDEXNOW_CONFIG = {
  key: process.env.INDEXNOW_KEY || crypto.randomBytes(32).toString('hex'),
  keyLocation: 'https://www.ailydian.com/indexnow-key.txt',
  endpoints: {
    bing: 'https://www.bing.com/indexnow',
    yandex: 'https://yandex.com/indexnow',
    seznam: 'https://search.seznam.cz/indexnow',
    naver: 'https://searchadvisor.naver.com/indexnow'
  }
};

// Search engines to notify
const SEARCH_ENGINES = [
  'https://www.bing.com/indexnow',
  'https://www.google.com/ping',
  'https://yandex.com/ping',
  'https://api.indexnow.org/indexnow'
];

/**
 * Submit URL to IndexNow protocol
 */
async function submitToIndexNow(url, searchEngine = 'bing') {
  const endpoint = INDEXNOW_CONFIG.endpoints[searchEngine] || INDEXNOW_CONFIG.endpoints.bing;

  const payload = {
    host: 'www.ailydian.com',
    key: INDEXNOW_CONFIG.key,
    keyLocation: INDEXNOW_CONFIG.keyLocation,
    urlList: Array.isArray(url) ? url : [url]
  };

  return new Promise((resolve, reject) => {
    const urlObj = new URL(endpoint);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'LyDian-SEO-Bot/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          resolve({ success: true, engine: searchEngine, status: res.statusCode });
        } else {
          reject(new Error(`IndexNow failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Notify all search engines about URL changes
 */
async function notifySearchEngines(urls) {
  const results = [];

  // Submit to IndexNow (Bing, Yandex, etc.)
  for (const engine of Object.keys(INDEXNOW_CONFIG.endpoints)) {
    try {
      const result = await submitToIndexNow(urls, engine);
      results.push(result);
      console.log(`✅ IndexNow submitted to ${engine}: ${result.status}`);
    } catch (error) {
      console.error(`❌ IndexNow failed for ${engine}:`, error.message);
      results.push({ success: false, engine, error: error.message });
    }
  }

  // Submit sitemap to Google
  try {
    await submitSitemapToGoogle();
    results.push({ success: true, engine: 'google', type: 'sitemap' });
  } catch (error) {
    console.error('❌ Google sitemap submission failed:', error.message);
  }

  return results;
}

/**
 * Submit sitemap to Google Search Console
 */
function submitSitemapToGoogle() {
  const sitemapUrl = 'https://www.ailydian.com/sitemap.xml';
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  return new Promise((resolve, reject) => {
    https.get(pingUrl, (res) => {
      if (res.statusCode === 200) {
        resolve({ success: true });
      } else {
        reject(new Error(`Google ping failed: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Detect duplicate meta descriptions
 */
function detectDuplicateMetadata(htmlFiles) {
  const descriptions = new Map();
  const titles = new Map();
  const duplicates = {
    descriptions: [],
    titles: []
  };

  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Extract meta description
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      const desc = descMatch[1];
      if (descriptions.has(desc)) {
        descriptions.get(desc).push(file);
      } else {
        descriptions.set(desc, [file]);
      }
    }

    // Extract title
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1];
      if (titles.has(title)) {
        titles.get(title).push(file);
      } else {
        titles.set(title, [file]);
      }
    }
  });

  // Find duplicates
  descriptions.forEach((files, desc) => {
    if (files.length > 1) {
      duplicates.descriptions.push({ description: desc, files });
    }
  });

  titles.forEach((files, title) => {
    if (files.length > 1) {
      duplicates.titles.push({ title, files });
    }
  });

  return duplicates;
}

/**
 * Auto-fix duplicate metadata
 */
function autoFixDuplicates(duplicates, seoEngine) {
  const fixes = [];

  // Fix duplicate descriptions
  duplicates.descriptions.forEach(dup => {
    dup.files.forEach((file, index) => {
      if (index > 0) { // Keep first, fix others
        const pagePath = file.replace(/^.*\/public/, '').replace('.html', '') || '/';
        const language = detectLanguageFromFile(file);
        const newMeta = seoEngine.generateSEOMetadata(pagePath, language);

        try {
          updateMetadata(file, newMeta);
          fixes.push({ file, type: 'description', status: 'fixed' });
        } catch (error) {
          fixes.push({ file, type: 'description', status: 'failed', error: error.message });
        }
      }
    });
  });

  // Fix duplicate titles
  duplicates.titles.forEach(dup => {
    dup.files.forEach((file, index) => {
      if (index > 0) {
        const pagePath = file.replace(/^.*\/public/, '').replace('.html', '') || '/';
        const language = detectLanguageFromFile(file);
        const newMeta = seoEngine.generateSEOMetadata(pagePath, language);

        try {
          updateTitle(file, newMeta.title);
          fixes.push({ file, type: 'title', status: 'fixed' });
        } catch (error) {
          fixes.push({ file, type: 'title', status: 'failed', error: error.message });
        }
      }
    });
  });

  return fixes;
}

/**
 * Detect language from file path
 */
function detectLanguageFromFile(filePath) {
  if (filePath.includes('/tr/')) return 'tr';
  if (filePath.includes('/en/')) return 'en';
  if (filePath.includes('/de/')) return 'de';
  if (filePath.includes('/ru/')) return 'ru';
  if (filePath.includes('/uk/')) return 'uk';
  if (filePath.includes('/zh/')) return 'zh';
  if (filePath.includes('/it/')) return 'it';
  return 'tr'; // Default
}

/**
 * Update metadata in HTML file
 */
function updateMetadata(filePath, metadata) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update description
  content = content.replace(
    /<meta\s+name="description"\s+content="[^"]*"/gi,
    `<meta name="description" content="${metadata.description}"`
  );

  // Update keywords
  content = content.replace(
    /<meta\s+name="keywords"\s+content="[^"]*"/gi,
    `<meta name="keywords" content="${metadata.keywords}"`
  );

  // Update OG description
  content = content.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"/gi,
    `<meta property="og:description" content="${metadata.description}"`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Update title in HTML file
 */
function updateTitle(filePath, title) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    /<title>[^<]*<\/title>/gi,
    `<title>${title}</title>`
  );

  content = content.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"/gi,
    `<meta property="og:title" content="${title}"`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(publicDir) {
  const baseUrl = 'https://www.ailydian.com';
  const htmlFiles = findHtmlFiles(publicDir);
  const languages = ['tr', 'en', 'de', 'ru', 'uk', 'zh', 'it'];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  htmlFiles.forEach(file => {
    const relativePath = file.replace(publicDir, '').replace('.html', '') || '/';

    // Add main URL
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${relativePath}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';

    // Add language alternates
    languages.forEach(lang => {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}/${lang}${relativePath}" />\n`;
    });

    xml += '  </url>\n';
  });

  xml += '</urlset>';

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');

  return sitemapPath;
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
 * Generate robots.txt
 */
function generateRobotsTxt(publicDir) {
  const content = `# LyDian AI - Robots.txt
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Sitemaps
Sitemap: https://www.ailydian.com/sitemap.xml
Sitemap: https://www.ailydian.com/sitemap-tr.xml
Sitemap: https://www.ailydian.com/sitemap-en.xml

# Crawl-delay for specific bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 0

User-agent: Yandex
Crawl-delay: 0

# Block backup and archive files
Disallow: /*.backup$
Disallow: /*.bak$
Disallow: /*-backup-*
Disallow: /.archive/
Disallow: /.backup/

# Block sensitive paths
Disallow: /api/
Disallow: /.env
Disallow: /node_modules/
`;

  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, content, 'utf8');

  return robotsPath;
}

/**
 * Run full SEO audit and auto-fix
 */
async function runFullSEOAudit(publicDir, seoEngine) {
  console.log('🔍 Starting full SEO audit...\n');

  const report = {
    timestamp: new Date().toISOString(),
    duplicates: null,
    fixes: [],
    sitemap: null,
    robots: null,
    indexnow: []
  };

  // 1. Detect duplicates
  const htmlFiles = findHtmlFiles(publicDir);
  report.duplicates = detectDuplicateMetadata(htmlFiles);
  console.log(`Found ${report.duplicates.descriptions.length} duplicate descriptions`);
  console.log(`Found ${report.duplicates.titles.length} duplicate titles\n`);

  // 2. Auto-fix duplicates
  if (report.duplicates.descriptions.length > 0 || report.duplicates.titles.length > 0) {
    report.fixes = autoFixDuplicates(report.duplicates, seoEngine);
    console.log(`✅ Fixed ${report.fixes.length} metadata issues\n`);
  }

  // 3. Generate sitemap
  report.sitemap = generateSitemap(publicDir);
  console.log(`✅ Generated sitemap: ${report.sitemap}\n`);

  // 4. Generate robots.txt
  report.robots = generateRobotsTxt(publicDir);
  console.log(`✅ Generated robots.txt: ${report.robots}\n`);

  // 5. Notify search engines
  const changedUrls = report.fixes.map(f => {
    const path = f.file.replace(publicDir, '').replace('.html', '') || '/';
    return `https://www.ailydian.com${path}`;
  });

  if (changedUrls.length > 0) {
    report.indexnow = await notifySearchEngines(changedUrls);
    console.log(`✅ Notified ${report.indexnow.length} search engines\n`);
  }

  return report;
}

module.exports = {
  submitToIndexNow,
  notifySearchEngines,
  detectDuplicateMetadata,
  autoFixDuplicates,
  generateSitemap,
  generateRobotsTxt,
  runFullSEOAudit,
  INDEXNOW_CONFIG
};
