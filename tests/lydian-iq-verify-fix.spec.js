const { test, expect } = require('@playwright/test');

test('LydianIQ Verify Fix', async ({ page }) => {
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  
  // Send message
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);
  await page.click('#sendButton');
  await page.waitForTimeout(4000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/verify-fix.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Check solution height
  const solution = page.locator('.solution');
  if (await solution.isVisible()) {
    const box = await solution.boundingBox();
    console.log('\n✅ SOLUTION BOX:');
    console.log('Height:', box?.height);
    console.log('Max-height limit: 300px');
    expect(box?.height).toBeLessThanOrEqual(300);
    console.log('✅ Solution height is within limit!');
  }
  
  // Check clear button visibility
  const clearBtn = page.locator('#clearButton');
  if (await clearBtn.isVisible()) {
    const btnBox = await clearBtn.boundingBox();
    const viewportHeight = page.viewportSize()?.height || 0;
    
    console.log('\n✅ CLEAR BUTTON:');
    console.log('Y position:', btnBox?.y);
    console.log('Viewport height:', viewportHeight);
    console.log('Is within viewport:', (btnBox?.y || 0) < viewportHeight);
    
    // Check if button is visible in viewport
    const isInViewport = await clearBtn.isInViewport();
    console.log('Is in viewport:', isInViewport);
    
    if (!isInViewport) {
      // Scroll to button
      await clearBtn.scrollIntoViewIfNeeded();
      console.log('Scrolled to clear button');
      
      // Check again
      const isVisibleNow = await clearBtn.isInViewport();
      console.log('Visible after scroll:', isVisibleNow);
    } else {
      console.log('✅ Clear button is visible without scrolling!');
    }
  } else {
    console.log('❌ Clear button not visible');
  }
  
  // Check total content height
  const messages = page.locator('.messages');
  const scrollHeight = await messages.evaluate(el => el.scrollHeight);
  const clientHeight = await messages.evaluate(el => el.clientHeight);
  
  console.log('\n✅ CONTENT METRICS:');
  console.log('Scroll height:', scrollHeight);
  console.log('Client height:', clientHeight);
  console.log('Content fits in view:', scrollHeight <= clientHeight + 200);
  
  console.log('\n🎉 VERIFICATION COMPLETE!');
});
