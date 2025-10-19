/**
 * TIER 1 SEO SMOKE TEST
 * Validates SEO implementation for 6 pages x 6 languages
 */

import { test, expect } from '@playwright/test';

const TIER1_PAGES = [
  { id: 'homepage', url: '/', file: 'index.html' },
  { id: 'lydian-iq', url: '/lydian-iq', file: 'lydian-iq.html' },
  { id: 'medical-expert', url: '/medical-expert', file: 'medical-expert.html' },
  { id: 'chat', url: '/chat', file: 'chat.html' },
  { id: 'legal-ai', url: '/legal-expert', file: 'legal-expert.html' },
  { id: 'advisor-hub', url: '/ai-advisor-hub', file: 'ai-advisor-hub.html' }
];

const LANGUAGES = ['tr', 'en', 'de', 'ar', 'ru', 'zh'];

test.describe('Tier 1 SEO Validation', () => {
  for (const page of TIER1_PAGES) {
    test(`${page.id}: Meta tags present`, async ({ page: p }) => {
      await p.goto(`http://localhost:3000${page.url}`);

      // Title check
      const title = await p.title();
      expect(title.length).toBeGreaterThan(30);
      expect(title.length).toBeLessThan(65);
      expect(title).toContain('LyDian');

      // Description check (80-165 chars is realistic for multi-language SEO)
      const description = await p.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(80);
      expect(description!.length).toBeLessThan(165);

      // Keywords check
      const keywords = await p.locator('meta[name="keywords"]').getAttribute('content');
      expect(keywords).toBeTruthy();

      // Open Graph tags
      const ogTitle = await p.locator('meta[property="og:title"]').getAttribute('content');
      const ogDesc = await p.locator('meta[property="og:description"]').getAttribute('content');
      const ogImage = await p.locator('meta[property="og:image"]').getAttribute('content');
      const ogType = await p.locator('meta[property="og:type"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDesc).toBeTruthy();
      expect(ogImage).toContain('/og-images/');
      expect(ogType).toBe('website');

      // Twitter Card tags
      const twitterCard = await p.locator('meta[name="twitter:card"]').getAttribute('content');
      const twitterTitle = await p.locator('meta[name="twitter:title"]').getAttribute('content');

      expect(twitterCard).toBe('summary_large_image');
      expect(twitterTitle).toBeTruthy();

      // GEO targeting tags
      const geoRegion = await p.locator('meta[name="geo.region"]').getAttribute('content');
      const geoPlacename = await p.locator('meta[name="geo.placename"]').getAttribute('content');
      const geoPosition = await p.locator('meta[name="geo.position"]').getAttribute('content');

      expect(geoRegion).toBeTruthy();
      expect(geoPlacename).toBeTruthy();
      expect(geoPosition).toMatch(/\d+\.\d+,\d+\.\d+/);

      // Canonical URL
      const canonical = await p.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('ailydian.com');

      // Alternate language links
      const alternates = await p.locator('link[rel="alternate"]').count();
      expect(alternates).toBeGreaterThanOrEqual(6);
    });

    test(`${page.id}: i18n files exist`, async () => {
      const fs = require('fs');
      const path = require('path');

      for (const lang of LANGUAGES) {
        const i18nPath = path.join(__dirname, `../public/locales/${lang}/${page.id}.json`);
        expect(fs.existsSync(i18nPath)).toBe(true);

        // Validate JSON structure
        const content = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'));
        expect(content.meta).toBeDefined();
        expect(content.meta.title).toBeTruthy();
        expect(content.meta.description).toBeTruthy();
        expect(content.meta.keywords).toBeTruthy();
        expect(content.seo).toBeDefined();
        expect(content.seo.og).toBeDefined();
        expect(content.seo.twitter).toBeDefined();
        expect(content.seo.geo).toBeDefined();
      }
    });
  }
});

test.describe('White-Hat SEO Compliance', () => {
  test('No keyword stuffing', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    const keywordCount = keywords?.split(',').length || 0;

    expect(keywordCount).toBeGreaterThan(3);
    expect(keywordCount).toBeLessThan(11);
  });

  test('No duplicate meta descriptions', async ({ page }) => {
    const descriptions = new Set();

    for (const p of TIER1_PAGES) {
      await page.goto(`http://localhost:3000${p.url}`);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(descriptions.has(desc)).toBe(false);
      descriptions.add(desc);
    }
  });

  test('Proper H1 structure', async ({ page }) => {
    for (const p of TIER1_PAGES) {
      await page.goto(`http://localhost:3000${p.url}`);
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    }
  });
});
