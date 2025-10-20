import { test, expect, chromium } from '@playwright/test';

// Override config to not start web server
test.use({
  baseURL: 'https://www.ailydian.com'
});

test('Verify search works on live site', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: string[] = [];

  // Capture errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known harmless errors
      if (!text.includes('favicon') &&
          !text.includes('Service Worker') &&
          !text.includes('manifest') &&
          !text.includes('Chat history')) {
        errors.push(text);
        console.log('❌ Console Error:', text);
      }
    }
  });

  console.log('🌐 Opening Lydian IQ page...');
  await page.goto('https://www.ailydian.com/lydian-iq');
  await page.waitForLoadState('networkidle');
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
  await page.waitForTimeout(5000);

  // Check for response container
  const hasResponse = await page.locator('.chat-message, .response-content, .answer-container').count();
  console.log('📊 Response containers found:', hasResponse);

  // Check for error toasts
  const errorToasts = await page.locator('.toast-error, [class*="error"]').count();
  console.log('⚠️ Error toasts:', errorToasts);

  console.log('\n📊 FINAL RESULTS:');
  console.log('Critical Errors:', errors.length);
  console.log('Response Containers:', hasResponse);
  console.log('Error Toasts:', errorToasts);

  if (errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:');
    errors.forEach(err => console.log('  -', err));
  }

  // Cleanup
  await browser.close();

  // Test passes if no critical errors and we have a response
  expect(errors.length).toBe(0);
  expect(hasResponse).toBeGreaterThan(0);

  console.log('\n✅ Search functionality verified successfully!');
});
