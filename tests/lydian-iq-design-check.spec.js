const { test, expect } = require('@playwright/test');

test('LydianIQ Design Final Check', async ({ page }) => {
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/design-final-initial.png', fullPage: true });
  console.log('✅ Initial screenshot');
  
  // Click suggestion chip
  const firstChip = page.locator('.suggestion-chip').first();
  await firstChip.click();
  await page.waitForTimeout(500);
  
  // Send message
  await page.click('#sendButton');
  await page.waitForTimeout(4000); // Wait for response/error
  
  // Take full page screenshot
  await page.screenshot({ path: 'test-results/design-final-full.png', fullPage: true });
  console.log('✅ Full page screenshot saved');
  
  // Check error message width
  const errorMsg = page.locator('.error-message');
  if (await errorMsg.isVisible()) {
    const errorBox = await errorMsg.boundingBox();
    console.log('Error message width:', errorBox?.width);
    console.log('Error message height:', errorBox?.height);
    
    // Take screenshot of error
    await errorMsg.screenshot({ path: 'test-results/design-error-box.png' });
    console.log('✅ Error box screenshot');
  }
  
  // Check clear button
  const clearBtn = page.locator('#clearButton');
  if (await clearBtn.isVisible()) {
    const btnBox = await clearBtn.boundingBox();
    console.log('Clear button width:', btnBox?.width);
    console.log('Clear button x position:', btnBox?.x);
    
    await clearBtn.screenshot({ path: 'test-results/design-clear-btn.png' });
    console.log('✅ Clear button screenshot');
  }
  
  // Check composer width
  const composer = page.locator('.composer');
  const composerBox = await composer.boundingBox();
  console.log('Composer width:', composerBox?.width);
  
  // Check messages container width
  const messages = page.locator('.messages');
  const messagesBox = await messages.boundingBox();
  console.log('Messages width:', messagesBox?.width);
  
  console.log('\n📸 All design screenshots saved!');
});
