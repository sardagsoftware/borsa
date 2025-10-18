import { test } from '@playwright/test';

test('Debug search UI structure', async ({ page }) => {
  console.log('🌐 Opening Lydian IQ page...');
  await page.goto('https://www.ailydian.com/lydian-iq');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/lydian-iq-ui.png', fullPage: false });
  console.log('📸 Screenshot saved to test-results/lydian-iq-ui.png');

  // Get all button texts
  const buttons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    return allButtons.map(btn => ({
      text: btn.textContent?.trim() || '',
      type: btn.type,
      id: btn.id,
      className: btn.className,
      visible: btn.offsetParent !== null
    }));
  });

  console.log('\n🔘 All buttons on page:');
  buttons.forEach((btn, i) => {
    if (btn.visible) {
      console.log(`  ${i + 1}. "${btn.text}" (type: ${btn.type}, id: ${btn.id})`);
    }
  });

  // Get all input fields
  const inputs = await page.evaluate(() => {
    const allInputs = Array.from(document.querySelectorAll('input, textarea'));
    return allInputs.map(input => ({
      type: (input as HTMLInputElement).type,
      placeholder: (input as HTMLInputElement).placeholder,
      id: input.id,
      className: input.className,
      visible: input.offsetParent !== null
    }));
  });

  console.log('\n📝 All input fields on page:');
  inputs.forEach((input, i) => {
    if (input.visible) {
      console.log(`  ${i + 1}. type: ${input.type}, placeholder: "${input.placeholder}"`);
    }
  });

  // Get search form structure
  const searchForm = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return null;

    return {
      hasForm: true,
      inputs: Array.from(form.querySelectorAll('input')).length,
      buttons: Array.from(form.querySelectorAll('button')).length,
      submitButton: form.querySelector('[type="submit"]') ? 'found' : 'not found'
    };
  });

  console.log('\n📋 Search form structure:', searchForm);

  // Get main search container structure
  const searchContainer = await page.evaluate(() => {
    const container = document.querySelector('.search-container, #search-container, [class*="search"]');
    if (!container) return null;

    return {
      found: true,
      html: container.innerHTML.substring(0, 500) // First 500 chars
    };
  });

  console.log('\n🔍 Search container HTML preview:');
  if (searchContainer) {
    console.log(searchContainer.html);
  }
});
