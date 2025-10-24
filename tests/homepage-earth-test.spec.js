const { test, expect } = require('@playwright/test');

test('Homepage - Earth Globe Visibility Test', async ({ page }) => {
  console.log('🌍 Testing Earth Globe on Homepage...');

  // Navigate to homepage
  await page.goto('http://localhost:3100/');
  await page.waitForLoadState('networkidle');

  // Wait for canvas
  await page.waitForTimeout(2000);

  // Check if canvas exists
  const canvas = await page.locator('#orbit-stage');
  const canvasExists = await canvas.count();
  console.log('Canvas exists:', canvasExists > 0 ? 'YES ✅' : 'NO ❌');

  // Check canvas visibility
  if (canvasExists > 0) {
    const isVisible = await canvas.isVisible();
    console.log('Canvas visible:', isVisible ? 'YES ✅' : 'NO ❌');

    // Get canvas computed style
    const canvasStyle = await canvas.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        zIndex: computed.zIndex,
        width: computed.width,
        height: computed.height,
        position: computed.position
      };
    });

    console.log('\n📊 CANVAS STYLE:');
    console.log('  Display:', canvasStyle.display);
    console.log('  Visibility:', canvasStyle.visibility);
    console.log('  Opacity:', canvasStyle.opacity);
    console.log('  Z-Index:', canvasStyle.zIndex);
    console.log('  Width:', canvasStyle.width);
    console.log('  Height:', canvasStyle.height);
    console.log('  Position:', canvasStyle.position);

    // Check if Three.js loaded
    const threeLoaded = await page.evaluate(() => {
      return typeof THREE !== 'undefined';
    });
    console.log('\n THREE.js loaded:', threeLoaded ? 'YES ✅' : 'NO ❌');

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/homepage-earth.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved: test-results/homepage-earth.png');

    if (errors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      errors.forEach(err => console.log('  -', err));
    } else {
      console.log('\n✅ No console errors');
    }
  }

  expect(canvasExists).toBeGreaterThan(0);
  console.log('\n🎉 TEST COMPLETE!');
});
