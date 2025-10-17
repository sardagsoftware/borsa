import { test } from '@playwright/test';

test('Get detailed error location', async ({ page }) => {
  // Capture page errors with full stack trace
  page.on('pageerror', error => {
    console.log('\n💥 DETAILED PAGE ERROR:');
    console.log('Message:', error.message);
    console.log('\nFull Stack:');
    console.log(error.stack);
    console.log('\n' + '='.repeat(80));
  });

  console.log('Loading: https://www.ailydian.com/lydian-iq\n');

  try {
    await page.goto('https://www.ailydian.com/lydian-iq', {
      waitUntil: 'domcontentloaded'
    });
  } catch (e) {
    console.log('Navigation error:', e);
  }

  await page.waitForTimeout(3000);

  // Try to get error from window.onerror
  const runtimeErrors = await page.evaluate(() => {
    return (window as any).__runtimeErrors || [];
  });

  if (runtimeErrors.length > 0) {
    console.log('\nRuntime Errors:', runtimeErrors);
  }
});
