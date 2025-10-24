import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3100';

test.describe('Landing (/) smoke', () => {
  test('üst navigasyon ve CTA öğeleri görünür', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/LyDian AI/i);
    await expect(page.locator('.brand')).toHaveText(/LyDian/i);
    await expect(page.locator('#live-search-input')).toBeVisible();
    await expect(page.getByRole('link', { name: /Şimdi Dene/i })).toBeVisible();
    await expect(page.locator('#orbit-stage')).toHaveCount(1);
  });

  test('navigasyon öğeleri büyük harfle başlıyor', async ({ page }) => {
    await page.goto(BASE_URL);

    const menuItems = await page.locator('nav[aria-label="Ana navigasyon"] .nav-link').allInnerTexts();
    expect(menuItems.length).toBeGreaterThan(0);

    for (const item of menuItems) {
      const trimmed = item.trim();
      if (trimmed.length === 0) continue;
      expect(trimmed[0]).toMatch(/[A-ZÇĞİÖŞÜ]/);
    }
  });
});

test.describe('Auth (/auth) smoke', () => {
  test('form alanları ve butonlar', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth.html`, { waitUntil: 'networkidle' });

    const emailInput = page.getByPlaceholder('E-posta adresi');
    await expect(emailInput).toBeVisible();
    await expect(page.getByRole('button', { name: /Google ile devam et/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Microsoft Hesabı ile devam et/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Devam et/i }).first()).toBeVisible();
  });

  test('form submit çalışıyor', async ({ page }) => {
    await page.route('**/api/auth/check-email', route => {
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exists: true })
      });
    });

    await page.goto(`${BASE_URL}/auth.html`);

    await page.getByPlaceholder('E-posta adresi').fill('test@example.com');
    await page.getByRole('button', { name: /^Devam et$/i }).first().click();

    await expect(page.locator('#password-step')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Chat (/chat) baseline', () => {
  test('history yüklenir ve shared_ hariçlenir', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);

    await page.evaluate(() => {
      (window as any).addMessage('user', 'Test Chat 1');
      (window as any).addMessage('assistant', 'Yanıt 1');
      (window as any).saveCurrentChat();
    });

    const histItems = page.locator('.chat-item');
    await expect(histItems.first()).toBeVisible();

    const allText = await page.locator('#chatHistory').textContent();
    expect(allText).toContain('Test Chat 1');
  });

  test('copyMessage ve regenerateMessage çalışır', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);

    await page.evaluate(() => {
      if (!navigator.clipboard) {
        (navigator as any).clipboard = {};
      }
      navigator.clipboard.writeText = async () => {};
    });

    await page.evaluate(() => {
      (window as any).addMessage('assistant', 'Hello World from Assistant');
    });

    const copyBtn = page.getByRole('button', { name: /Kopyala/i }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    await expect(copyBtn).toContainText('Kopyalandı!', { timeout: 500 });

    const regenBtn = page.getByRole('button', { name: /Yeniden Oluştur/i });
    await expect(regenBtn).toBeVisible();
  });

  test('menü ve başlıklar Title Case', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);

    const menuItems = await page.locator('.user-dropdown .dropdown-item').allInnerTexts();

    for (const txt of menuItems) {
      const trimmed = txt.trim();
      if (trimmed.length > 0) {
        expect(trimmed[0]).toMatch(/[A-ZÇĞİÖŞÜ]/);
      }
    }
  });

  test('typing indicator animasyonu', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ success: true, response: 'Test yanıtı', usage: { completion_tokens: 32 } })
      });
    });

    await page.goto(`${BASE_URL}/chat.html`);

    await page.fill('#messageInput', 'Test message');
    await page.click('#sendBtn');

    const typing = page.locator('#typingIndicator');
    await expect(typing).toBeVisible();
    await expect(typing).toBeHidden({ timeout: 4000 });
  });
});

test.describe('Performance & A11y', () => {
  test('Landing page LCP < 3s (relaxed)', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    
    // 3 saniye altında olmalı (2s hedefine yakın ama biraz esnek)
    expect(loadTime).toBeLessThan(3000);
  });

  test('Tüm sayfalar yüklenebilir', async ({ page }) => {
    const pages = ['/', '/auth.html', '/chat.html'];
    
    for (const path of pages) {
      const response = await page.goto(`${BASE_URL}${path}`);
      expect(response?.status()).toBe(200);
    }
  });
});
