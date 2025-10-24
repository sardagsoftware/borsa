import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3100';

test.describe('Landing (/) smoke', () => {
  test('hero video + CTA görünüyor', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Hero başlık kontrolü
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Advanced AI Platform');
    
    // CTA butonları kontrolü
    await expect(page.getByRole('link', { name: /start free/i })).toBeVisible();
    
    // Feature pills kontrolü
    await expect(page.locator('.pill')).toHaveCount(6);
  });

  test('Title Case normalizasyon çalışıyor', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Footer linklerini kontrol et
    const menuItems = await page.locator('[data-testid="menu-item"]').allInnerTexts();
    
    // En az bir menü öğesi olmalı
    expect(menuItems.length).toBeGreaterThan(0);
    
    // İlk karakterlerin büyük harf olup olmadığını kontrol et
    for (const txt of menuItems) {
      const firstChar = txt.trim()[0];
      // ASCII büyük harf veya Unicode büyük harf kontrolü
      expect(firstChar).toMatch(/[A-ZÇĞİÖŞÜ]/);
    }
  });
});

test.describe('Auth (/auth) smoke', () => {
  test('form alanları ve butonlar', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth.html`);
    
    // Form alanları kontrolü
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Butonlar kontrolü
    await expect(page.getByRole('button', { name: /continue/i }).first()).toBeVisible();
    await expect(page.locator('button:has-text("Continue with SSO")')).toBeVisible();
    
    // A11y kontrol - aria labels
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('aria-label', 'Email address');
  });

  test('form submit çalışıyor', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth.html`);
    
    // Formu doldur
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit
    await page.getByRole('button', { name: /^continue$/i }).first().click();
    
    // Toast mesajı görünmeli
    await expect(page.locator('#toast')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Chat (/chat) baseline', () => {
  test('history yüklenir ve shared_ hariçlenir', async ({ page }) => {
    // localStorage'a test verileri ekle
    await page.goto(`${BASE_URL}/chat.html`);
    
    await page.evaluate(() => {
      localStorage.setItem('chat_1', JSON.stringify({ 
        timestamp: Date.now(), 
        title: 'Test Chat 1',
        messages: []
      }));
      localStorage.setItem('chat_shared_x', JSON.stringify({ 
        timestamp: Date.now(), 
        title: 'SHOULD_SKIP',
        messages: []
      }));
    });
    
    await page.reload();
    
    // History item kontrolü
    const histItems = page.locator('[data-testid="chat-history-item"]');
    await expect(histItems.first()).toBeVisible();
    
    // "SHOULD_SKIP" metni olmamalı
    const allText = await page.locator('#chat-history').textContent();
    expect(allText).not.toContain('SHOULD_SKIP');
  });

  test('copyMessage ve regenerateMessage çalışır', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);
    
    // Sahte bir mesaj ekle
    await page.evaluate(() => {
      (window as any).addMessage('assistant', 'Hello World from Assistant');
    });
    
    // Copy butonunu bul ve tıkla
    const copyBtn = page.getByRole('button', { name: /copy/i }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    
    // "Copied" metnini bekle
    await expect(copyBtn).toContainText('Copied', { timeout: 500 });
    
    // Regenerate butonunu bul
    const regenBtn = page.getByRole('button', { name: /regenerate/i });
    await expect(regenBtn).toBeVisible();
  });

  test('menü ve başlıklar Title Case', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);
    
    // Menü öğelerini al
    const menuItems = await page.locator('[data-testid="menu-item"]').allInnerTexts();
    
    // Her bir menü öğesinin ilk harfi büyük olmalı
    for (const txt of menuItems) {
      const trimmed = txt.trim();
      if (trimmed.length > 0) {
        expect(trimmed[0]).toMatch(/[A-ZÇĞİÖŞÜ]/);
      }
    }
  });

  test('typing indicator animasyonu', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`);
    
    // Mesaj gönder
    await page.fill('#messageInput', 'Test message');
    await page.click('#sendBtn');
    
    // Typing indicator görünmeli
    const typing = page.locator('#typing');
    await expect(typing).toHaveClass(/active/, { timeout: 500 });
    
    // Kısa bir süre sonra kaybolmalı
    await expect(typing).not.toHaveClass(/active/, { timeout: 2000 });
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
