import { test } from '@playwright/test';

// JavaScript Error Diagnostic Tool
// Captures ALL console errors with full context

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

test.describe('🐛 JavaScript Error Diagnostic - Detailed Capture', () => {
  
  let allErrors: Array<{type: string, text: string, location?: string}> = [];
  
  test.beforeEach(({ page }) => {
    allErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push({
          type: 'console.error',
          text: msg.text(),
          location: msg.location()?.url || 'unknown'
        });
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      allErrors.push({
        type: 'pageerror',
        text: error.message,
        location: error.stack || 'unknown'
      });
    });
    
    // Capture failed requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      allErrors.push({
        type: 'request_failed',
        text: `${failure?.errorText || 'Unknown error'} - ${request.url()}`,
        location: request.url()
      });
    });
  });

  test.afterEach(() => {
    if (allErrors.length > 0) {
      console.log('\n═══════════════════════════════════════════════════');
      console.log(`📊 TOTAL ERRORS CAPTURED: ${allErrors.length}`);
      console.log('═══════════════════════════════════════════════════\n');
      
      allErrors.forEach((err, index) => {
        console.log(`\n[ERROR #${index + 1}] Type: ${err.type}`);
        console.log(`Message: ${err.text}`);
        console.log(`Location: ${err.location}`);
        console.log('---------------------------------------------------');
      });
    } else {
      console.log('\n✅ NO ERRORS DETECTED\n');
    }
  });

  test('Chat.html - Detailed Error Capture', async ({ page }) => {
    console.log('\n🔍 Loading chat.html and capturing errors...\n');
    
    await page.goto(`${BASE_URL}/chat.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for all JS to execute
    
    // Try to interact with page to trigger any lazy-loaded errors
    try {
      const messageInput = page.locator('#messageInput');
      if (await messageInput.isVisible({ timeout: 5000 })) {
        await messageInput.click();
        await messageInput.fill('Test message');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Could not interact with messageInput:', e);
    }
    
    await page.waitForTimeout(2000); // Final wait for any delayed errors
  });

  test('Medical Expert - Detailed Error Capture', async ({ page }) => {
    console.log('\n🔍 Loading medical-expert.html and capturing errors...\n');
    
    await page.goto(`${BASE_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Try to interact
    try {
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible({ timeout: 5000 })) {
        await textarea.click();
        await textarea.fill('Test symptoms');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Could not interact with textarea:', e);
    }
    
    await page.waitForTimeout(2000);
  });

  test('Legal AI - Detailed Error Capture', async ({ page }) => {
    console.log('\n🔍 Loading lydian-legal-search.html and capturing errors...\n');
    
    await page.goto(`${BASE_URL}/lydian-legal-search.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Try to interact
    try {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 5000 })) {
        await input.click();
        await input.fill('Test legal query');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Could not interact with input:', e);
    }
    
    await page.waitForTimeout(2000);
  });

});
