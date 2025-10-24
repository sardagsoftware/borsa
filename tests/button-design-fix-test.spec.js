const { test, expect } = require('@playwright/test');

test('LyDian IQ - Enlarged Action Buttons Verification', async ({ page }) => {
  console.log('🧪 Starting button design verification test...');

  // Navigate to the page
  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Click on a suggestion chip to send a message
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);

  // Click send button
  await page.click('#sendButton');
  console.log('✅ Message sent, waiting for response...');

  // Wait for response (action buttons appear after response)
  await page.waitForTimeout(5000);

  // Take full page screenshot
  await page.screenshot({
    path: 'test-results/enlarged-buttons-test.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved: test-results/enlarged-buttons-test.png');

  // Verify action buttons exist
  const copyButton = page.locator('#copyButton');
  const shareButton = page.locator('#shareButton');
  const clearButton = page.locator('#clearButton');

  // Check visibility
  const copyVisible = await copyButton.isVisible();
  const shareVisible = await shareButton.isVisible();
  const clearVisible = await clearButton.isVisible();

  console.log('\n📊 BUTTON VISIBILITY:');
  console.log('  Copy Button (Blue):', copyVisible ? '✅ Visible' : '❌ Not Visible');
  console.log('  Share Button (Green):', shareVisible ? '✅ Visible' : '❌ Not Visible');
  console.log('  Clear Button (Red):', clearVisible ? '✅ Visible' : '❌ Not Visible');

  // Get button dimensions
  if (copyVisible) {
    const copyBox = await copyButton.boundingBox();
    console.log('\n📏 COPY BUTTON DIMENSIONS:');
    console.log('  Width:', Math.round(copyBox?.width || 0), 'px');
    console.log('  Height:', Math.round(copyBox?.height || 0), 'px');
    console.log('  Expected: min-width 150px, padding 18px 36px');

    // Verify button is large enough
    expect(copyBox?.width).toBeGreaterThan(140);
    expect(copyBox?.height).toBeGreaterThan(50);
    console.log('  ✅ Button size is adequate!');
  }

  if (shareVisible) {
    const shareBox = await shareButton.boundingBox();
    console.log('\n📏 SHARE BUTTON DIMENSIONS:');
    console.log('  Width:', Math.round(shareBox?.width || 0), 'px');
    console.log('  Height:', Math.round(shareBox?.height || 0), 'px');
  }

  if (clearVisible) {
    const clearBox = await clearButton.boundingBox();
    console.log('\n📏 CLEAR BUTTON DIMENSIONS:');
    console.log('  Width:', Math.round(clearBox?.width || 0), 'px');
    console.log('  Height:', Math.round(clearBox?.height || 0), 'px');

    // Check position
    const viewportHeight = page.viewportSize()?.height || 0;
    const isInViewport = await clearButton.isInViewport();

    console.log('\n📍 BUTTON POSITIONING:');
    console.log('  Y Position:', Math.round(clearBox?.y || 0), 'px');
    console.log('  Viewport Height:', viewportHeight, 'px');
    console.log('  In Viewport:', isInViewport ? '✅ Yes' : '❌ No');

    if (!isInViewport) {
      await clearButton.scrollIntoViewIfNeeded();
      const nowVisible = await clearButton.isInViewport();
      console.log('  After scroll:', nowVisible ? '✅ Now visible' : '❌ Still not visible');
    }
  }

  // Test button styling
  const copyButtonStyle = await copyButton.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      background: computed.backgroundColor,
      padding: computed.padding,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      minWidth: computed.minWidth
    };
  });

  console.log('\n🎨 BUTTON STYLING:');
  console.log('  Background:', copyButtonStyle.background);
  console.log('  Padding:', copyButtonStyle.padding);
  console.log('  Font Size:', copyButtonStyle.fontSize);
  console.log('  Font Weight:', copyButtonStyle.fontWeight);
  console.log('  Min Width:', copyButtonStyle.minWidth);

  console.log('\n✅ Test assertions:');
  expect(copyVisible).toBe(true);
  expect(shareVisible).toBe(true);
  expect(clearVisible).toBe(true);
  console.log('  ✅ All buttons are visible');

  console.log('\n🎉 BUTTON DESIGN VERIFICATION COMPLETE!');
  console.log('📸 Check screenshot: test-results/enlarged-buttons-test.png');
});
