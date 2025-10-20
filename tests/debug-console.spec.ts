import { test } from '@playwright/test';

test('Debug console errors on lydian-iq page', async ({ page }) => {
  const consoleMessages: any[] = [];
  const errors: any[] = [];
  const warnings: any[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    consoleMessages.push({ type, text, location });

    if (type === 'error') {
      errors.push({ text, location });
      console.log('❌ ERROR:', text);
      console.log('   Location:', location);
    } else if (type === 'warning') {
      warnings.push({ text, location });
      console.log('⚠️  WARNING:', text);
    } else if (type === 'log' || type === 'info') {
      console.log('ℹ️  LOG:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('💥 PAGE ERROR:', error.message);
    console.log('   Stack:', error.stack);
  });

  console.log('\n🔍 Loading page: https://www.ailydian.com/lydian-iq\n');

  await page.goto('https://www.ailydian.com/lydian-iq');

  // Wait for page to fully load
  await page.waitForTimeout(5000);

  console.log('\n📊 CONSOLE SUMMARY:');
  console.log('Total messages:', consoleMessages.length);
  console.log('Errors:', errors.length);
  console.log('Warnings:', warnings.length);

  if (errors.length > 0) {
    console.log('\n❌ ALL ERRORS:');
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.text}`);
      console.log(`   File: ${err.location.url}`);
      console.log(`   Line: ${err.location.lineNumber}:${err.location.columnNumber}`);
    });
  }

  // Check if enhancement objects exist
  const status = await page.evaluate(() => {
    return {
      errorBoundary: typeof window.lydianErrorBoundary !== 'undefined',
      chatHistory: typeof window.lydianChatHistory !== 'undefined',
      analytics: typeof window.lydianAnalytics !== 'undefined',
      connectorLoader: typeof window.lydianConnectorLoader !== 'undefined',
      sanitizer: typeof window.AilydianSanitizer !== 'undefined',
      DOMPurify: typeof window.DOMPurify !== 'undefined'
    };
  });

  console.log('\n🔧 GLOBAL OBJECTS STATUS:');
  console.log('DOMPurify:', status.DOMPurify ? '✅' : '❌');
  console.log('AilydianSanitizer:', status.sanitizer ? '✅' : '❌');
  console.log('lydianErrorBoundary:', status.errorBoundary ? '✅' : '❌');
  console.log('lydianChatHistory:', status.chatHistory ? '✅' : '❌');
  console.log('lydianAnalytics:', status.analytics ? '✅' : '❌');
  console.log('lydianConnectorLoader:', status.connectorLoader ? '✅' : '❌');
});
