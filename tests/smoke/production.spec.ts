import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

test.describe('Production Smoke Tests', () => {

  test('Health check endpoint should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('Detailed health check should include all subsystems', async ({ request }) => {
    // Small delay to avoid rate limiting from parallel tests
    await new Promise(resolve => setTimeout(resolve, 100));

    const response = await request.get(`${BASE_URL}/api/health/detailed`);
    expect(response.status()).toBeLessThanOrEqual(200);

    const data = await response.json();
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('email');
    expect(data.checks).toHaveProperty('aiProviders');
    expect(data.checks).toHaveProperty('security');
  });

  test('Homepage should load successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/LyDian/i);
  });

  test('HTTPS redirect should work in production', async ({ request }) => {
    if (process.env.NODE_ENV === 'production') {
      const response = await request.get(BASE_URL.replace('https', 'http'), {
        maxRedirects: 0
      });
      expect(response.status()).toBe(301);
    }
  });

  test('Rate limiting should return 429 when exceeded', async ({ request }) => {
    // Fetch CSRF token first
    const csrfResponse = await request.get(`${BASE_URL}/api/csrf-token`);
    const { csrfToken } = await csrfResponse.json();

    // Rapidly hit auth endpoint with valid CSRF token (auth tier: 5 req/5min)
    const requests = Array(10).fill(null).map(() =>
      request.post(`${BASE_URL}/api/auth/login`, {
        headers: {
          'csrf-token': csrfToken
        },
        data: { email: 'test@test.com', password: 'test' }
      })
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.some(r => r.status() === 429);

    expect(tooManyRequests).toBe(true);
  });

  test('CSRF token should be available', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/csrf-token`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('csrfToken');
  });

  test('Security headers should be present', async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();

    expect(headers).toHaveProperty('x-frame-options');
    expect(headers).toHaveProperty('x-content-type-options');
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('File upload should reject files > 10MB', async ({ request }) => {
    // Small delay to avoid rate limiting from parallel tests
    await new Promise(resolve => setTimeout(resolve, 100));

    const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const response = await request.post(`${BASE_URL}/api/upload`, {
      multipart: {
        file: {
          name: 'large.txt',
          mimeType: 'text/plain',
          buffer: largeFile
        }
      }
    });

    expect(response.status()).toBe(413); // Payload Too Large
  });
});
