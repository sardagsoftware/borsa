import { test, expect } from '@playwright/test';

test('Lydian IQ composer temel fonksiyonlarını gösteriyor', async ({ page }) => {
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

  await page.goto('https://www.ailydian.com/lydian-iq');
  await page.waitForLoadState('domcontentloaded');

  const composer = page.locator('#composerInput');
  await expect(composer).toBeVisible();

  const firstChip = page.locator('.suggestion-chip').first();
  await expect(firstChip).toBeVisible();
  await firstChip.click();

  const value = await composer.inputValue();
  expect(value.trim().length).toBeGreaterThan(0);

  const sendButton = page.locator('#sendButton');
  await expect(sendButton).toBeEnabled();

  expect(errors.length).toBe(0);
});
