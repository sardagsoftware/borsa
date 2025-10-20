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
