import { test, expect } from '@playwright/test';

test.describe('Production Smoke Test - Lydian IQ v2.0', () => {
  test('www.ailydian.com loads successfully', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com');
    expect(response?.status()).toBe(200);
  });

  test('Lydian IQ kabuğu temel bileşenleri gösteriyor', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/LyDian IQ Ultra/i);
    await expect(page.locator('h1')).toContainText(/LyDian IQ Ultra/i);
    await expect(page.locator('#languageSelector')).toBeVisible();
    const chipCount = await page.locator('.suggestion-chip').count();
    expect(chipCount).toBeGreaterThan(0);
    await expect(page.locator('#composerInput')).toBeVisible();
  });

  test('No console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('https://www.ailydian.com/lydian-iq');
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Service Worker') &&
      !err.includes('X-Frame-Options may only be set') &&
      !err.includes('Failed to load resource') &&
      !err.includes('Failed to load menu data') &&
      !err.includes('Failed to load translations')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Security headers present', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com/lydian-iq');
    const headers = response?.headers();

    expect(headers?.['strict-transport-security']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    const xfo = headers?.['x-frame-options'];
    expect(['SAMEORIGIN', 'DENY']).toContain(xfo);
    expect(headers?.['x-xss-protection']).toBeTruthy();
  });

  test('Composer etkileşimi çalışıyor', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq');

    const composer = page.locator('#composerInput');
    await composer.fill('Test amaçlı bir sorgu giriyorum');
    await expect(page.locator('#sendButton')).toBeEnabled();
  });
});
