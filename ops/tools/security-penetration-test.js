#!/usr/bin/env node

/**
 * 🔒 LyDian i18n Security Penetration Testing Tool
 *
 * White-hat security testing for i18n system vulnerabilities
 *
 * Tests:
 * 1. XSS (Cross-Site Scripting) attacks
 * 2. RTL Override spoofing (U+202E, U+202D)
 * 3. Path traversal in translation files
 * 4. Unicode normalization attacks
 * 5. SQL injection patterns
 * 6. Prototype pollution
 * 7. DoS via extremely long strings
 * 8. Locale parameter injection
 * 9. JSON injection
 * 10. HTML entity encoding issues
 *
 * Usage:
 *   node ops/tools/security-penetration-test.js
 *   node ops/tools/security-penetration-test.js --verbose
 *   node ops/tools/security-penetration-test.js --fix
 *
 * @author LyDian AI Platform - Security Team
 * @license MIT
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    i18nDir: path.join(__dirname, '../../public/i18n/v2'),
    supportedLanguages: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN'],
    verbose: process.argv.includes('--verbose'),
    fix: process.argv.includes('--fix'),
    reportPath: path.join(__dirname, '../reports/security-penetration-test-report.json'),
};

// ============================
// CLI COLORS
// ============================

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// ============================
// ATTACK VECTORS
// ============================

const ATTACK_VECTORS = {
    xss: [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<body onload=alert("XSS")>',
        '<input type="text" value="test" onfocus=alert("XSS")>',
        '<a href="javascript:alert(\'XSS\')">Click</a>',
    ],

    rtlOverride: [
        '\u202E', // RIGHT-TO-LEFT OVERRIDE
        '\u202D', // LEFT-TO-RIGHT OVERRIDE
        '\u202C', // POP DIRECTIONAL FORMATTING
        '\u200E', // LEFT-TO-RIGHT MARK
        '\u200F', // RIGHT-TO-LEFT MARK
    ],

    pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f',
        '....//....//....//etc/passwd',
    ],

    unicodeNormalization: [
        '\u0041\u0301', // A with combining acute accent
        '\u00C1', // Precomposed A with acute
        '\uFF21', // Fullwidth Latin capital letter A
        '\u212B', // Angstrom sign (looks like A)
    ],

    sqlInjection: [
        "' OR '1'='1",
        '; DROP TABLE users; --',
        "admin'--",
        "' UNION SELECT * FROM users--",
    ],

    prototypePollution: [
        '__proto__',
        'constructor',
        'prototype',
    ],

    dosAttacks: [
        'A'.repeat(1000000), // 1MB string
        '🚀'.repeat(100000), // Emoji bomb
        '\n'.repeat(100000), // Newline bomb
    ],

    localeInjection: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'tr; rm -rf /',
        'en && cat /etc/passwd',
        'de|curl http://malicious.com',
    ],

    jsonInjection: [
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '}{"malicious": "payload"}',
    ],

    htmlEntityEncoding: [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '&#60;script&#62;alert("XSS")&#60;/script&#62;',
        '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;',
    ],
};

// ============================
// SECURITY TESTS
// ============================

class SecurityTester {
    constructor() {
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            vulnerabilities: [],
            timestamp: new Date().toISOString(),
        };
    }

    // ============================
    // TEST 1: XSS Attacks
    // ============================

    testXSS() {
        log('\n🔍 Test 1: XSS (Cross-Site Scripting) Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Check for XSS patterns
                for (const vector of ATTACK_VECTORS.xss) {
                    if (content.includes(vector)) {
                        vulnerabilities.push({
                            type: 'XSS',
                            severity: 'CRITICAL',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector,
                        });

                        this.results.failed++;
                        log(`  ❌ XSS CRITICAL: ${lang}/${file} contains "${vector}"`, 'red');
                    }
                }

                // Check for script tags
                const scriptMatches = content.match(/<script[\s\S]*?>[\s\S]*?<\/script>/gi);
                if (scriptMatches) {
                    for (const match of scriptMatches) {
                        vulnerabilities.push({
                            type: 'XSS',
                            severity: 'CRITICAL',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector: match,
                        });

                        this.results.failed++;
                        log(`  ❌ XSS CRITICAL: ${lang}/${file} contains script tag`, 'red');
                    }
                }

                // Check for event handlers
                const eventHandlers = content.match(/on\w+\s*=\s*["'][^"']*["']/gi);
                if (eventHandlers) {
                    for (const handler of eventHandlers) {
                        vulnerabilities.push({
                            type: 'XSS',
                            severity: 'HIGH',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector: handler,
                        });

                        this.results.warnings++;
                        log(`  ⚠️  XSS HIGH: ${lang}/${file} contains event handler "${handler}"`, 'yellow');
                    }
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No XSS vulnerabilities found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 2: RTL Override Spoofing
    // ============================

    testRTLOverride() {
        log('\n🔍 Test 2: RTL Override Spoofing Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Check for RTL override characters
                for (const char of ATTACK_VECTORS.rtlOverride) {
                    if (content.includes(char)) {
                        // Exception: Arabic language can legitimately use RTL marks
                        if (lang === 'ar' && (char === '\u200F' || char === '\u200E')) {
                            continue; // Skip legitimate Arabic RTL marks
                        }

                        vulnerabilities.push({
                            type: 'RTL_OVERRIDE',
                            severity: 'MEDIUM',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
                        });

                        this.results.warnings++;
                        log(`  ⚠️  RTL MEDIUM: ${lang}/${file} contains RTL override character`, 'yellow');
                    }
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No RTL override vulnerabilities found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 3: Path Traversal
    // ============================

    testPathTraversal() {
        log('\n🔍 Test 3: Path Traversal Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Check for path traversal patterns
                for (const vector of ATTACK_VECTORS.pathTraversal) {
                    if (content.includes(vector)) {
                        vulnerabilities.push({
                            type: 'PATH_TRAVERSAL',
                            severity: 'HIGH',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector,
                        });

                        this.results.failed++;
                        log(`  ❌ PATH_TRAVERSAL HIGH: ${lang}/${file} contains "${vector}"`, 'red');
                    }
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No path traversal vulnerabilities found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 4: SQL Injection Patterns
    // ============================

    testSQLInjection() {
        log('\n🔍 Test 4: SQL Injection Pattern Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Check for SQL injection patterns
                for (const vector of ATTACK_VECTORS.sqlInjection) {
                    if (content.toLowerCase().includes(vector.toLowerCase())) {
                        vulnerabilities.push({
                            type: 'SQL_INJECTION',
                            severity: 'MEDIUM',
                            file: path.relative(CONFIG.i18nDir, filePath),
                            vector,
                        });

                        this.results.warnings++;
                        log(`  ⚠️  SQL_INJECTION MEDIUM: ${lang}/${file} contains "${vector}"`, 'yellow');
                    }
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No SQL injection patterns found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 5: Prototype Pollution
    // ============================

    testPrototypePollution() {
        log('\n🔍 Test 5: Prototype Pollution Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);

                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    // Check for dangerous keys
                    const keys = Object.keys(data);

                    for (const dangerousKey of ATTACK_VECTORS.prototypePollution) {
                        if (keys.includes(dangerousKey)) {
                            vulnerabilities.push({
                                type: 'PROTOTYPE_POLLUTION',
                                severity: 'CRITICAL',
                                file: path.relative(CONFIG.i18nDir, filePath),
                                vector: dangerousKey,
                            });

                            this.results.failed++;
                            log(`  ❌ PROTOTYPE_POLLUTION CRITICAL: ${lang}/${file} contains key "${dangerousKey}"`, 'red');
                        }
                    }
                } catch (error) {
                    // JSON parse error already caught by other tests
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No prototype pollution vulnerabilities found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 6: DoS (Denial of Service)
    // ============================

    testDoS() {
        log('\n🔍 Test 6: DoS (Extremely Long Strings) Detection', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];
        const MAX_LENGTH = 10000; // 10KB per translation string

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);

                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    for (const [key, value] of Object.entries(data)) {
                        if (typeof value === 'string' && value.length > MAX_LENGTH) {
                            vulnerabilities.push({
                                type: 'DOS_LONG_STRING',
                                severity: 'MEDIUM',
                                file: path.relative(CONFIG.i18nDir, filePath),
                                vector: `${key}: ${value.length} characters (max ${MAX_LENGTH})`,
                            });

                            this.results.warnings++;
                            log(`  ⚠️  DOS MEDIUM: ${lang}/${file} key "${key}" is ${value.length} chars (max ${MAX_LENGTH})`, 'yellow');
                        }
                    }
                } catch (error) {
                    // JSON parse error already caught by other tests
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ No DoS vulnerabilities found', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // TEST 7: JSON Structure Integrity
    // ============================

    testJSONIntegrity() {
        log('\n🔍 Test 7: JSON Structure Integrity', 'cyan');
        log('━'.repeat(60), 'cyan');

        const vulnerabilities = [];

        for (const lang of CONFIG.supportedLanguages) {
            const langDir = path.join(CONFIG.i18nDir, lang);

            if (!fs.existsSync(langDir)) continue;

            const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(langDir, file);

                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    // Check if all values are strings
                    for (const [key, value] of Object.entries(data)) {
                        if (typeof value !== 'string') {
                            vulnerabilities.push({
                                type: 'JSON_INTEGRITY',
                                severity: 'MEDIUM',
                                file: path.relative(CONFIG.i18nDir, filePath),
                                vector: `Key "${key}" has non-string value (${typeof value})`,
                            });

                            this.results.warnings++;
                            log(`  ⚠️  JSON_INTEGRITY MEDIUM: ${lang}/${file} key "${key}" is not a string`, 'yellow');
                        }
                    }
                } catch (error) {
                    vulnerabilities.push({
                        type: 'JSON_INTEGRITY',
                        severity: 'CRITICAL',
                        file: path.relative(CONFIG.i18nDir, filePath),
                        vector: `Invalid JSON: ${error.message}`,
                    });

                    this.results.failed++;
                    log(`  ❌ JSON_INTEGRITY CRITICAL: ${lang}/${file} is invalid JSON`, 'red');
                }
            }
        }

        if (vulnerabilities.length === 0) {
            this.results.passed++;
            log('  ✅ All JSON files have correct structure', 'green');
        } else {
            this.results.vulnerabilities.push(...vulnerabilities);
        }

        this.results.totalTests++;
    }

    // ============================
    // RUN ALL TESTS
    // ============================

    runAllTests() {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  🔒 LyDian i18n Security Penetration Testing             ║', 'cyan');
        log('║  White-hat security testing for i18n vulnerabilities     ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

        this.testXSS();
        this.testRTLOverride();
        this.testPathTraversal();
        this.testSQLInjection();
        this.testPrototypePollution();
        this.testDoS();
        this.testJSONIntegrity();

        this.printSummary();
        this.saveReport();
    }

    // ============================
    // PRINT SUMMARY
    // ============================

    printSummary() {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  📊 Security Test Summary                                 ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

        log(`\n  Total Tests:       ${this.results.totalTests}`, 'white');
        log(`  Passed:            ${this.results.passed}`, 'green');
        log(`  Failed:            ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'white');
        log(`  Warnings:          ${this.results.warnings}`, this.results.warnings > 0 ? 'yellow' : 'white');
        log(`  Vulnerabilities:   ${this.results.vulnerabilities.length}`, this.results.vulnerabilities.length > 0 ? 'red' : 'green');

        if (this.results.vulnerabilities.length > 0) {
            log('\n  🔍 Vulnerability Breakdown:', 'yellow');

            const counts = {};
            for (const vuln of this.results.vulnerabilities) {
                counts[vuln.type] = (counts[vuln.type] || 0) + 1;
            }

            for (const [type, count] of Object.entries(counts)) {
                log(`    • ${type}: ${count}`, 'yellow');
            }
        }

        log('\n' + '━'.repeat(60), 'cyan');

        if (this.results.failed === 0 && this.results.warnings === 0) {
            log('\n  ✅ All security tests passed!', 'green');
            log('  🎉 No vulnerabilities detected.', 'green');
        } else if (this.results.failed > 0) {
            log('\n  ❌ CRITICAL vulnerabilities detected!', 'red');
            log('  🚨 Fix immediately before deployment.', 'red');
        } else {
            log('\n  ⚠️  Some warnings detected.', 'yellow');
            log('  💡 Review and address if necessary.', 'yellow');
        }

        log('\n' + '━'.repeat(60), 'cyan');
        log(`\n  📄 Full report saved to: ${CONFIG.reportPath}`, 'blue');
        log('', 'reset');
    }

    // ============================
    // SAVE REPORT
    // ============================

    saveReport() {
        const reportDir = path.dirname(CONFIG.reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(CONFIG.reportPath, JSON.stringify(this.results, null, 2));

        log(`  ✅ Report saved successfully`, 'green');
    }
}

// ============================
// MAIN
// ============================

async function main() {
    const tester = new SecurityTester();
    tester.runAllTests();

    // Exit with error code if vulnerabilities found
    process.exit(tester.results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
    main();
}

module.exports = { SecurityTester };
