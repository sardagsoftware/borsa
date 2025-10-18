const { chromium } = require('playwright');

async function verifySearch() {
  console.log('🚀 Starting search verification...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  // Capture errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known harmless errors
      if (!text.includes('favicon') &&
          !text.includes('Service Worker') &&
          !text.includes('manifest') &&
          !text.includes('Invalid response provided')) {
        errors.push(text);
        console.log('❌ Console Error:', text);
      }
    }
  });

  try {
    console.log('🌐 Opening Lydian IQ page...');
    await page.goto('https://www.ailydian.com/lydian-iq', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    console.log('🔍 Testing Web Search mode...');

    // Find and fill search input
    const searchInput = page.locator('input[placeholder*="ara"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill('React hooks nedir');

    console.log('✅ Search input filled');

    // Find and click search button
    const searchButton = page.locator('#searchBtn');
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });

    console.log('🖱️ Clicking search button...');
    await searchButton.click();

    // Wait for response
    console.log('⏳ Waiting for response...');
    await page.waitForTimeout(6000);

    // Check for response container
    const hasResponse = await page.locator('.chat-message, .response-content, .answer-container').count();
    console.log('📊 Response containers found:', hasResponse);

    // Check for error toasts
    const errorToasts = await page.locator('.toast-error').count();
    console.log('⚠️ Error toasts:', errorToasts);

    // Take screenshot
    await page.screenshot({ path: 'test-results/search-result.png', fullPage: false });
    console.log('📸 Screenshot saved to test-results/search-result.png');

    console.log('\n📊 FINAL RESULTS:');
    console.log('Critical Errors:', errors.length);
    console.log('Response Containers:', hasResponse);
    console.log('Error Toasts:', errorToasts);

    if (errors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS:');
      errors.forEach(err => console.log('  -', err));
    }

    await browser.close();

    // Determine success
    if (errors.length === 0 && hasResponse > 0) {
      console.log('\n✅ ✅ ✅ SEARCH FUNCTIONALITY VERIFIED SUCCESSFULLY! ✅ ✅ ✅\n');
      process.exit(0);
    } else {
      console.log('\n❌ SEARCH VERIFICATION FAILED\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Error during verification:', error.message);
    await browser.close();
    process.exit(1);
  }
}

verifySearch();
