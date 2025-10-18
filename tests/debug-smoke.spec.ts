import { test, expect } from '@playwright/test';

// Debug Smoke Test - Lydian-IQ API & Medical Expert Menu
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

test.use({ timeout: 120000 }); // 2 minutes per test

test.describe('🔍 DEBUG SMOKE TEST - API & Menu Issues', () => {

  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let apiCalls: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];
    apiCalls = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
      if (msg.type() === 'log') {
        if (msg.text().includes('API') || msg.text().includes('fetch')) {
          apiCalls.push(msg.text());
        }
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(`REQUEST: ${request.method()} ${url}`);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        apiCalls.push(`RESPONSE: ${response.status()} ${url}`);
      }
    });
  });

  test('Lydian-IQ - API Test with Real Input', async ({ page }) => {
    console.log('\n🧪 TEST: Lydian-IQ API Functionality');
    console.log('=' .repeat(60));

    await page.goto(`${BASE_URL}/lydian-iq.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('\n📋 Page loaded, looking for input elements...');

    // Check page structure
    const body = await page.locator('body').innerHTML();
    const hasTextarea = body.includes('<textarea');
    const hasInput = body.includes('type="text"');
    const hasSolveButton = body.includes('solve') || body.includes('Solve') || body.includes('Çöz');

    console.log(`\n🔍 Page Structure:`);
    console.log(`   - Has textarea: ${hasTextarea}`);
    console.log(`   - Has text input: ${hasInput}`);
    console.log(`   - Has solve button: ${hasSolveButton}`);

    // Try to find problem input
    const problemInput = page.locator('textarea, input[type="text"]').first();
    const inputExists = await problemInput.count() > 0;

    if (!inputExists) {
      console.log('\n❌ PROBLEM: No input field found!');
      console.log('\n📄 Page title:', await page.title());
      console.log('\n🔍 First 500 chars of body:');
      console.log(body.substring(0, 500));
    }

    expect(inputExists).toBeTruthy();

    // Find solve button
    const solveBtn = page.locator('button').filter({ hasText: /solve|çöz|calculate/i }).first();
    const btnExists = await solveBtn.count() > 0;

    if (!btnExists) {
      console.log('\n⚠️ WARNING: Solve button not found, trying generic button');
    }

    // Enter a test problem
    const testProblem = 'Calculate: 15 + 27';
    await problemInput.fill(testProblem);
    console.log(`\n✍️ Entered test problem: "${testProblem}"`);

    await page.waitForTimeout(500);

    // Click solve button (or first button if solve not found)
    const targetBtn = btnExists ? solveBtn : page.locator('button').first();
    await targetBtn.click();
    console.log('\n🖱️ Clicked solve button');

    // Wait for API call
    await page.waitForTimeout(5000); // Wait for response

    // Log all API calls
    console.log(`\n📡 API Calls (${apiCalls.length} total):`);
    apiCalls.forEach((call, idx) => {
      console.log(`   [${idx + 1}] ${call}`);
    });

    // Log console output
    console.log(`\n📝 Console Errors (${consoleErrors.length} total):`);
    consoleErrors.forEach((err, idx) => {
      console.log(`   [${idx + 1}] ${err}`);
    });

    console.log(`\n⚠️ Console Warnings (${consoleWarnings.length} total):`);
    consoleWarnings.forEach((warn, idx) => {
      console.log(`   [${idx + 1}] ${warn}`);
    });

    // Check if API was called
    const apiWasCalled = apiCalls.some(call =>
      call.includes('/api/lydian-iq/solve') ||
      call.includes('/api/chat') ||
      call.includes('/api/unified-ai')
    );

    console.log(`\n🎯 API Called: ${apiWasCalled ? '✅ YES' : '❌ NO'}`);

    // Check for response
    const hasResponse = apiCalls.some(call => call.includes('RESPONSE:'));
    console.log(`📥 Response Received: ${hasResponse ? '✅ YES' : '❌ NO'}`);

    // Check if there's a result element
    await page.waitForTimeout(2000);
    const resultDiv = page.locator('[id*="result"], [id*="solution"], [class*="solution"], [class*="result"]').first();
    const hasResult = await resultDiv.count() > 0;

    if (hasResult) {
      const resultText = await resultDiv.innerText();
      console.log(`\n📊 Result displayed: ${resultText.substring(0, 200)}`);
    } else {
      console.log('\n⚠️ No result div found');
    }

    expect(apiWasCalled).toBeTruthy();
  });

  test('Medical Expert - Side Menu Click Test', async ({ page }) => {
    console.log('\n🧪 TEST: Medical Expert Side Menu');
    console.log('='.repeat(60));

    await page.goto(`${BASE_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('\n📋 Page loaded, testing menu functionality...');

    // Check sidebar exists
    const sidebar = page.locator('#sidebar, .sidebar').first();
    const sidebarExists = await sidebar.count() > 0;
    console.log(`\n🔍 Sidebar found: ${sidebarExists ? '✅ YES' : '❌ NO'}`);
    expect(sidebarExists).toBeTruthy();

    // Find specialty menu items
    const menuItems = page.locator('.specialization-item, [data-specialty]');
    const menuCount = await menuItems.count();
    console.log(`\n📋 Menu items found: ${menuCount}`);

    if (menuCount === 0) {
      console.log('\n❌ ERROR: No menu items found!');
      const sidebarHtml = await sidebar.innerHTML();
      console.log('\n📄 Sidebar HTML (first 500 chars):');
      console.log(sidebarHtml.substring(0, 500));
    }

    expect(menuCount).toBeGreaterThan(0);

    // Test clicking first menu item
    const firstMenuItem = menuItems.first();
    const firstMenuText = await firstMenuItem.innerText();
    console.log(`\n🖱️ Clicking first menu item: "${firstMenuText}"`);

    // Check if item has onclick
    const hasOnclick = await firstMenuItem.evaluate(el => {
      return el.hasAttribute('onclick') || el.onclick !== null;
    });
    console.log(`   Has onclick handler: ${hasOnclick ? '✅ YES' : '❌ NO'}`);

    // Click it
    await firstMenuItem.click();
    console.log('   ✅ Clicked!');

    await page.waitForTimeout(1000);

    // Check for modal or panel
    const modal = page.locator('.modal.active, [style*="display: block"]').first();
    const modalShown = await modal.count() > 0;
    console.log(`\n📦 Modal/Panel opened: ${modalShown ? '✅ YES' : '❌ NO'}`);

    // If no modal, check for errors
    if (!modalShown) {
      console.log('\n⚠️ WARNING: Modal not displayed after click');
      console.log(`\n📝 Console Errors after click (${consoleErrors.length}):`);
      consoleErrors.forEach((err, idx) => {
        console.log(`   [${idx + 1}] ${err}`);
      });
    }

    // Test clicking another category dropdown
    const categoryHeaders = page.locator('.nav-category-header');
    const categoryCount = await categoryHeaders.count();
    console.log(`\n📂 Category headers found: ${categoryCount}`);

    if (categoryCount > 0) {
      const firstCategory = categoryHeaders.first();
      const categoryText = await firstCategory.innerText();
      console.log(`\n🖱️ Clicking category: "${categoryText}"`);
      await firstCategory.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Clicked category header');
    }

    // Log final console state
    console.log(`\n📊 Final Console State:`);
    console.log(`   Errors: ${consoleErrors.length}`);
    console.log(`   Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log(`\n❌ Console Errors:`);
      consoleErrors.forEach((err, idx) => {
        console.log(`   [${idx + 1}] ${err}`);
      });
    }

    // Expect menu to be functional (at least clickable)
    expect(menuCount).toBeGreaterThan(0);
  });

});
