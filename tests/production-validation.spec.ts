import { test, expect } from '@playwright/test';

// PRODUCTION VALIDATION - Derinlemesine Mühendislik Analizi
// www.ailydian.com gerçek durumunu test eder

const PRODUCTION_URL = 'https://www.ailydian.com';

test.use({ timeout: 120000 });

test.describe('🔬 PRODUCTION DEEP ENGINEERING ANALYSIS', () => {

  let consoleErrors: string[] = [];
  let consoleLogs: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    consoleLogs = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });
  });

  test('Medical Expert - Menu Visibility Analysis', async ({ page }) => {
    console.log('\n🔬 MEDICAL EXPERT - DEEP ANALYSIS');
    console.log('='.repeat(70));

    await page.goto(`${PRODUCTION_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 1. Check nav-category classes in DOM
    const navCategories = await page.locator('.nav-category').all();
    console.log(`\n📋 Found ${navCategories.length} nav-category elements`);

    for (let i = 0; i < navCategories.length; i++) {
      const classes = await navCategories[i].getAttribute('class');
      const isOpen = classes?.includes('open');
      console.log(`  [${i + 1}] class="${classes}" → ${isOpen ? '✅ OPEN' : '❌ CLOSED'}`);
    }

    // 2. Check if menu content is visible
    const contentDivs = await page.locator('.nav-category-content').all();
    console.log(`\n📐 Checking ${contentDivs.length} content divs:`);

    for (let i = 0; i < contentDivs.length; i++) {
      const isVisible = await contentDivs[i].isVisible();
      const maxHeight = await contentDivs[i].evaluate(el => window.getComputedStyle(el).maxHeight);
      const overflow = await contentDivs[i].evaluate(el => window.getComputedStyle(el).overflow);
      const pointerEvents = await contentDivs[i].evaluate(el => window.getComputedStyle(el).pointerEvents);

      console.log(`  [${i + 1}] visible=${isVisible}, maxHeight=${maxHeight}, overflow=${overflow}, pointerEvents=${pointerEvents}`);
    }

    // 3. Check menu items clickability
    const menuItems = await page.locator('.specialization-item').all();
    console.log(`\n🖱️ Found ${menuItems.length} menu items`);

    if (menuItems.length > 0) {
      const firstItem = menuItems[0];
      const text = await firstItem.innerText();
      const isVisible = await firstItem.isVisible();
      const boundingBox = await firstItem.boundingBox();

      console.log(`  First item: "${text}"`);
      console.log(`  Visible: ${isVisible}`);
      console.log(`  BoundingBox: ${JSON.stringify(boundingBox)}`);

      if (isVisible) {
        try {
          // Try force click
          await firstItem.click({ force: true, timeout: 5000 });
          console.log(`  ✅ Force click successful`);
        } catch (e) {
          console.log(`  ❌ Force click failed: ${e}`);
        }
      }
    }

    // 4. Check JavaScript errors
    console.log(`\n❌ Console Errors (${consoleErrors.length}):`);
    consoleErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));

    // 5. HTML Source check
    const htmlSource = await page.content();
    const hasOpenClass = htmlSource.includes('class="nav-category open"');
    console.log(`\n📄 HTML Source Check:`);
    console.log(`  Contains 'class="nav-category open"': ${hasOpenClass ? '✅ YES' : '❌ NO'}`);

    expect(navCategories.length).toBeGreaterThan(0);
  });

  test('Lydian-IQ - Search Engine Analysis', async ({ page }) => {
    console.log('\n🔬 LYDIAN-IQ - DEEP ANALYSIS');
    console.log('='.repeat(70));

    await page.goto(`${PRODUCTION_URL}/lydian-iq.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 1. Check currentMode variable
    const currentMode = await page.evaluate(() => {
      return (window as any).currentMode;
    });
    console.log(`\n🎯 currentMode = '${currentMode}'`);

    // 2. Check mode chips
    const modeChips = await page.locator('.mode-chip').all();
    console.log(`\n🔘 Found ${modeChips.length} mode chips:`);

    for (let i = 0; i < modeChips.length; i++) {
      const dataMode = await modeChips[i].getAttribute('data-mode');
      const classes = await modeChips[i].getAttribute('class');
      const isActive = classes?.includes('active');
      console.log(`  [${i + 1}] data-mode="${dataMode}", active=${isActive ? '✅ YES' : '❌ NO'}`);
    }

    // 3. Check search input and button
    const searchInput = page.locator('#searchInput');
    const searchBtn = page.locator('#searchBtn');

    const inputExists = await searchInput.count() > 0;
    const btnExists = await searchBtn.count() > 0;

    console.log(`\n🔍 Search Elements:`);
    console.log(`  searchInput exists: ${inputExists ? '✅ YES' : '❌ NO'}`);
    console.log(`  searchBtn exists: ${btnExists ? '✅ YES' : '❌ NO'}`);

    if (inputExists && btnExists) {
      // 4. Test actual search
      await searchInput.fill('Test problem: 2 + 2 = ?');
      console.log(`\n✍️ Entered test query`);

      await page.waitForTimeout(500);

      // Listen for API calls
      const apiCallsDetected: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/api/')) {
          apiCallsDetected.push(`${req.method()} ${req.url()}`);
        }
      });

      await searchBtn.click();
      console.log(`\n🖱️ Clicked search button`);

      await page.waitForTimeout(5000);

      console.log(`\n📡 API Calls Detected (${apiCallsDetected.length}):`);
      apiCallsDetected.forEach((call, idx) => console.log(`  [${idx + 1}] ${call}`));

      // Check for response
      const messages = await page.locator('#messages .message').all();
      console.log(`\n💬 Messages in DOM: ${messages.length}`);
    }

    // 5. Check JavaScript errors
    console.log(`\n❌ Console Errors (${consoleErrors.length}):`);
    consoleErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));

    // 6. HTML Source check
    const htmlSource = await page.content();
    const hasCorrectMode = htmlSource.includes("currentMode = 'lydian-iq'");
    const hasActiveChip = htmlSource.includes('class="mode-chip active" data-mode="lydian-iq"');
    console.log(`\n📄 HTML Source Check:`);
    console.log(`  Contains "currentMode = 'lydian-iq'": ${hasCorrectMode ? '✅ YES' : '❌ NO'}`);
    console.log(`  Contains active lydian-iq chip: ${hasActiveChip ? '✅ YES' : '❌ NO'}`);

    expect(modeChips.length).toBeGreaterThan(0);
  });

});
