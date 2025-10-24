const { test, expect } = require('@playwright/test');

test.describe('LydianIQ Full Test Suite', () => {
  
  test('Page loads successfully', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:3100/lydian-iq.html');
    await page.waitForLoadState('networkidle');
    
    // Check title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('LyDian IQ Ultra');
    
    // Check main elements exist
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('#messages')).toBeVisible();
    await expect(page.locator('#composerInput')).toBeVisible();
    await expect(page.locator('#sendButton')).toBeVisible();
    
    console.log('✅ Page loads successfully');
  });
  
  test('Suggestion chips work', async ({ page }) => {
    await page.goto('http://localhost:3100/lydian-iq.html');
    await page.waitForLoadState('networkidle');
    
    const chips = page.locator('.suggestion-chip');
    const count = await chips.count();
    expect(count).toBe(4);
    
    // Click first chip
    const firstChip = chips.first();
    const example = await firstChip.getAttribute('data-example');
    await firstChip.click();
    
    // Verify input value
    const value = await page.locator('#composerInput').inputValue();
    expect(value).toBe(example);
    
    console.log('✅ Suggestion chips work correctly');
  });
  
  test('Language selector works', async ({ page }) => {
    await page.goto('http://localhost:3100/lydian-iq.html');
    await page.waitForLoadState('networkidle');
    
    // Change to English
    await page.selectOption('#languageSelector', 'en');
    await page.waitForTimeout(500);
    
    // Check if welcome message changed
    const welcomeMsg = await page.locator('#welcomeMessage').textContent();
    console.log('Welcome message (EN):', welcomeMsg);
    expect(welcomeMsg).toContain('How can I help');
    
    // Change to Turkish
    await page.selectOption('#languageSelector', 'tr');
    await page.waitForTimeout(500);
    
    const welcomeMsgTR = await page.locator('#welcomeMessage').textContent();
    console.log('Welcome message (TR):', welcomeMsgTR);
    expect(welcomeMsgTR).toContain('nasıl yardımcı');
    
    console.log('✅ Language selector works correctly');
  });
  
  test('Composer input auto-resize', async ({ page }) => {
    await page.goto('http://localhost:3100/lydian-iq.html');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('#composerInput');
    
    // Type multiple lines
    await input.fill('Line 1\nLine 2\nLine 3\nLine 4');
    await page.waitForTimeout(300);
    
    // Check if height increased
    const height = await input.evaluate(el => el.offsetHeight);
    console.log('Input height after multiline:', height);
    expect(height).toBeGreaterThan(42); // min-height is 42px
    
    console.log('✅ Composer auto-resize works');
  });
  
  test('No JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto('http://localhost:3100/lydian-iq.html');
    await page.waitForLoadState('networkidle');
    
    // Interact with page
    await page.click('.suggestion-chip');
    await page.waitForTimeout(500);
    await page.selectOption('#languageSelector', 'en');
    await page.waitForTimeout(500);
    
    console.log('Total errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    expect(errors.length).toBe(0);
    console.log('✅ No JavaScript errors detected');
  });
  
});
