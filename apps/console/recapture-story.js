const puppeteer = require('puppeteer');

(async () => {
  console.log('📸 Recapturing Story page...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 864 });
  
  try {
    console.log('Navigating to /story...');
    await page.goto('http://localhost:3100/story', { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    console.log('Waiting for content to render...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: 'reports/ui/screens/story-tr.png',
      fullPage: true 
    });
    console.log('✅ story-tr.png recaptured!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
})();
