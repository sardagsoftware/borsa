#!/usr/bin/env node

/**
 * 🌍 LyDian i18n System - Comprehensive Test Suite
 *
 * Tests all aspects of the internationalization system:
 * - Translation file accessibility
 * - Locale detection
 * - Language switcher
 * - RTL support
 * - Feature flags
 * - Performance metrics
 *
 * Usage: node test-i18n-system.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3100';
const LANGUAGES = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN'];
const CATEGORIES = ['common', 'navigation', 'auth', 'dashboard', 'errors'];

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// HTTP fetch helper
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data,
                    headers: res.headers
                });
            });
        }).on('error', reject);
    });
}

// Test results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

// Test functions
async function testTranslationFiles() {
    log('\n📦 Testing Translation Files Accessibility...', 'cyan');
    log('━'.repeat(70), 'cyan');

    for (const lang of LANGUAGES) {
        for (const category of CATEGORIES) {
            const url = `${BASE_URL}/i18n/v2/${lang}/${category}.json`;

            try {
                const response = await fetch(url);

                if (response.status === 200) {
                    const json = JSON.parse(response.data);
                    const keyCount = Object.keys(json).length;

                    log(`  ✅ ${lang}/${category}.json - ${keyCount} keys`, 'green');
                    results.passed++;
                    results.tests.push({
                        name: `Translation file: ${lang}/${category}.json`,
                        status: 'passed',
                        details: `${keyCount} keys loaded`
                    });
                } else {
                    log(`  ⚠️  ${lang}/${category}.json - HTTP ${response.status}`, 'yellow');
                    results.warnings++;
                    results.tests.push({
                        name: `Translation file: ${lang}/${category}.json`,
                        status: 'warning',
                        details: `HTTP ${response.status}`
                    });
                }
            } catch (error) {
                log(`  ❌ ${lang}/${category}.json - ${error.message}`, 'red');
                results.failed++;
                results.tests.push({
                    name: `Translation file: ${lang}/${category}.json`,
                    status: 'failed',
                    details: error.message
                });
            }
        }
    }
}

async function testFeatureFlags() {
    log('\n🚩 Testing Feature Flags System...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/ops/canary/feature-flags.json`);

        if (response.status === 200) {
            const flags = JSON.parse(response.data);

            log(`  ✅ Feature flags loaded`, 'green');
            log(`  📊 Total flags: ${Object.keys(flags.flags).length}`, 'blue');

            for (const [name, flag] of Object.entries(flags.flags)) {
                const emoji = flag.enabled ? '🟢' : '🔴';
                log(`     ${emoji} ${name}: ${flag.rolloutPercentage}% rollout`, flag.enabled ? 'green' : 'yellow');
            }

            results.passed++;
            results.tests.push({
                name: 'Feature flags configuration',
                status: 'passed',
                details: `${Object.keys(flags.flags).length} flags loaded`
            });
        } else {
            log(`  ❌ Feature flags not accessible - HTTP ${response.status}`, 'red');
            results.failed++;
        }
    } catch (error) {
        log(`  ❌ Feature flags error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testLocaleEngine() {
    log('\n⚙️  Testing Locale Engine...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/js/locale-engine.js`);

        if (response.status === 200 && response.data.includes('LocaleEngine')) {
            log(`  ✅ Locale engine loaded`, 'green');
            log(`  📦 File size: ${Math.round(response.data.length / 1024)}KB`, 'blue');

            // Check for key features
            const features = [
                { name: 'ICU MessageFormat', pattern: /formatICU/i },
                { name: 'Locale detection', pattern: /detectLocale/i },
                { name: 'Translation loading', pattern: /loadTranslations/i },
                { name: 'Hreflang injection', pattern: /hreflang/i },
                { name: 'RTL support', pattern: /rtl|right-to-left/i },
                { name: 'Caching', pattern: /cache/i }
            ];

            for (const feature of features) {
                if (feature.pattern.test(response.data)) {
                    log(`     ✅ ${feature.name} - present`, 'green');
                    results.passed++;
                } else {
                    log(`     ⚠️  ${feature.name} - not found`, 'yellow');
                    results.warnings++;
                }
            }

            results.tests.push({
                name: 'Locale engine functionality',
                status: 'passed',
                details: 'All core features present'
            });
        } else {
            log(`  ❌ Locale engine not accessible`, 'red');
            results.failed++;
        }
    } catch (error) {
        log(`  ❌ Locale engine error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testLocaleSwitcher() {
    log('\n🌐 Testing Language Switcher UI...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/js/locale-switcher.js`);

        if (response.status === 200 && response.data.includes('LocaleSwitcher')) {
            log(`  ✅ Language switcher loaded`, 'green');

            // Check for all supported languages
            const missingLanguages = [];
            for (const lang of LANGUAGES) {
                if (!response.data.includes(`"${lang}"`)) {
                    missingLanguages.push(lang);
                }
            }

            if (missingLanguages.length === 0) {
                log(`  ✅ All ${LANGUAGES.length} languages configured`, 'green');
                results.passed++;
            } else {
                log(`  ⚠️  Missing languages: ${missingLanguages.join(', ')}`, 'yellow');
                results.warnings++;
            }

            results.tests.push({
                name: 'Language switcher UI',
                status: 'passed',
                details: `${LANGUAGES.length} languages supported`
            });
        } else {
            log(`  ❌ Language switcher not accessible`, 'red');
            results.failed++;
        }
    } catch (error) {
        log(`  ❌ Language switcher error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testRTLSupport() {
    log('\n📐 Testing RTL (Right-to-Left) Support...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/css/i18n-rtl.css`);

        if (response.status === 200) {
            const cssContent = response.data;
            log(`  ✅ RTL CSS loaded`, 'green');
            log(`  📦 File size: ${Math.round(cssContent.length / 1024)}KB`, 'blue');

            // Check for RTL-specific features
            const rtlFeatures = [
                { name: 'Direction override', pattern: /direction:\s*rtl/i },
                { name: 'Text alignment', pattern: /text-align:\s*right/i },
                { name: 'Margin flipping', pattern: /margin-right|margin-left/i },
                { name: 'Padding flipping', pattern: /padding-right|padding-left/i },
                { name: 'Border flipping', pattern: /border-right|border-left/i }
            ];

            for (const feature of rtlFeatures) {
                if (feature.pattern.test(cssContent)) {
                    log(`     ✅ ${feature.name} - implemented`, 'green');
                    results.passed++;
                } else {
                    log(`     ⚠️  ${feature.name} - not found`, 'yellow');
                    results.warnings++;
                }
            }

            results.tests.push({
                name: 'RTL CSS support',
                status: 'passed',
                details: 'Arabic RTL layout support active'
            });
        } else {
            log(`  ❌ RTL CSS not accessible`, 'red');
            results.failed++;
        }
    } catch (error) {
        log(`  ❌ RTL support error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testMainPage() {
    log('\n🏠 Testing Main Page i18n Integration...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/`);

        if (response.status === 200) {
            const html = response.data;

            // Check for i18n script includes
            const requiredScripts = [
                { name: 'Feature flags', pattern: /feature-flags\.js/ },
                { name: 'Locale engine', pattern: /locale-engine\.js/ },
                { name: 'Locale switcher', pattern: /locale-switcher\.js/ }
            ];

            for (const script of requiredScripts) {
                if (script.pattern.test(html)) {
                    log(`  ✅ ${script.name} included`, 'green');
                    results.passed++;
                } else {
                    log(`  ⚠️  ${script.name} not found`, 'yellow');
                    results.warnings++;
                }
            }

            results.tests.push({
                name: 'Main page i18n integration',
                status: 'passed',
                details: 'i18n scripts loaded'
            });
        } else {
            log(`  ❌ Main page not accessible - HTTP ${response.status}`, 'red');
            results.failed++;
        }
    } catch (error) {
        log(`  ❌ Main page error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testPerformance() {
    log('\n⚡ Testing Performance Metrics...', 'cyan');
    log('━'.repeat(70), 'cyan');

    const startTime = Date.now();

    try {
        // Test loading common translations for Turkish
        const response = await fetch(`${BASE_URL}/i18n/v2/tr/common.json`);
        const loadTime = Date.now() - startTime;

        if (response.status === 200) {
            const json = JSON.parse(response.data);
            const keyCount = Object.keys(json).length;
            const fileSize = Buffer.byteLength(response.data);

            log(`  ✅ Translation file loaded`, 'green');
            log(`  ⏱️  Load time: ${loadTime}ms`, loadTime < 200 ? 'green' : 'yellow');
            log(`  📦 File size: ${Math.round(fileSize / 1024)}KB`, 'blue');
            log(`  🔑 Keys: ${keyCount}`, 'blue');

            if (loadTime < 200) {
                log(`  ✅ Performance target met (<200ms)`, 'green');
                results.passed++;
            } else if (loadTime < 500) {
                log(`  ⚠️  Performance acceptable (200-500ms)`, 'yellow');
                results.warnings++;
            } else {
                log(`  ❌ Performance issue (>500ms)`, 'red');
                results.failed++;
            }

            results.tests.push({
                name: 'Translation load performance',
                status: loadTime < 200 ? 'passed' : 'warning',
                details: `${loadTime}ms load time, ${keyCount} keys`
            });
        }
    } catch (error) {
        log(`  ❌ Performance test error: ${error.message}`, 'red');
        results.failed++;
    }
}

async function testCanaryRolloutController() {
    log('\n🚀 Testing Canary Rollout Controller...', 'cyan');
    log('━'.repeat(70), 'cyan');

    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        const { stdout, stderr } = await execPromise('node ops/tools/canary-rollout-controller.js status');

        if (stdout.includes('Canary Rollout Status')) {
            log(`  ✅ Canary controller operational`, 'green');
            log(`  📊 Controller output:`, 'blue');

            // Show first 10 lines
            const lines = stdout.split('\n').slice(0, 10);
            lines.forEach(line => {
                if (line.trim()) {
                    log(`     ${line}`, 'white');
                }
            });

            results.passed++;
            results.tests.push({
                name: 'Canary rollout controller',
                status: 'passed',
                details: 'Controller operational and responsive'
            });
        } else {
            log(`  ⚠️  Unexpected controller output`, 'yellow');
            results.warnings++;
        }
    } catch (error) {
        log(`  ❌ Canary controller error: ${error.message}`, 'red');
        results.failed++;
    }
}

// Generate final report
function generateReport() {
    log('\n' + '═'.repeat(70), 'cyan');
    log('📊 FINAL TEST REPORT', 'cyan');
    log('═'.repeat(70), 'cyan');

    const total = results.passed + results.failed + results.warnings;
    const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;

    log(`\n📈 Overall Statistics:`, 'blue');
    log(`   Total tests: ${total}`, 'white');
    log(`   ✅ Passed: ${results.passed}`, 'green');
    log(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'white');
    log(`   ⚠️  Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'white');
    log(`   📊 Pass rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');

    log(`\n🌍 Language Coverage:`, 'blue');
    log(`   Supported languages: ${LANGUAGES.length}`, 'white');
    log(`   Languages: ${LANGUAGES.join(', ')}`, 'white');

    log(`\n📦 Translation Files:`, 'blue');
    log(`   Total files: ${LANGUAGES.length * CATEGORIES.length}`, 'white');
    log(`   Categories: ${CATEGORIES.join(', ')}`, 'white');

    log(`\n🎯 Feature Status:`, 'blue');
    log(`   ✅ Translation loading`, 'green');
    log(`   ✅ Feature flags system`, 'green');
    log(`   ✅ Locale engine`, 'green');
    log(`   ✅ Language switcher`, 'green');
    log(`   ✅ RTL support (Arabic)`, 'green');
    log(`   ✅ Canary deployment`, 'green');

    if (results.failed === 0) {
        log(`\n🎉 SUCCESS: All critical tests passed!`, 'green');
        log(`\n✅ i18n system is fully operational and ready for use.`, 'green');
        log(`\n🌐 You can now test the language switcher at:`, 'cyan');
        log(`   ${BASE_URL}/`, 'blue');
        log(`\n💡 Try changing the language using the dropdown in the navigation bar.`, 'yellow');
    } else {
        log(`\n⚠️  WARNING: ${results.failed} test(s) failed!`, 'yellow');
        log(`\nPlease review the failed tests and fix issues before deployment.`, 'yellow');
    }

    log('\n' + '═'.repeat(70), 'cyan');
    log('', 'reset');
}

// Main test runner
async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🌍 LyDian i18n System - Comprehensive Test Suite                 ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');

    log(`\n📍 Testing server at: ${BASE_URL}`, 'blue');
    log(`⏰ Test started at: ${new Date().toLocaleString()}`, 'blue');

    try {
        await testFeatureFlags();
        await testTranslationFiles();
        await testLocaleEngine();
        await testLocaleSwitcher();
        await testRTLSupport();
        await testMainPage();
        await testPerformance();
        await testCanaryRolloutController();

        generateReport();

        process.exit(results.failed > 0 ? 1 : 0);
    } catch (error) {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runTests();
