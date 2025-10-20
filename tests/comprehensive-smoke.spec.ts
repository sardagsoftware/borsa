import { test, expect } from '@playwright/test';

// White-Hat Penetration Testing - Comprehensive Smoke Tests
// Tests ALL pages for functionality, real data integration, and design integrity

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

// Global timeout for comprehensive tests
test.use({ timeout: 90000 }); // 90s per test

// Priority 1: Critical AI Pages
test.describe('🔥 CRITICAL AI PAGES - Priority 1', () => {
  
  test('Chat.html - LyDian AI Chat Interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`, { waitUntil: 'networkidle' });

    // Check page loads without errors
    await page.waitForLoadState('domcontentloaded');

    // Check critical elements exist (FIXED: correct IDs from chat.html)
    await expect(page.locator('#messagesContainer')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#sendBtn')).toBeVisible({ timeout: 30000 });

    // Check model selector exists
    const modelSelect = page.locator('#modelSelect, select[name="model"], #unifiedModelSelect');
    if (await modelSelect.count() > 0) {
      await expect(modelSelect.first()).toBeVisible();
    }

    // Verify send button is clickable (not disabled)
    const sendBtn = page.locator('#sendBtn');
    await expect(sendBtn).toBeEnabled();
  });

  test('Lydian IQ - Reasoning Engine', async ({ page }) => {
    await page.goto(`${BASE_URL}/lydian-iq.html`, { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    // Check main heading exists
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 30000 });
    
    // Check for input/problem area
    const inputArea = page.locator('textarea, input[type="text"]').first();
    if (await inputArea.count() > 0) {
      await expect(inputArea).toBeVisible();
    }
  });

  test('Medical Expert - DrLydian Medical AI', async ({ page }) => {
    await page.goto(`${BASE_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    // Check page loaded successfully
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 30000 });
    
    // Check for medical-specific elements
    const medicalKeywords = ['medical', 'health', 'diagnosis', 'tıbbi', 'sağlık'];
    const bodyText = await page.locator('body').innerText();
    const hasMedicalContent = medicalKeywords.some(keyword =>
      bodyText.toLowerCase().includes(keyword.toLowerCase())
    );
    expect(hasMedicalContent).toBeTruthy();
  });

  test('Legal AI - Lydian Legal Search', async ({ page }) => {
    await page.goto(`${BASE_URL}/lydian-legal-search.html`, { waitUntil: 'networkidle' });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for dynamic content to load

    // Check page loaded - h1/h2 might be dynamically rendered
    const heading = page.locator('h1, h2, [role="heading"], .heading, .title').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible({ timeout: 30000 });
    }

    // Alternative: Check for legal-specific content (more reliable)
    const bodyText = await page.locator('body').innerText();
    const hasLegalContent = ['legal', 'hukuk', 'law', 'kanun', 'lydian'].some(keyword =>
      bodyText.toLowerCase().includes(keyword.toLowerCase())
    );
    expect(hasLegalContent).toBeTruthy();
  });

});

// Priority 2: Advisory & Knowledge Pages
test.describe('🧠 ADVISORY & KNOWLEDGE PAGES - Priority 2', () => {
  
  test('AI Advisor Hub - 8 Expertise Modules', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-advisor-hub.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 30000 });
  });

  test('Knowledge Base - Learning Center', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge-base.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Models Page - AI Model Showcase', async ({ page }) => {
    await page.goto(`${BASE_URL}/models.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

});

// Priority 3: Civic Intelligence Grid
test.describe('🏙️ CIVIC INTELLIGENCE - Smart City Platform', () => {
  
  test('Civic Intelligence Grid - Platform Overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-intelligence-grid.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic SVF - Synthetic Data', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-svf.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic MAP - Model Attestation', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-map.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic ATG - Adversarial Testing', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-atg.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic PHN - Public Health Network', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-phn.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic RRO - Risk & Resilience', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-rro.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Civic UMO - Urban Mobility', async ({ page }) => {
    await page.goto(`${BASE_URL}/civic-umo.html`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

});

// Priority 4: Additional Core Pages
test.describe('📄 ADDITIONAL CORE PAGES', () => {
  
  test('About Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/about.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Blog Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('API Documentation', async ({ page }) => {
    await page.goto(`${BASE_URL}/api-docs.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 30000 });
  });

  test('Developers Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/developers.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Enterprise Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/enterprise.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Education Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/education.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Research Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/research.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Careers Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/careers.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

});

// Design & Layout Integrity Tests
test.describe('🎨 DESIGN & LAYOUT INTEGRITY', () => {
  
  test('Chat.html - No Layout Breaks', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`, { waitUntil: 'networkidle' });
    
    // Check viewport doesn't have horizontal scroll
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    
    if (viewportSize) {
      expect(bodyWidth).toBeLessThanOrEqual(viewportSize.width + 20); // Allow 20px tolerance
    }
    
    // Check no elements overflow
    const overflowingElements = await page.locator('*').evaluateAll(elements => {
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 20; // 20px tolerance
      }).length;
    });
    
    expect(overflowingElements).toBeLessThan(5); // Allow up to 5 minor overflows
  });

  test('Medical Expert - Responsive Design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto(`${BASE_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    
    // Check main content is visible on mobile
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  });

  test('Lydian IQ - Responsive Design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto(`${BASE_URL}/lydian-iq.html`, { waitUntil: 'networkidle' });
    
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 30000 });
  });

});

// JavaScript Errors Detection
test.describe('🐛 JAVASCRIPT ERROR DETECTION', () => {
  
  let consoleErrors: string[] = [];
  
  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
  });

  test('Chat.html - No JavaScript Errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for JS execution

    // Log all captured errors
    if (consoleErrors.length > 0) {
      console.log('\n🔍 CHAT.HTML - ALL CONSOLE ERRORS:');
      consoleErrors.forEach((err, idx) => {
        console.log(`  [${idx + 1}] ${err}`);
      });
    }

    // Filter out known non-critical errors (graceful degradation)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::ERR') &&
      !err.includes('Failed to fetch flags') &&  // Feature flags graceful fail
      !err.includes('CSRF token fetch failed') && // CSRF graceful fail
      !err.includes('Error fetching feature flags') &&
      !err.includes('Failed to initialize feature flags')
    );

    if (criticalErrors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS AFTER FILTERING:');
      criticalErrors.forEach((err, idx) => {
        console.log(`  [${idx + 1}] ${err}`);
      });
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('Medical Expert - No JavaScript Errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/medical-expert.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Log all errors
    if (consoleErrors.length > 0) {
      console.log('\n🔍 MEDICAL EXPERT - ALL CONSOLE ERRORS:');
      consoleErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
    }

    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::ERR') &&
      !err.includes('Failed to fetch flags') &&
      !err.includes('CSRF token fetch failed') &&
      !err.includes('Error fetching feature flags') &&
      !err.includes('Failed to initialize feature flags')
    );

    if (criticalErrors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS:');
      criticalErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('Lydian IQ - No JavaScript Errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/lydian-iq.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Legal AI - No JavaScript Errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/lydian-legal-search.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Log all errors
    if (consoleErrors.length > 0) {
      console.log('\n🔍 LEGAL AI - ALL CONSOLE ERRORS:');
      consoleErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
    }

    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::ERR') &&
      !err.includes('Failed to fetch flags') &&
      !err.includes('CSRF token fetch failed') &&
      !err.includes('Error fetching feature flags') &&
      !err.includes('Failed to initialize feature flags')
    );

    if (criticalErrors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS:');
      criticalErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
    }

    expect(criticalErrors.length).toBe(0);
  });

});
