const { test, expect } = require('@playwright/test');

test('LyDian IQ - Inline Icon Buttons Test', async ({ page }) => {
  console.log('🧪 Testing inline icon buttons in metadata...');

  await page.goto('http://localhost:3100/lydian-iq.html');
  await page.waitForLoadState('networkidle');

  // Click suggestion and send
  await page.click('.suggestion-chip');
  await page.waitForTimeout(500);
  await page.click('#sendButton');
  await page.waitForTimeout(5000);

  // Check if big buttons are hidden
  const bigButtons = await page.locator('.action-buttons-container').count();
  console.log('\n📊 BIG BUTTONS CHECK:');
  console.log('  Big action-buttons-container count:', bigButtons);
  console.log('  Expected: 0 (should be hidden)');
  console.log('  Status:', bigButtons === 0 ? '✅ Hidden' : '❌ Still visible');

  // Check if metadata-info exists
  const metadataInfo = await page.locator('.metadata-info').count();
  console.log('\n📊 METADATA INFO:');
  console.log('  metadata-info count:', metadataInfo);
  console.log('  Status:', metadataInfo > 0 ? '✅ Exists' : '❌ Missing');

  // Check if metadata-actions exists
  const metadataActions = await page.locator('.metadata-actions').count();
  console.log('\n📊 METADATA ACTIONS:');
  console.log('  metadata-actions count:', metadataActions);
  console.log('  Status:', metadataActions > 0 ? '✅ Exists' : '❌ Missing');

  // Check if inline icon buttons exist
  const copyIcon = await page.locator('.copy-icon-btn').count();
  const shareIcon = await page.locator('.share-icon-btn').count();
  const clearIcon = await page.locator('.clear-icon-btn').count();

  console.log('\n📊 INLINE ICON BUTTONS:');
  console.log('  Copy icon button:', copyIcon, copyIcon > 0 ? '✅' : '❌');
  console.log('  Share icon button:', shareIcon, shareIcon > 0 ? '✅' : '❌');
  console.log('  Clear icon button:', clearIcon, clearIcon > 0 ? '✅' : '❌');

  // Check if icon buttons are visible
  if (copyIcon > 0) {
    const isVisible = await page.locator('.copy-icon-btn').first().isVisible();
    console.log('  Copy button visible:', isVisible ? '✅' : '❌');

    const box = await page.locator('.copy-icon-btn').first().boundingBox();
    if (box) {
      console.log('  Copy button size:', box.width.toFixed(0) + 'px × ' + box.height.toFixed(0) + 'px');
      console.log('  Expected: ~32px × 32px');
    }
  }

  // Take screenshot
  await page.screenshot({
    path: 'test-results/inline-icon-buttons.png',
    fullPage: false
  });
  console.log('\n📸 Screenshot saved: test-results/inline-icon-buttons.png');

  // Assertions
  expect(bigButtons).toBe(0); // Big buttons should be hidden
  expect(metadataInfo).toBeGreaterThan(0); // Metadata info should exist
  expect(metadataActions).toBeGreaterThan(0); // Metadata actions should exist
  expect(copyIcon).toBeGreaterThan(0); // Copy icon should exist
  expect(shareIcon).toBeGreaterThan(0); // Share icon should exist
  expect(clearIcon).toBeGreaterThan(0); // Clear icon should exist

  console.log('\n🎉 TEST COMPLETE!');
  console.log('✅ Big buttons hidden');
  console.log('✅ Inline icon buttons displayed in metadata');
});
