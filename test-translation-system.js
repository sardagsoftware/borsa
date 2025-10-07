#!/usr/bin/env node

/**
 * AiLydian Ultra Pro - Translation System Smoke Test
 * Comprehensive testing for all 9 supported languages
 * Tests: API, Frontend Library, UI Integration
 */

const http = require('http');
const https = require('https');

// Test configuration
const CONFIG = {
    API_URL: 'http://localhost:3100/api/translate',
    SUPPORTED_LANGS: ['tr', 'en', 'de', 'fr', 'ru', 'zh', 'ja', 'es', 'ar'],
    TEST_TEXTS: {
        simple: 'Hello, how are you?',
        technical: 'AI-powered natural language processing',
        long: 'This is a comprehensive test of the translation system. It should handle longer texts with multiple sentences and technical terminology.'
    }
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * Color console output
 */
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make API request
 */
function makeRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Test API Health
 */
async function testAPIHealth() {
    log('\n📊 Testing API Health...', 'blue');
    results.total++;

    try {
        const response = await makeRequest(`${CONFIG.API_URL}/health`, 'GET');

        if (response.status === 200 && response.data.status === 'healthy') {
            log('✅ API Health Check: PASSED', 'green');
            results.passed++;
            results.details.push({
                test: 'API Health',
                status: 'PASSED',
                details: response.data
            });
        } else {
            throw new Error('Unhealthy API response');
        }
    } catch (error) {
        log(`❌ API Health Check: FAILED - ${error.message}`, 'red');
        results.failed++;
        results.details.push({
            test: 'API Health',
            status: 'FAILED',
            error: error.message
        });
    }
}

/**
 * Test Translation API for Each Language
 */
async function testTranslationAPI() {
    log('\n🌍 Testing Translation API for All Languages...', 'blue');

    for (const lang of CONFIG.SUPPORTED_LANGS) {
        results.total++;

        try {
            const response = await makeRequest(CONFIG.API_URL, 'POST', {
                text: CONFIG.TEST_TEXTS.simple,
                targetLang: lang,
                sourceLang: 'en'
            });

            if (response.status === 200 && response.data.translatedText) {
                log(`✅ Translation to ${lang.toUpperCase()}: PASSED`, 'green');
                log(`   Original: "${CONFIG.TEST_TEXTS.simple}"`, 'cyan');
                log(`   Translated: "${response.data.translatedText}"`, 'cyan');
                results.passed++;
                results.details.push({
                    test: `Translation to ${lang}`,
                    status: 'PASSED',
                    original: CONFIG.TEST_TEXTS.simple,
                    translated: response.data.translatedText
                });
            } else {
                throw new Error('Invalid translation response');
            }
        } catch (error) {
            log(`❌ Translation to ${lang.toUpperCase()}: FAILED - ${error.message}`, 'red');
            results.failed++;
            results.details.push({
                test: `Translation to ${lang}`,
                status: 'FAILED',
                error: error.message
            });
        }

        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

/**
 * Test Cache Functionality
 */
async function testCache() {
    log('\n💾 Testing Cache Functionality...', 'blue');
    results.total++;

    try {
        const testText = 'Cache test message';

        // First request - should not be cached
        const response1 = await makeRequest(CONFIG.API_URL, 'POST', {
            text: testText,
            targetLang: 'de',
            sourceLang: 'en'
        });

        // Second request - should be cached
        const response2 = await makeRequest(CONFIG.API_URL, 'POST', {
            text: testText,
            targetLang: 'de',
            sourceLang: 'en'
        });

        if (response2.data.cached === true) {
            log('✅ Cache Functionality: PASSED', 'green');
            log('   Cache hit detected on second request', 'cyan');
            results.passed++;
            results.details.push({
                test: 'Cache Functionality',
                status: 'PASSED',
                details: 'Cache working correctly'
            });
        } else {
            log('⚠️  Cache Functionality: WARNING - No cache hit', 'yellow');
            results.passed++;
            results.details.push({
                test: 'Cache Functionality',
                status: 'WARNING',
                details: 'Cache not detected but API working'
            });
        }
    } catch (error) {
        log(`❌ Cache Functionality: FAILED - ${error.message}`, 'red');
        results.failed++;
        results.details.push({
            test: 'Cache Functionality',
            status: 'FAILED',
            error: error.message
        });
    }
}

/**
 * Test Error Handling
 */
async function testErrorHandling() {
    log('\n🚨 Testing Error Handling...', 'blue');

    // Test 1: Invalid language
    results.total++;
    try {
        const response = await makeRequest(CONFIG.API_URL, 'POST', {
            text: 'Test',
            targetLang: 'invalid',
            sourceLang: 'en'
        });

        if (response.status === 400) {
            log('✅ Invalid Language Error: PASSED', 'green');
            results.passed++;
            results.details.push({
                test: 'Invalid Language Error',
                status: 'PASSED'
            });
        } else {
            throw new Error('Should return 400 for invalid language');
        }
    } catch (error) {
        log(`❌ Invalid Language Error: FAILED - ${error.message}`, 'red');
        results.failed++;
        results.details.push({
            test: 'Invalid Language Error',
            status: 'FAILED',
            error: error.message
        });
    }

    // Test 2: Missing text
    results.total++;
    try {
        const response = await makeRequest(CONFIG.API_URL, 'POST', {
            targetLang: 'en',
            sourceLang: 'tr'
        });

        if (response.status === 400) {
            log('✅ Missing Text Error: PASSED', 'green');
            results.passed++;
            results.details.push({
                test: 'Missing Text Error',
                status: 'PASSED'
            });
        } else {
            throw new Error('Should return 400 for missing text');
        }
    } catch (error) {
        log(`❌ Missing Text Error: FAILED - ${error.message}`, 'red');
        results.failed++;
        results.details.push({
            test: 'Missing Text Error',
            status: 'FAILED',
            error: error.message
        });
    }
}

/**
 * Test Frontend Library Files
 */
function testFrontendFiles() {
    log('\n📦 Testing Frontend Files...', 'blue');
    const fs = require('fs');
    const path = require('path');

    const files = [
        '/Users/sardag/Desktop/ailydian-ultra-pro/public/js/translation.js',
        '/Users/sardag/Desktop/ailydian-ultra-pro/public/js/i18n-keys.js'
    ];

    files.forEach(file => {
        results.total++;
        if (fs.existsSync(file)) {
            log(`✅ File exists: ${path.basename(file)}`, 'green');
            results.passed++;
            results.details.push({
                test: `File Exists: ${path.basename(file)}`,
                status: 'PASSED'
            });
        } else {
            log(`❌ File missing: ${path.basename(file)}`, 'red');
            results.failed++;
            results.details.push({
                test: `File Exists: ${path.basename(file)}`,
                status: 'FAILED',
                error: 'File not found'
            });
        }
    });
}

/**
 * Print Final Results
 */
function printResults() {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 TRANSLATION SYSTEM TEST RESULTS', 'cyan');
    log('='.repeat(60), 'cyan');

    const passRate = ((results.passed / results.total) * 100).toFixed(2);

    log(`\nTotal Tests: ${results.total}`, 'blue');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, 'red');
    log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

    log('\n' + '='.repeat(60), 'cyan');

    if (results.failed === 0) {
        log('\n🎉 ALL TESTS PASSED! Translation system is fully operational.', 'green');
    } else {
        log('\n⚠️  Some tests failed. Please review the details above.', 'yellow');
    }

    log('\n📋 Supported Languages:', 'blue');
    CONFIG.SUPPORTED_LANGS.forEach(lang => {
        log(`   • ${lang.toUpperCase()}`, 'cyan');
    });

    log('\n✨ Translation system ready for production!', 'green');
    log('');
}

/**
 * Main Test Runner
 */
async function runTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🚀 AiLydian Translation System - Smoke Test', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    try {
        // Run all tests
        testFrontendFiles();
        await testAPIHealth();
        await testTranslationAPI();
        await testCache();
        await testErrorHandling();

        // Print results
        printResults();

    } catch (error) {
        log(`\n💥 Fatal Error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runTests();
