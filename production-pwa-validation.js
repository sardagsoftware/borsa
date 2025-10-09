/**
 * 🔍 PRODUCTION PWA VALIDATION TEST
 * iOS & Android PWA Installation Validation
 * Date: 2025-10-08
 * Target: https://www.ailydian.com
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://www.ailydian.com';
const TEST_RESULTS = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function testResult(name, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        TEST_RESULTS.push({ name, status: 'PASS', details });
        log('✅', `${name}: PASS ${details}`);
    } else {
        failedTests++;
        TEST_RESULTS.push({ name, status: 'FAIL', details });
        log('❌', `${name}: FAIL ${details}`);
    }
}

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*'
            },
            timeout: 10000
        };

        if (data) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const protocol = urlObj.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(data);
        }

        req.end();
    });
}

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   🔍 PRODUCTION PWA VALIDATION TEST SUITE        ║');
    console.log('║   iOS & Android Cross-Platform Validation        ║');
    console.log('║   Target: https://www.ailydian.com               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // Test 1: Main Page Accessibility
    log('🧪', 'Test 1: LyDian IQ Page Accessibility...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        testResult(
            'LyDian IQ Page',
            res.statusCode === 200 && res.body.length > 100000,
            `${res.statusCode} - ${Math.round(res.body.length / 1024)}KB`
        );
    } catch (err) {
        testResult('LyDian IQ Page', false, err.message);
    }

    // Test 2: PWA Manifest
    log('🧪', 'Test 2: PWA Manifest Validation...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-manifest.json`);
        const manifest = JSON.parse(res.body);

        const hasName = manifest.name && manifest.name.includes('LyDian IQ');
        const hasStartUrl = manifest.start_url === '/lydian-iq.html?source=pwa';
        const hasId = manifest.id === '/lydian-iq';
        const hasIcons = manifest.icons && manifest.icons.length >= 10;
        const hasDisplay = manifest.display === 'standalone';

        const allValid = hasName && hasStartUrl && hasId && hasIcons && hasDisplay;

        testResult(
            'PWA Manifest',
            res.statusCode === 200 && allValid,
            `${manifest.icons.length} icons, standalone mode`
        );
    } catch (err) {
        testResult('PWA Manifest', false, err.message);
    }

    // Test 3: Service Worker
    log('🧪', 'Test 3: Service Worker Accessibility...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq-sw.js`);
        const hasVersion = res.body.includes('v3.2');
        const hasIOSDetection = res.body.includes('isIOS');
        const hasIOSCompatibility = res.body.includes('iOS & Android Cross-Platform');

        testResult(
            'Service Worker v3.2',
            res.statusCode === 200 && hasVersion && hasIOSDetection && hasIOSCompatibility,
            'iOS detection enabled'
        );
    } catch (err) {
        testResult('Service Worker v3.2', false, err.message);
    }

    // Test 4: Apple Touch Icons (Multiple Sizes)
    log('🧪', 'Test 4: Apple Touch Icons (iOS PWA)...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const appleIconCount = (res.body.match(/apple-touch-icon/g) || []).length;
        const hasMultipleSizes = appleIconCount >= 5; // 120, 152, 167, 180, startup

        testResult(
            'Apple Touch Icons',
            res.statusCode === 200 && hasMultipleSizes,
            `${appleIconCount} icon references found`
        );
    } catch (err) {
        testResult('Apple Touch Icons', false, err.message);
    }

    // Test 5: iOS Detection Function
    log('🧪', 'Test 5: iOS Device Detection...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const hasIOSFunction = res.body.includes('function isIOSDevice()');
        const hasAndroidFunction = res.body.includes('function isAndroidDevice()');
        const hasDetection = res.body.includes('/iPad|iPhone|iPod/');

        testResult(
            'iOS Device Detection',
            hasIOSFunction && hasAndroidFunction && hasDetection,
            'iOS & Android detection functions deployed'
        );
    } catch (err) {
        testResult('iOS Device Detection', false, err.message);
    }

    // Test 6: iOS Install Modal
    log('🧪', 'Test 6: iOS Install Instructions Modal...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const hasModal = res.body.includes('showIOSInstallInstructions');
        const hasInstructions = res.body.includes('Safari\'de') && res.body.includes('Paylaş');
        const hasSteps = res.body.includes('Ana Ekrana Ekle');

        testResult(
            'iOS Install Modal',
            hasModal && hasInstructions && hasSteps,
            'Turkish 3-step instructions deployed'
        );
    } catch (err) {
        testResult('iOS Install Modal', false, err.message);
    }

    // Test 7: Icon File Accessibility
    log('🧪', 'Test 7: Icon File Download Test...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-logo.png`);
        const isValidImage = res.statusCode === 200 &&
                            res.headers['content-type'] === 'image/png' &&
                            res.body.length > 100000;

        testResult(
            'Icon File (PNG)',
            isValidImage,
            `${Math.round(res.body.length / 1024)}KB PNG`
        );
    } catch (err) {
        testResult('Icon File (PNG)', false, err.message);
    }

    // Test 8: PWA Install Button
    log('🧪', 'Test 8: PWA Install Button Handler...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const hasInstallBtn = res.body.includes('pwa-install-btn');
        const hasHandler = res.body.includes('showInstallButton');
        const hasPlatformLogic = res.body.includes('if (isIOSDevice())');

        testResult(
            'PWA Install Button',
            hasInstallBtn && hasHandler && hasPlatformLogic,
            'Platform-specific install handler deployed'
        );
    } catch (err) {
        testResult('PWA Install Button', false, err.message);
    }

    // Test 9: API Health Check
    log('🧪', 'Test 9: API Health Endpoint...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/api/health`);
        const health = JSON.parse(res.body);
        const isHealthy = health.status === 'healthy';
        const hasModels = health.models_count >= 20;

        testResult(
            'API Health',
            res.statusCode === 200 && isHealthy && hasModels,
            `${health.models_count} models, ${health.platform}`
        );
    } catch (err) {
        testResult('API Health', false, err.message);
    }

    // Test 10: Security Headers
    log('🧪', 'Test 10: Security Headers Validation...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const hasCSP = res.headers['content-security-policy'];
        const hasHSTS = res.headers['strict-transport-security'];
        const hasXFrameOptions = res.headers['x-frame-options'];

        testResult(
            'Security Headers',
            hasCSP && hasHSTS && hasXFrameOptions,
            'CSP, HSTS, X-Frame-Options present'
        );
    } catch (err) {
        testResult('Security Headers', false, err.message);
    }

    // Test 11: Manifest Shortcuts (iOS Features)
    log('🧪', 'Test 11: PWA Shortcuts & Features...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-manifest.json`);
        const manifest = JSON.parse(res.body);
        const hasShortcuts = manifest.shortcuts && manifest.shortcuts.length >= 4;
        const hasShareTarget = manifest.share_target;
        const hasFileHandlers = manifest.file_handlers;

        testResult(
            'PWA Advanced Features',
            hasShortcuts && hasShareTarget && hasFileHandlers,
            `${manifest.shortcuts?.length || 0} shortcuts, share & file handlers`
        );
    } catch (err) {
        testResult('PWA Advanced Features', false, err.message);
    }

    // Test 12: Offline Page
    log('🧪', 'Test 12: Offline Fallback Page...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-offline.html`);
        testResult(
            'Offline Page',
            res.statusCode === 200 && res.body.length > 1000,
            'Offline fallback ready'
        );
    } catch (err) {
        testResult('Offline Page', false, err.message);
    }

    // Test 13: Service Worker Cache Strategy
    log('🧪', 'Test 13: Service Worker Caching Strategy...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq-sw.js`);
        const hasNetworkFirst = res.body.includes('Network First');
        const hasCacheFallback = res.body.includes('Cache Fallback');
        const hasIOSSafeCache = res.body.includes('iOS-safe cache');

        testResult(
            'Cache Strategy',
            hasNetworkFirst && hasCacheFallback && hasIOSSafeCache,
            'Network-first with iOS-safe caching'
        );
    } catch (err) {
        testResult('Cache Strategy', false, err.message);
    }

    // Test 14: Cross-Browser Compatibility Meta Tags
    log('🧪', 'Test 14: Mobile Meta Tags...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-iq.html`);
        const hasViewport = res.body.includes('viewport');
        const hasMobileWebApp = res.body.includes('mobile-web-app-capable');
        const hasAppleWebApp = res.body.includes('apple-mobile-web-app-capable');

        testResult(
            'Mobile Meta Tags',
            hasViewport && hasMobileWebApp && hasAppleWebApp,
            'Viewport & PWA meta tags present'
        );
    } catch (err) {
        testResult('Mobile Meta Tags', false, err.message);
    }

    // Test 15: Theme Color & Background
    log('🧪', 'Test 15: PWA Theme Configuration...');
    try {
        const res = await makeRequest(`${PRODUCTION_URL}/lydian-manifest.json`);
        const manifest = JSON.parse(res.body);
        const hasTheme = manifest.theme_color === '#C4A962';
        const hasBg = manifest.background_color === '#1C2536';
        const hasOrientation = manifest.orientation === 'any';

        testResult(
            'PWA Theme Config',
            hasTheme && hasBg && hasOrientation,
            'Gold theme, dark background, any orientation'
        );
    } catch (err) {
        testResult('PWA Theme Config', false, err.message);
    }

    // Final Summary
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║             📊 VALIDATION SUMMARY                 ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`📈 Total Tests:     ${totalTests}`);
    console.log(`✅ Passed:          ${passedTests}`);
    console.log(`❌ Failed:          ${failedTests}`);
    console.log(`📊 Success Rate:    ${successRate}%`);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    if (failedTests === 0) {
        console.log('║   🏆 STATUS: KUSURSUZ - SIFIR HATA ✨            ║');
        console.log('║   ✅ iOS PWA: READY FOR INSTALLATION             ║');
        console.log('║   ✅ Android PWA: READY FOR INSTALLATION         ║');
        console.log('║   ✅ Production: FULLY OPERATIONAL               ║');
    } else {
        console.log('║   ⚠️  STATUS: BAZI TESTLER BAŞARISIZ             ║');
        console.log('║   🔧 İTERASYON GEREKLİ                           ║');
    }
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // Detailed Results
    if (failedTests > 0) {
        console.log('❌ FAILED TESTS:\n');
        TEST_RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - ${r.name}: ${r.details}`);
        });
        console.log('');
    }

    // Save Results
    const fs = require('fs');
    const reportPath = '/Users/sardag/Desktop/ailydian-ultra-pro/PRODUCTION-PWA-VALIDATION-REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        target: PRODUCTION_URL,
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: `${successRate}%`
        },
        tests: TEST_RESULTS
    }, null, 2));

    log('💾', `Detailed report saved: ${reportPath}`);

    // Exit with appropriate code
    process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
runTests().catch(err => {
    console.error('❌ Test suite error:', err);
    process.exit(1);
});
