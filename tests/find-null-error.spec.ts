import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://www.ailydian.com';

test.use({ timeout: 60000 });

test('Find null textContent error with stack trace', async ({ page }) => {
  console.log('\n🔍 HUNTING NULL TEXT CONTENT ERROR');
  console.log('='.repeat(70));

  const errors: Array<{message: string, stack?: string, line?: number}> = [];

  // Capture all page errors with stack traces
  page.on('pageerror', error => {
    console.log(`\n❌ PAGE ERROR CAUGHT:`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Stack:\n${error.stack}`);

    errors.push({
      message: error.message,
      stack: error.stack,
    });
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`\n❌ CONSOLE ERROR: ${msg.text()}`);
    }
  });

  console.log('\n📍 Navigating to medical-expert.html...');
  await page.goto(`${PRODUCTION_URL}/medical-expert.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('✅ Page loaded');

  // Wait a bit for init() to run
  await page.waitForTimeout(5000);

  console.log(`\n📊 CAPTURED ${errors.length} PAGE ERRORS:`);
  errors.forEach((err, idx) => {
    console.log(`\n[${idx + 1}] ${err.message}`);
    if (err.stack) {
      // Try to extract line number
      const lineMatch = err.stack.match(/:(\d+):\d+/);
      if (lineMatch) {
        console.log(`   🎯 Line: ${lineMatch[1]}`);
      }
      console.log(`   Stack: ${err.stack.substring(0, 500)}`);
    }
  });

  if (errors.length > 0) {
    console.log(`\n✅ Found ${errors.length} errors - check output above for details`);
  } else {
    console.log(`\n🎉 NO ERRORS FOUND!`);
  }
});
