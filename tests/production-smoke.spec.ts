import { test, expect } from '@playwright/test';

test.describe('Production Smoke Test - Lydian IQ v2.0', () => {
  test('www.ailydian.com loads successfully', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com');
    expect(response?.status()).toBe(200);
  });

  test('Lydian IQ page loads with enhancements', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq');

    // Check page title
    await expect(page).toHaveTitle(/Lydian-IQ/i);

    // Check enhancement script loaded
    const enhancementScript = await page.evaluate(() => {
      return typeof window.LydianEnhancements !== 'undefined';
    });
    expect(enhancementScript).toBeTruthy();

    // Check connector data loader
    const connectorLoader = await page.evaluate(() => {
      return typeof window.lydianConnectorLoader !== 'undefined';
    });
    expect(connectorLoader).toBeTruthy();

    // Check analytics
    const analytics = await page.evaluate(() => {
      return typeof window.lydianAnalytics !== 'undefined';
    });
    expect(analytics).toBeTruthy();

    // Check chat history
    const chatHistory = await page.evaluate(() => {
      return typeof window.lydianChatHistory !== 'undefined';
    });
    expect(chatHistory).toBeTruthy();
  });

  test('Enhanced JS loads successfully', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com/js/lydian-iq-enhanced.js');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('javascript');
  });

  test('Connectors JSON loads successfully', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com/data/connectors.json');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('json');

    const json = await response?.json();
    expect(json.totalConnectors).toBe(72);
    expect(Object.keys(json.countries).length).toBeGreaterThan(0);
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

    // Filter out known benign errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Service Worker')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Security headers present', async ({ page }) => {
    const response = await page.goto('https://www.ailydian.com/lydian-iq');
    const headers = response?.headers();

    expect(headers?.['strict-transport-security']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers?.['x-xss-protection']).toBeTruthy();
  });

  test('Search modes work', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq');

    // Check mode chips exist
    const webMode = page.locator('[data-mode="web"]');
    const lydianMode = page.locator('[data-mode="lydian-iq"]');
    const connectorMode = page.locator('[data-mode="connector"]');

    await expect(webMode).toBeVisible();
    await expect(lydianMode).toBeVisible();
    await expect(connectorMode).toBeVisible();
  });

  test('Keyboard shortcuts registered', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq');

    const searchInput = page.locator('#searchInput');

    // Test Ctrl+K shortcut
    await page.keyboard.press('Control+k');
    await expect(searchInput).toBeFocused();
  });

  test('Connector carousel initializes', async ({ page }) => {
    await page.goto('https://www.ailydian.com/lydian-iq');

    const connectorBtn = page.locator('.connector-toggle-btn');
    await expect(connectorBtn).toBeVisible();
    await expect(connectorBtn).toContainText('72');
  });
});
