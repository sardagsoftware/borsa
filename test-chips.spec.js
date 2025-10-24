const { test, expect } = require('@playwright/test');

test('suggestion chips should work', async ({ page }) => {
  // Listen to console
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  
  await page.goto('http://localhost:3100/lydian-iq.html');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  // Check suggestion chips exist
  const chips = await page.locator('.suggestion-chip');
  const count = await chips.count();
  console.log(`Found ${count} chips`);
  expect(count).toBeGreaterThan(0);
  
  // Get first chip's data-example
  const firstChip = chips.first();
  const example = await firstChip.getAttribute('data-example');
  console.log('Example:', example);
  
  // Click first chip
  await firstChip.click();
  
  // Check input value
  const input = page.locator('#composerInput');
  const value = await input.inputValue();
  console.log('Input value:', value);
  
  expect(value).toBe(example);
});
