/**
 * i18n System Validation Test
 * Tests the internationalization implementation
 * NO MOCK DATA - Real validation
 *
 * Run: node tests/i18n-validation.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  const fileName = path.basename(filePath);

  if (exists) {
    log(`✅ ${fileName} exists`, 'green');
    return true;
  } else {
    log(`❌ ${fileName} NOT FOUND`, 'red');
    return false;
  }
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const fileName = path.basename(filePath);
    const keyCount = Object.keys(json).length;

    log(`✅ ${fileName} is valid JSON (${keyCount} top-level keys)`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${path.basename(filePath)} is INVALID JSON: ${error.message}`, 'red');
    return false;
  }
}

function checkTranslationCompleteness(locale1Path, locale2Path) {
  try {
    const locale1 = JSON.parse(fs.readFileSync(locale1Path, 'utf8'));
    const locale2 = JSON.parse(fs.readFileSync(locale2Path, 'utf8'));

    const locale1Name = path.basename(path.dirname(locale1Path));
    const locale2Name = path.basename(path.dirname(locale2Path));

    // Get all keys from both files
    const keys1 = getAllKeys(locale1);
    const keys2 = getAllKeys(locale2);

    const missingIn2 = keys1.filter(key => !keys2.includes(key));
    const missingIn1 = keys2.filter(key => !keys1.includes(key));

    if (missingIn1.length === 0 && missingIn2.length === 0) {
      log(`✅ ${locale1Name} and ${locale2Name} have matching keys (${keys1.length} keys)`, 'green');
      return true;
    } else {
      if (missingIn2.length > 0) {
        log(`⚠️  ${locale2Name} is missing keys: ${missingIn2.join(', ')}`, 'yellow');
      }
      if (missingIn1.length > 0) {
        log(`⚠️  ${locale1Name} is missing keys: ${missingIn1.join(', ')}`, 'yellow');
      }
      return false;
    }
  } catch (error) {
    log(`❌ Error comparing translations: ${error.message}`, 'red');
    return false;
  }
}

function getAllKeys(obj, prefix = '') {
  let keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function checkIndexHTMLIntegration() {
  const indexPath = path.join(__dirname, '../public/index.html');
  const content = fs.readFileSync(indexPath, 'utf8');

  const checks = [
    { pattern: 'id="language-switcher"', name: 'Language switcher container' },
    { pattern: '/js/i18n/core.js', name: 'i18n core script' },
    { pattern: '/js/i18n/hreflang.js', name: 'hreflang script' },
    { pattern: '/js/i18n/languageSwitcher.js', name: 'Language switcher script' }
  ];

  let allPassed = true;

  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      log(`✅ ${check.name} integrated`, 'green');
    } else {
      log(`❌ ${check.name} NOT integrated`, 'red');
      allPassed = false;
    }
  });

  return allPassed;
}

// Main validation
function main() {
  log('\n========================================', 'blue');
  log('i18n SYSTEM VALIDATION', 'blue');
  log('========================================\n', 'blue');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: File Structure
  log('\n1️⃣  Checking File Structure...', 'blue');
  const files = [
    'public/locales/tr/common.json',
    'public/locales/en/common.json',
    'public/js/i18n/core.js',
    'public/js/i18n/hreflang.js',
    'public/js/i18n/languageSwitcher.js'
  ];

  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    totalTests++;
    if (checkFileExists(filePath)) {
      passedTests++;
    }
  });

  // Test 2: JSON Validation
  log('\n2️⃣  Validating JSON Files...', 'blue');
  const jsonFiles = [
    'public/locales/tr/common.json',
    'public/locales/en/common.json'
  ];

  jsonFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    totalTests++;
    if (validateJSON(filePath)) {
      passedTests++;
    }
  });

  // Test 3: Translation Completeness
  log('\n3️⃣  Checking Translation Completeness...', 'blue');
  const trPath = path.join(__dirname, '../public/locales/tr/common.json');
  const enPath = path.join(__dirname, '../public/locales/en/common.json');
  totalTests++;
  if (checkTranslationCompleteness(trPath, enPath)) {
    passedTests++;
  }

  // Test 4: index.html Integration
  log('\n4️⃣  Checking index.html Integration...', 'blue');
  totalTests++;
  if (checkIndexHTMLIntegration()) {
    passedTests++;
  }

  // Final Report
  log('\n========================================', 'blue');
  log('VALIDATION SUMMARY', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');

  const percentage = Math.round((passedTests / totalTests) * 100);
  log(`\nSuccess Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! i18n implementation is READY!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Run validation
main();
