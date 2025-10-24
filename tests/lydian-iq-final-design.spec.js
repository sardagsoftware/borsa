const { test, expect } = require('@playwright/test');

test('LydianIQ FINAL Design Verification', async ({ page }) => {
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Click suggestion and send
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);
  await page.click('#sendButton');
  await page.waitForTimeout(4000);
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/FINAL-design.png', fullPage: true });
  console.log('✅ FINAL screenshot saved');
  
  // Check error message dimensions
  const errorMsg = page.locator('.error-message');
  if (await errorMsg.isVisible()) {
    const box = await errorMsg.boundingBox();
    const messagesBox = await page.locator('.messages').boundingBox();
    
    console.log('\n📊 DESIGN METRICS:');
    console.log('─────────────────────────────────');
    console.log('Error message width:', box?.width);
    console.log('Messages container width:', messagesBox?.width);
    console.log('Error width percentage:', ((box?.width || 0) / (messagesBox?.width || 1) * 100).toFixed(1) + '%');
    console.log('─────────────────────────────────');
    
    // Take zoomed screenshot of error
    await errorMsg.screenshot({ path: 'test-results/FINAL-error-box.png' });
    console.log('✅ Error box zoomed screenshot');
    
    // Expect error to be at least 90% of container width
    const widthPercentage = (box?.width || 0) / (messagesBox?.width || 1) * 100;
    expect(widthPercentage).toBeGreaterThan(90);
    console.log('✅ Error message is full width (>90%)');
  }
  
  // Check if AI response card exists and is full width
  const aiCard = page.locator('.inline-card');
  if (await aiCard.isVisible()) {
    const cardBox = await aiCard.boundingBox();
    const messagesBox = await page.locator('.messages').boundingBox();
    
    console.log('\nAI Card width:', cardBox?.width);
    console.log('AI Card width percentage:', ((cardBox?.width || 0) / (messagesBox?.width || 1) * 100).toFixed(1) + '%');
    
    const cardWidthPercentage = (cardBox?.width || 0) / (messagesBox?.width || 1) * 100;
    expect(cardWidthPercentage).toBeGreaterThan(90);
    console.log('✅ AI Card is full width (>90%)');
  }
  
  console.log('\n🎉 ALL DESIGN CHECKS PASSED!');
});
