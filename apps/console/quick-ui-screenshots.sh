#!/usr/bin/env bash
set -euo pipefail
echo "📸 Quick UI Screenshots"

BASE_URL="http://localhost:3100"
OUT_DIR="reports/ui/screens"
mkdir -p "$OUT_DIR"

# Check if puppeteer is installed
if [ ! -d "node_modules/puppeteer" ]; then
  echo "Installing puppeteer..."
  npm i -D puppeteer@22.15.0 >/dev/null 2>&1 || pnpm add -D puppeteer@22.15.0 >/dev/null 2>&1
fi

# Create minimal screenshot script
cat > .tmp-screenshot.js <<'JS'
const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  { id: 'story', url: 'http://localhost:3100/story' },
  { id: 'liveops-s2', url: 'http://localhost:3100/liveops/s2' },
  { id: 'kpis', url: 'http://localhost:3100/kpis' }
];

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 864 });
  
  for (const p of pages) {
    console.log(`📸 Capturing ${p.id}...`);
    try {
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.screenshot({ 
        path: path.join('reports/ui/screens', `${p.id}-tr.png`),
        fullPage: true 
      });
      console.log(`  ✅ ${p.id}-tr.png`);
    } catch (err) {
      console.error(`  ❌ ${p.id}: ${err.message}`);
    }
  }
  
  await browser.close();
  console.log('✅ Screenshots complete!');
})();
JS

node .tmp-screenshot.js
