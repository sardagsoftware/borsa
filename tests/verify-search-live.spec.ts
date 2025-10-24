import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://www.ailydian.com' });

test('Live Lydian IQ composer etkileşimi', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') &&
          !text.includes('Service Worker') &&
          !text.includes('manifest') &&
          !text.includes('Failed to load resource') &&
          !text.includes('Failed to load translations')) {
        errors.push(text);
      }
    }
  });

  await page.goto('/lydian-iq');
  await page.waitForLoadState('domcontentloaded');

  const composer = page.locator('#composerInput');
  await expect(composer).toBeVisible();

  const chips = page.locator('.suggestion-chip');
  await expect(chips.first()).toBeVisible();

  const before = await composer.inputValue();
  await chips.first().click();
  const after = await composer.inputValue();

  expect(after.trim().length).toBeGreaterThan(before.trim().length);
  await expect(page.locator('#sendButton')).toBeEnabled();

  expect(errors.length).toBe(0);
});
