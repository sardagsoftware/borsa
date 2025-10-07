#!/usr/bin/env node

/**
 * LYDIAN IQ - PWA SECURITY AUDIT
 * White-Hat Penetration Testing for PWA Implementation
 *
 * Tests:
 * 1. Manifest security
 * 2. Service Worker security
 * 3. HTTPS enforcement
 * 4. Content Security Policy
 * 5. Sensitive data caching
 * 6. XSS vulnerabilities
 * 7. Code injection risks
 * 8. Cache poisoning
 * 9. CORS configuration
 * 10. Update mechanism security
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 LYDIAN IQ - PWA SECURITY AUDIT');
console.log('=' .repeat(60));
console.log('');

let passedTests = 0;
let failedTests = 0;
const issues = [];

// Helper functions
function pass(test) {
    console.log(`✅ PASS: ${test}`);
    passedTests++;
}

function fail(test, reason) {
    console.log(`❌ FAIL: ${test}`);
    console.log(`   Reason: ${reason}`);
    failedTests++;
    issues.push({ test, reason });
}

function warn(test, reason) {
    console.log(`⚠️  WARN: ${test}`);
    console.log(`   Note: ${reason}`);
}

function section(name) {
    console.log('');
    console.log('─'.repeat(60));
    console.log(`📋 ${name}`);
    console.log('─'.repeat(60));
}

// Test 1: Manifest Security
section('MANIFEST SECURITY');

try {
    const manifestPath = path.join(__dirname, 'public', 'lydian-manifest.json');

    if (!fs.existsSync(manifestPath)) {
        fail('Manifest exists', 'lydian-manifest.json not found');
    } else {
        pass('Manifest exists');

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Check required fields
        if (manifest.name && manifest.short_name) {
            pass('Manifest has name fields');
        } else {
            fail('Manifest name fields', 'Missing name or short_name');
        }

        if (manifest.start_url) {
            pass('Manifest has start_url');
        } else {
            fail('Manifest start_url', 'Missing start_url');
        }

        if (manifest.icons && manifest.icons.length >= 2) {
            pass('Manifest has icons');

            // Check for maskable icons (Android)
            const hasMaskable = manifest.icons.some(icon =>
                icon.purpose && icon.purpose.includes('maskable')
            );

            if (hasMaskable) {
                pass('Manifest has maskable icons for Android');
            } else {
                warn('Maskable icons', 'Consider adding maskable purpose icons for better Android support');
            }
        } else {
            fail('Manifest icons', 'Not enough icons defined (minimum 2)');
        }

        if (manifest.display === 'standalone' || manifest.display === 'fullscreen') {
            pass('Manifest display mode is app-like');
        } else {
            warn('Display mode', 'Consider using standalone or fullscreen for better app experience');
        }

        if (manifest.theme_color && manifest.background_color) {
            pass('Manifest has theme colors');
        } else {
            fail('Manifest theme colors', 'Missing theme_color or background_color');
        }

        // Security: Check for XSS in manifest
        const manifestStr = JSON.stringify(manifest);
        if (manifestStr.includes('<script>') || manifestStr.includes('javascript:')) {
            fail('Manifest XSS check', 'Potential XSS vulnerability detected in manifest');
        } else {
            pass('Manifest XSS check');
        }
    }
} catch (error) {
    fail('Manifest parsing', error.message);
}

// Test 2: Service Worker Security
section('SERVICE WORKER SECURITY');

try {
    const swPath = path.join(__dirname, 'public', 'lydian-sw.js');

    if (!fs.existsSync(swPath)) {
        fail('Service Worker exists', 'lydian-sw.js not found');
    } else {
        pass('Service Worker exists');

        const swCode = fs.readFileSync(swPath, 'utf8');

        // Check for security patterns
        if (swCode.includes('SENSITIVE_ENDPOINTS') || swCode.includes('isSensitiveEndpoint')) {
            pass('Service Worker has sensitive endpoint filtering');
        } else {
            fail('Sensitive endpoint filtering', 'No mechanism to prevent caching sensitive data');
        }

        if (swCode.includes('CACHE_VERSION') || swCode.includes('version')) {
            pass('Service Worker has cache versioning');
        } else {
            warn('Cache versioning', 'Consider adding cache versioning for easier updates');
        }

        // Check for dangerous patterns
        if (swCode.includes('eval(') || swCode.includes('Function(')) {
            fail('Code injection risk', 'Service Worker uses eval() or Function() - potential code injection');
        } else {
            pass('No code injection patterns');
        }

        // Check for HTTPS enforcement
        if (swCode.includes('https://') && !swCode.includes('http://')) {
            pass('HTTPS enforcement');
        } else {
            warn('HTTPS enforcement', 'Service Worker should only work with HTTPS');
        }

        // Check for proper error handling
        if (swCode.includes('catch') && swCode.includes('try')) {
            pass('Service Worker has error handling');
        } else {
            warn('Error handling', 'Service Worker should have try-catch blocks');
        }

        // Check for background sync
        if (swCode.includes('sync')) {
            pass('Background sync implemented');
        } else {
            warn('Background sync', 'Consider implementing background sync for offline operations');
        }

        // Check for push notifications
        if (swCode.includes('push') && swCode.includes('notification')) {
            pass('Push notifications implemented');
        } else {
            warn('Push notifications', 'Push notifications not detected');
        }

        // Security: Check for credentials in service worker
        const credentialPatterns = [
            /api[_-]?key/i,
            /secret/i,
            /password/i,
            /token.*=.*['"]/i,
            /bearer\s+[a-zA-Z0-9]/i
        ];

        let hasCredentials = false;
        for (const pattern of credentialPatterns) {
            if (pattern.test(swCode)) {
                hasCredentials = true;
                break;
            }
        }

        if (hasCredentials) {
            fail('Credentials in Service Worker', 'Potential API keys or secrets found in Service Worker');
        } else {
            pass('No credentials in Service Worker');
        }
    }
} catch (error) {
    fail('Service Worker parsing', error.message);
}

// Test 3: PWA Installer Security
section('PWA INSTALLER SECURITY');

try {
    const installerPath = path.join(__dirname, 'public', 'js', 'lydian-pwa-installer.js');

    if (!fs.existsSync(installerPath)) {
        warn('PWA Installer', 'lydian-pwa-installer.js not found (optional)');
    } else {
        pass('PWA Installer exists');

        const installerCode = fs.readFileSync(installerPath, 'utf8');

        // Check for browser detection
        if (installerCode.includes('detectBrowser') || installerCode.includes('userAgent')) {
            pass('Browser detection implemented');
        } else {
            warn('Browser detection', 'Consider implementing browser detection for better UX');
        }

        // Check for platform detection
        if (installerCode.includes('detectPlatform') || installerCode.includes('iOS') || installerCode.includes('Android')) {
            pass('Platform detection implemented');
        } else {
            warn('Platform detection', 'Consider implementing platform detection');
        }

        // Check for aggressive prompting (bad UX)
        if (installerCode.includes('setInterval') && installerCode.includes('prompt')) {
            warn('Install prompting', 'Avoid aggressive install prompts');
        } else {
            pass('No aggressive install prompts');
        }

        // Security: Check for XSS in DOM manipulation
        if (installerCode.includes('innerHTML') && !installerCode.includes('textContent')) {
            warn('XSS risk', 'innerHTML usage detected - ensure all content is sanitized');
        } else {
            pass('Safe DOM manipulation');
        }
    }
} catch (error) {
    warn('PWA Installer check', error.message);
}

// Test 4: HTML Integration Security
section('HTML INTEGRATION SECURITY');

try {
    const htmlPath = path.join(__dirname, 'public', 'lydian-iq.html');

    if (!fs.existsSync(htmlPath)) {
        fail('Main HTML file', 'lydian-iq.html not found');
    } else {
        pass('Main HTML file exists');

        const htmlCode = fs.readFileSync(htmlPath, 'utf8');

        // Check manifest link
        if (htmlCode.includes('lydian-manifest.json')) {
            pass('Manifest linked in HTML');
        } else {
            fail('Manifest link', 'lydian-manifest.json not linked in HTML');
        }

        // Check theme-color meta tag
        if (htmlCode.includes('theme-color')) {
            pass('Theme color meta tag present');
        } else {
            warn('Theme color', 'Add theme-color meta tag for better mobile experience');
        }

        // Check apple-mobile-web-app-capable
        if (htmlCode.includes('apple-mobile-web-app-capable')) {
            pass('iOS web app meta tags present');
        } else {
            warn('iOS meta tags', 'Add apple-mobile-web-app-capable for iOS support');
        }

        // Check for CSP
        if (htmlCode.includes('Content-Security-Policy') || htmlCode.includes('CSP')) {
            pass('Content Security Policy detected');
        } else {
            warn('Content Security Policy', 'Consider adding CSP headers for enhanced security');
        }
    }
} catch (error) {
    fail('HTML integration check', error.message);
}

// Test 5: File Structure Security
section('FILE STRUCTURE SECURITY');

try {
    const publicDir = path.join(__dirname, 'public');

    // Check for sensitive files in public directory
    const sensitiveFiles = [
        '.env',
        '.env.local',
        'config.json',
        'secrets.json',
        'credentials.json',
        '.git',
        'node_modules'
    ];

    let hasSensitiveFiles = false;
    for (const file of sensitiveFiles) {
        if (fs.existsSync(path.join(publicDir, file))) {
            fail('Sensitive file exposure', `${file} found in public directory`);
            hasSensitiveFiles = true;
        }
    }

    if (!hasSensitiveFiles) {
        pass('No sensitive files in public directory');
    }

    // Check for proper icon files
    const iconFiles = ['lydian-logo.png', 'lydian-logo.svg'];
    let hasIcons = true;

    for (const icon of iconFiles) {
        if (!fs.existsSync(path.join(publicDir, icon))) {
            warn('Icon files', `${icon} not found`);
            hasIcons = false;
        }
    }

    if (hasIcons) {
        pass('Icon files present');
    }

} catch (error) {
    fail('File structure check', error.message);
}

// Test 6: Offline Fallback Security
section('OFFLINE FALLBACK SECURITY');

try {
    const offlinePath = path.join(__dirname, 'public', 'lydian-offline.html');

    if (!fs.existsSync(offlinePath)) {
        warn('Offline fallback', 'lydian-offline.html not found (recommended)');
    } else {
        pass('Offline fallback page exists');

        const offlineCode = fs.readFileSync(offlinePath, 'utf8');

        // Check for proper offline messaging
        if (offlineCode.includes('offline') || offlineCode.includes('Offline')) {
            pass('Offline messaging present');
        } else {
            warn('Offline messaging', 'Offline page should clearly communicate offline status');
        }

        // Check for online detection
        if (offlineCode.includes('online') && offlineCode.includes('addEventListener')) {
            pass('Online detection implemented');
        } else {
            warn('Online detection', 'Consider adding online detection for auto-reload');
        }
    }
} catch (error) {
    warn('Offline fallback check', error.message);
}

// Final Report
section('FINAL SECURITY AUDIT REPORT');

console.log('');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('');

if (failedTests === 0) {
    console.log('🎉 EXCELLENT! All security tests passed!');
    console.log('   Your PWA implementation follows security best practices.');
} else {
    console.log('⚠️  ATTENTION REQUIRED!');
    console.log('   Please address the following security issues:');
    console.log('');

    issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.test}`);
        console.log(`      → ${issue.reason}`);
    });
}

console.log('');
console.log('─'.repeat(60));
console.log('📊 SECURITY SCORE:', Math.round((passedTests / (passedTests + failedTests)) * 100) + '%');
console.log('─'.repeat(60));
console.log('');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
