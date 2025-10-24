const { test, expect } = require('@playwright/test');

test('LydianIQ Visual Design Test', async ({ page }) => {
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/lydian-iq-initial.png', fullPage: true });
  console.log('✅ Initial screenshot saved');
  
  // Click first suggestion chip to fill input
  const firstChip = page.locator('.suggestion-chip').first();
  await firstChip.click();
  await page.waitForTimeout(500);
  
  // Take screenshot after chip click
  await page.screenshot({ path: 'test-results/lydian-iq-after-chip.png', fullPage: true });
  console.log('✅ After chip click screenshot saved');
  
  // Simulate sending a message (but API might fail - that's ok for visual test)
  await page.click('#sendButton');
  await page.waitForTimeout(3000); // Wait for response or error
  
  // Take screenshot after send
  await page.screenshot({ path: 'test-results/lydian-iq-after-send.png', fullPage: true });
  console.log('✅ After send screenshot saved');
  
  // Check visual elements
  const header = page.locator('.header');
  await expect(header).toBeVisible();
  
  const messages = page.locator('.messages');
  await expect(messages).toBeVisible();
  
  const composer = page.locator('.composer');
  await expect(composer).toBeVisible();
  
  // Check if error message appeared
  const errorMsg = page.locator('.error-message');
  if (await errorMsg.isVisible()) {
    console.log('⚠️ Error message is visible');
    
    // Take focused screenshot of error
    await errorMsg.screenshot({ path: 'test-results/lydian-iq-error-box.png' });
    console.log('✅ Error box screenshot saved');
  }
  
  // Check if clear button appeared
  const clearBtn = page.locator('#clearButton');
  if (await clearBtn.isVisible()) {
    console.log('✅ Clear button is visible');
  }
  
  console.log('\n📸 All screenshots saved in test-results/');
});
