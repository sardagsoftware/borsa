/**
 * BEYAZ ŞAPKALI Hreflang Validation Test
 * Tests if hreflang tags are correct and valid
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_LANGS = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'x-default'];
const BASE_URL = 'https://www.ailydian.com';

function validateHreflangInFile(filePath) {
    console.log(`\n🔍 Validating: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const hreflangRegex = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*>/g;

    const found = [];
    let match;

    while ((match = hreflangRegex.exec(content)) !== null) {
        found.push({
            lang: match[1],
            href: match[2]
        });
    }

    if (found.length === 0) {
        console.log('❌ No hreflang tags found');
        return false;
    }

    console.log(`✅ Found ${found.length} hreflang tags`);

    // Validate each language
    let errors = [];
    const foundLangs = found.map(f => f.lang);

    // Check for all expected languages
    EXPECTED_LANGS.forEach(lang => {
        if (!foundLangs.includes(lang)) {
            errors.push(`Missing hreflang for: ${lang}`);
        }
    });

    // Check for duplicates
    const duplicates = foundLangs.filter((item, index) => foundLangs.indexOf(item) !== index);
    if (duplicates.length > 0) {
        errors.push(`Duplicate hreflang tags: ${duplicates.join(', ')}`);
    }

    // Validate URLs
    found.forEach(item => {
        if (!item.href.startsWith(BASE_URL)) {
            errors.push(`Invalid URL for ${item.lang}: ${item.href}`);
        }

        // Check URL format
        if (item.lang !== 'x-default' && !item.href.includes(`?lang=${item.lang}`)) {
            errors.push(`Missing ?lang=${item.lang} in URL: ${item.href}`);
        }
    });

    if (errors.length > 0) {
        console.log('❌ Validation errors:');
        errors.forEach(err => console.log(`   - ${err}`));
        return false;
    }

    console.log('✅ All hreflang tags are valid');
    return true;
}

// Test index.html
const indexPath = path.join(__dirname, '..', 'public', 'index.html');

console.log('🧪 BEYAZ ŞAPKALI Hreflang Validation Test\n');
console.log('Expected languages:', EXPECTED_LANGS.join(', '));

const isValid = validateHreflangInFile(indexPath);

if (isValid) {
    console.log('\n✅ ✅ ✅ VALIDATION PASSED - 0 ERRORS ✅ ✅ ✅\n');
    process.exit(0);
} else {
    console.log('\n❌ VALIDATION FAILED\n');
    process.exit(1);
}
