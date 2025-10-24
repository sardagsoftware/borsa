const { test, expect } = require('@playwright/test');

test('LydianIQ Dev Smoke - Sorun Tespiti', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('❌ CONSOLE ERROR:', msg.text());
  });
  
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  
  // Initial state
  await page.screenshot({ path: 'test-results/smoke-1-initial.png', fullPage: true });
  console.log('📸 1. Initial state');
  
  // Click suggestion chip
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);
  
  // Send message
  await page.click('#sendButton');
  await page.waitForTimeout(4000);
  
  // After response
  await page.screenshot({ path: 'test-results/smoke-2-after-response.png', fullPage: true });
  console.log('📸 2. After response');
  
  // Check solution box height
  const solution = page.locator('.solution');
  if (await solution.isVisible()) {
    const box = await solution.boundingBox();
    console.log('\n⚠️ SOLUTION BOX:');
    console.log('Height:', box?.height);
    console.log('Max-height should be:', '400-500px');
    if ((box?.height || 0) > 600) {
      console.log('❌ TOO TALL! Needs max-height limit');
    }
  }
  
  // Check clear button position
  const clearBtn = page.locator('#clearButton');
  if (await clearBtn.isVisible()) {
    const btnBox = await clearBtn.boundingBox();
    const viewportHeight = page.viewportSize()?.height || 0;
    
    console.log('\n⚠️ CLEAR BUTTON:');
    console.log('Y position:', btnBox?.y);
    console.log('Viewport height:', viewportHeight);
    console.log('Distance from bottom:', viewportHeight - (btnBox?.y || 0));
    
    await clearBtn.screenshot({ path: 'test-results/smoke-3-clear-button.png' });
    console.log('📸 3. Clear button');
  } else {
    console.log('❌ Clear button NOT VISIBLE');
  }
  
  // Check if content is scrollable
  const messages = page.locator('.messages');
  const scrollHeight = await messages.evaluate(el => el.scrollHeight);
  const clientHeight = await messages.evaluate(el => el.clientHeight);
  
  console.log('\n⚠️ SCROLL INFO:');
  console.log('Scroll height:', scrollHeight);
  console.log('Client height:', clientHeight);
  console.log('Is scrollable:', scrollHeight > clientHeight);
  
  // Full page screenshot
  await page.screenshot({ path: 'test-results/smoke-4-fullpage.png', fullPage: true });
  console.log('📸 4. Full page');
  
  console.log('\n✅ Smoke test complete - check screenshots');
});
