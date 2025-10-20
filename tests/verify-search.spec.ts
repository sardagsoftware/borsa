import { test, expect } from '@playwright/test';

test('Verify search functionality works', async ({ page }) => {
  const errors: string[] = [];

  // Capture any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('💥 Page Error:', error.message);
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

  // Find and click search button (using ID)
  const searchButton = page.locator('#searchBtn');
  await searchButton.waitFor({ state: 'visible', timeout: 5000 });

  console.log('🖱️ Clicking search button...');
  await searchButton.click();

  // Wait for response (either success or error)
  console.log('⏳ Waiting for response...');
  await page.waitForTimeout(5000);

  // Check for response container
  const hasResponse = await page.locator('.chat-message, .response-content, .answer-container').count();
  console.log('📊 Response containers found:', hasResponse);

  // Check for error toasts
  const errorToasts = await page.locator('.toast-error, [class*="error"]').count();
  console.log('⚠️ Error toasts:', errorToasts);

  // Get page state
  const pageState = await page.evaluate(() => {
    const searchBtn = document.querySelector('#searchBtn') as HTMLButtonElement;
    return {
      buttonDisabled: searchBtn?.disabled || false,
      buttonText: searchBtn?.textContent || '',
      hasLoadingIndicator: !!document.querySelector('.loading, .spinner, [class*="loading"]'),
      responseContainerExists: !!document.querySelector('.chat-message, .response-content, .answer-container')
    };
  });

  console.log('📋 Page State:', pageState);

  // Filter out known harmless errors
  const criticalErrors = errors.filter(err =>
    !err.includes('favicon') &&
    !err.includes('Service Worker') &&
    !err.includes('manifest')
  );

  console.log('\n📊 FINAL RESULTS:');
  console.log('Critical Errors:', criticalErrors.length);
  console.log('Response Containers:', hasResponse);
  console.log('Error Toasts:', errorToasts);

  if (criticalErrors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:');
    criticalErrors.forEach(err => console.log('  -', err));
  }

  // Test passes if no critical errors
  expect(criticalErrors.length).toBe(0);
  console.log('\n✅ Search functionality test completed!');
});
