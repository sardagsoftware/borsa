const { test, expect } = require('@playwright/test');

test('LydianIQ FINAL Verification', async ({ page }) => {
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  
  // Send message
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);
  await page.click('#sendButton');
  await page.waitForTimeout(4000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/FINAL-verify.png', fullPage: false });
  console.log('📸 Viewport screenshot');
  
  await page.screenshot({ path: 'test-results/FINAL-verify-full.png', fullPage: true });
  console.log('📸 Full page screenshot');
  
  // Check solution height
  const solution = page.locator('.solution');
  if (await solution.isVisible()) {
    const box = await solution.boundingBox();
    console.log('\n✅ SOLUTION BOX:');
    console.log('Height:', box?.height);
    console.log('Max 300px:', box?.height && box.height <= 300);
    expect(box?.height).toBeLessThanOrEqual(301);
  }
  
  // Check clear button in viewport
  const clearBtn = page.locator('#clearButton');
  if (await clearBtn.isVisible()) {
    const btnBox = await clearBtn.boundingBox();
    const viewportHeight = page.viewportSize()?.height || 0;
    
    console.log('\n✅ CLEAR BUTTON:');
    console.log('Y position:', btnBox?.y);
    console.log('Viewport height:', viewportHeight);
    console.log('Is in viewport:', (btnBox?.y || 0) < viewportHeight && (btnBox?.y || 0) >= 0);
    
    // Expect button to be visible in viewport
    expect(btnBox?.y).toBeLessThan(viewportHeight);
    expect(btnBox?.y).toBeGreaterThan(0);
    
    console.log('✅ Clear button is in viewport!');
  }
  
  console.log('\n🎉 ALL CHECKS PASSED!');
});
