import { test, expect } from '@playwright/test';

test('Test all search modes functionality', async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
    errors.push(error.message);
  });

  console.log('🔍 Loading Lydian IQ page...\n');
  await page.goto('https://www.ailydian.com/lydian-iq');
  await page.waitForTimeout(2000);

  console.log('📝 Page loaded, checking search input...\n');

  // Check if search input exists
  const searchInput = page.locator('#searchInput');
  await expect(searchInput).toBeVisible();
  console.log('✅ Search input found\n');

  // Test Web Search Mode
  console.log('🌐 Testing Web Search mode...');
  const webMode = page.locator('[data-mode="web"]');
  await webMode.click();
  await page.waitForTimeout(500);

  await searchInput.fill('React hooks test');
  await page.waitForTimeout(500);

  const searchBtn = page.locator('button:has-text("Ara")');
  await searchBtn.click();

  console.log('⏳ Waiting for web search response...');

  // Wait for response or error (max 30 seconds)
  try {
    await page.waitForSelector('.message.assistant, .error-message', { timeout: 30000 });
    const response = await page.locator('.message.assistant, .error-message').first().textContent();
    console.log('📨 Web Search Response:', response?.substring(0, 200));
  } catch (e) {
    console.log('❌ Web Search timeout or no response');
  }

  await page.waitForTimeout(2000);

  // Check for network errors
  const networkErrors = await page.evaluate(() => {
    return (window as any).__networkErrors || [];
  });

  if (networkErrors.length > 0) {
    console.log('\n🌐 Network Errors:', networkErrors);
  }

  if (errors.length > 0) {
    console.log('\n❌ Total Errors:', errors.length);
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  } else {
    console.log('\n✅ No errors detected');
  }

  console.log('\n📊 Total console messages:', consoleMessages.length);
});
