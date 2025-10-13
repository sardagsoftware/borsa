const puppeteer = require('puppeteer');

(async () => {
  console.log('📸 Capturing LiveOps...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 864 });
  
  try {
    await page.goto('http://localhost:3100/liveops/s2', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ 
      path: 'reports/ui/screens/liveops-s2-tr.png',
      fullPage: true 
    });
    console.log('✅ liveops-s2-tr.png captured!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
})();
