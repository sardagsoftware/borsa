#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🌍 LYDIAN i18n STRING EXTRACTOR
 * Extract hard-coded strings from HTML/JS files
 * Map to ICU MessageFormat keys
 * Generate base translation files
 * ═══════════════════════════════════════════════════════════════════
 *
 * Phase 1 Week 1 - String Extraction
 * White-Hat Compliant - 0 Errors, 0 Mock Data
 *
 * Usage:
 *   node ops/tools/extract-i18n-strings.js --input=public/*.html
 *   node ops/tools/extract-i18n-strings.js --file=public/index.html
 *   node ops/tools/extract-i18n-strings.js --all
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob').glob;

// ═══════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    inputDir: 'public',
    outputDir: 'public/i18n/v2',
    reportDir: 'ops/reports',

    // Languages to generate
    languages: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN'],

    // Source language (base translations)
    sourceLanguage: 'tr',

    // Files to scan
    filePatterns: [
        'public/**/*.html',
        'public/js/**/*.js',
        '!public/**/*-backup*.html',
        '!public/**/*-old*.html',
        '!public/**/*.bak*',
        '!public/node_modules/**'
    ],

    // Strings to exclude (brand names, technical terms)
    excludePatterns: [
        /^LyDian$/i,
        /^DrLydian$/i,
        /^AI$/i,
        /^API$/i,
        /^HTML$/i,
        /^CSS$/i,
        /^JavaScript$/i,
        /^Azure$/i,
        /^OpenAI$/i,
        /^GPT$/i,
        /^\d+$/,  // Numbers only
        /^[a-zA-Z]{1,2}$/,  // 1-2 letter strings
    ],

    // Minimum string length to extract
    minLength: 3,

    // Maximum string length (likely code, not UI text)
    maxLength: 200,
};

// ═══════════════════════════════════════════════════════════════════
// 🔍 STRING EXTRACTION PATTERNS
// ═══════════════════════════════════════════════════════════════════

const EXTRACTION_PATTERNS = {
    // HTML content between tags
    htmlContent: /<(?:h[1-6]|p|span|div|button|a|label|th|td|li|option|title)[^>]*>([^<]+)<\//gi,

    // HTML attributes
    htmlAttributes: /(?:placeholder|title|alt|aria-label)=["']([^"']+)["']/gi,

    // JavaScript strings
    jsStrings: /["']([^"']{3,})['"]/g,

    // Template literals
    templateLiterals: /`([^`]{3,})`/g,

    // Meta tags
    metaContent: /<meta[^>]*content=["']([^"']+)["']/gi,
};

// ═══════════════════════════════════════════════════════════════════
// 📊 EXTRACTION STATE
// ═══════════════════════════════════════════════════════════════════

const state = {
    extractedStrings: new Map(),  // string -> metadata
    keyMapping: new Map(),         // string -> ICU key
    categories: {
        nav: [],
        footer: [],
        cta: [],
        hero: [],
        forms: [],
        errors: [],
        stats: [],
        common: [],
        content: [],
    },
    statistics: {
        filesScanned: 0,
        stringsExtracted: 0,
        keysMapped: 0,
        categories: {},
    },
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function shouldExclude(str) {
    // Check if string matches exclude patterns
    for (const pattern of CONFIG.excludePatterns) {
        if (pattern.test(str)) return true;
    }

    // Check length constraints
    if (str.length < CONFIG.minLength || str.length > CONFIG.maxLength) {
        return true;
    }

    // Exclude URLs, emails, file paths
    if (/^https?:\/\/|@|\.(html|js|css|png|jpg)$/i.test(str)) {
        return true;
    }

    // Exclude technical patterns
    if (/^[A-Z_]{3,}$/.test(str)) return true;  // ALL_CAPS constants
    if (/^\$\{/.test(str)) return true;  // Template variable
    if (/^function|var|const|let|return/i.test(str)) return true;  // JS keywords

    return false;
}

function sanitizeString(str) {
    return str
        .trim()
        .replace(/\s+/g, ' ')  // Collapse whitespace
        .replace(/&nbsp;/g, ' ')  // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function categorizeString(str, context) {
    // Determine category based on string content and context

    if (context.includes('nav') || context.includes('menu')) {
        return 'nav';
    }

    if (context.includes('footer')) {
        return 'footer';
    }

    if (context.includes('btn') || context.includes('button') ||
        /^(giriş|ücretsiz|dene|başla|öğren|keşfet)/i.test(str)) {
        return 'cta';
    }

    if (context.includes('hero') || context.includes('banner')) {
        return 'hero';
    }

    if (context.includes('form') || context.includes('input') ||
        /^(e-posta|şifre|ad|soyad|mesaj|yorum)/i.test(str)) {
        return 'forms';
    }

    if (/^(hata|uyarı|başarılı|error|warning|success)/i.test(str)) {
        return 'errors';
    }

    if (/^\d+[%+]?$/.test(str) || context.includes('stat')) {
        return 'stats';
    }

    if (/^(tamam|iptal|kaydet|sil|düzenle|kapat|aç)/i.test(str)) {
        return 'common';
    }

    return 'content';
}

function generateICUKey(str, category, index) {
    // Generate hierarchical ICU MessageFormat key

    // Create slug from string
    let slug = str
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 40);  // Max 40 chars

    // Ensure uniqueness
    const baseKey = `${category}.${slug}`;
    let key = baseKey;
    let counter = 1;

    while (state.keyMapping.has(key)) {
        key = `${baseKey}_${counter}`;
        counter++;
    }

    return key;
}

// ═══════════════════════════════════════════════════════════════════
// 📁 FILE SCANNING
// ═══════════════════════════════════════════════════════════════════

function extractStringsFromHTML(content, filename) {
    const strings = [];

    // Extract HTML content between tags
    let match;

    // HTML content
    const htmlContentRegex = /<(?:h[1-6]|p|span|div|button|a|label|th|td|li|option|title)[^>]*>([^<]+)<\//gi;
    while ((match = htmlContentRegex.exec(content)) !== null) {
        const str = sanitizeString(match[1]);
        if (!shouldExclude(str)) {
            strings.push({
                text: str,
                context: match[0].substring(0, 100),
                type: 'html_content',
                line: content.substring(0, match.index).split('\n').length,
            });
        }
    }

    // HTML attributes
    const attrRegex = /(?:placeholder|title|alt|aria-label)=["']([^"']+)["']/gi;
    while ((match = attrRegex.exec(content)) !== null) {
        const str = sanitizeString(match[1]);
        if (!shouldExclude(str)) {
            strings.push({
                text: str,
                context: match[0],
                type: 'html_attribute',
                line: content.substring(0, match.index).split('\n').length,
            });
        }
    }

    // Meta tags
    const metaRegex = /<meta[^>]*content=["']([^"']+)["']/gi;
    while ((match = metaRegex.exec(content)) !== null) {
        const str = sanitizeString(match[1]);
        if (!shouldExclude(str)) {
            strings.push({
                text: str,
                context: match[0],
                type: 'meta_content',
                line: content.substring(0, match.index).split('\n').length,
            });
        }
    }

    return strings;
}

function extractStringsFromJS(content, filename) {
    const strings = [];

    // JavaScript strings
    const jsStringRegex = /["']([^"']{3,})['"]/g;
    let match;

    while ((match = jsStringRegex.exec(content)) !== null) {
        const str = sanitizeString(match[1]);
        if (!shouldExclude(str)) {
            strings.push({
                text: str,
                context: content.substring(Math.max(0, match.index - 50), match.index + 50),
                type: 'js_string',
                line: content.substring(0, match.index).split('\n').length,
            });
        }
    }

    // Template literals
    const templateRegex = /`([^`]{3,})`/g;
    while ((match = templateRegex.exec(content)) !== null) {
        const str = sanitizeString(match[1]);
        if (!shouldExclude(str)) {
            strings.push({
                text: str,
                context: content.substring(Math.max(0, match.index - 50), match.index + 50),
                type: 'template_literal',
                line: content.substring(0, match.index).split('\n').length,
            });
        }
    }

    return strings;
}

async function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);

        let strings = [];

        if (ext === '.html') {
            strings = extractStringsFromHTML(content, filePath);
        } else if (ext === '.js') {
            strings = extractStringsFromJS(content, filePath);
        }

        // Add to state
        for (const strData of strings) {
            const key = strData.text;

            if (!state.extractedStrings.has(key)) {
                state.extractedStrings.set(key, {
                    text: key,
                    occurrences: [],
                    category: null,
                    icuKey: null,
                });
            }

            const entry = state.extractedStrings.get(key);
            entry.occurrences.push({
                file: filePath,
                line: strData.line,
                type: strData.type,
                context: strData.context,
            });
        }

        state.statistics.filesScanned++;
        console.log(`✅ Scanned: ${filePath} (${strings.length} strings)`);

    } catch (error) {
        console.error(`❌ Error scanning ${filePath}:`, error.message);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🗂️ CATEGORIZATION & KEY MAPPING
// ═══════════════════════════════════════════════════════════════════

function categorizeAndMapKeys() {
    console.log('\n🔍 Categorizing and mapping ICU keys...\n');

    for (const [text, data] of state.extractedStrings) {
        // Determine category based on first occurrence
        const firstOccurrence = data.occurrences[0];
        const category = categorizeString(text, firstOccurrence.context.toLowerCase());

        // Generate ICU key
        const icuKey = generateICUKey(text, category, state.categories[category].length);

        // Update data
        data.category = category;
        data.icuKey = icuKey;

        // Add to category
        state.categories[category].push({
            key: icuKey,
            text: text,
            occurrences: data.occurrences.length,
        });

        // Add to key mapping
        state.keyMapping.set(icuKey, text);

        state.statistics.keysMapped++;
    }

    // Update category statistics
    for (const [category, items] of Object.entries(state.categories)) {
        state.statistics.categories[category] = items.length;
    }

    console.log(`✅ Mapped ${state.statistics.keysMapped} strings to ICU keys`);
}

// ═══════════════════════════════════════════════════════════════════
// 📝 GENERATE TRANSLATION FILES
// ═══════════════════════════════════════════════════════════════════

function generateTranslationFiles() {
    console.log('\n📝 Generating translation files...\n');

    // Create output directory
    const outputDir = path.join(process.cwd(), CONFIG.outputDir, CONFIG.sourceLanguage);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate file per category
    for (const [category, items] of Object.entries(state.categories)) {
        if (items.length === 0) continue;

        const translations = {};

        for (const item of items) {
            translations[item.key] = item.text;
        }

        const filePath = path.join(outputDir, `${category}.json`);
        fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');

        console.log(`✅ Created: ${filePath} (${items.length} keys)`);
    }

    // Generate index file (all translations)
    const allTranslations = {};
    for (const [key, text] of state.keyMapping) {
        allTranslations[key] = text;
    }

    const indexPath = path.join(outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(allTranslations, null, 2), 'utf8');
    console.log(`✅ Created: ${indexPath} (${state.keyMapping.size} keys)`);
}

// ═══════════════════════════════════════════════════════════════════
// 📊 GENERATE REPORT
// ═══════════════════════════════════════════════════════════════════

function generateReport() {
    console.log('\n📊 Generating extraction report...\n');

    const report = {
        timestamp: new Date().toISOString(),
        statistics: state.statistics,
        categories: {},
        topStrings: [],
        filesCovered: [],
    };

    // Category breakdown
    for (const [category, items] of Object.entries(state.categories)) {
        report.categories[category] = {
            count: items.length,
            samples: items.slice(0, 5).map(item => ({
                key: item.key,
                text: item.text,
                occurrences: item.occurrences,
            })),
        };
    }

    // Top 20 most frequent strings
    const sortedStrings = Array.from(state.extractedStrings.values())
        .sort((a, b) => b.occurrences.length - a.occurrences.length)
        .slice(0, 20);

    report.topStrings = sortedStrings.map(str => ({
        text: str.text,
        icuKey: str.icuKey,
        category: str.category,
        occurrences: str.occurrences.length,
        files: [...new Set(str.occurrences.map(occ => occ.file))],
    }));

    // Files covered
    const filesSet = new Set();
    for (const data of state.extractedStrings.values()) {
        for (const occ of data.occurrences) {
            filesSet.add(occ.file);
        }
    }
    report.filesCovered = Array.from(filesSet).sort();

    // Write JSON report
    const reportDir = path.join(process.cwd(), CONFIG.reportDir);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const jsonPath = path.join(reportDir, 'i18n-extraction-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✅ JSON Report: ${jsonPath}`);

    // Generate markdown report
    const mdReport = generateMarkdownReport(report);
    const mdPath = path.join(reportDir, 'i18n-extraction-report.md');
    fs.writeFileSync(mdPath, mdReport, 'utf8');
    console.log(`✅ Markdown Report: ${mdPath}`);

    return report;
}

function generateMarkdownReport(report) {
    let md = `# 🌍 i18n String Extraction Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Phase:** 1 - Extract & Normalize

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| **Files Scanned** | ${report.statistics.filesScanned} |
| **Strings Extracted** | ${report.statistics.stringsExtracted} |
| **ICU Keys Mapped** | ${report.statistics.keysMapped} |

---

## 🗂️ Category Breakdown

| Category | Count | Percentage |
|----------|-------|------------|
`;

    const total = report.statistics.keysMapped;
    for (const [category, count] of Object.entries(report.statistics.categories)) {
        const percentage = ((count / total) * 100).toFixed(1);
        md += `| **${category}** | ${count} | ${percentage}% |\n`;
    }

    md += `\n---\n\n## 🔝 Top 20 Most Frequent Strings\n\n`;
    md += `| Rank | Text | ICU Key | Category | Occurrences |\n`;
    md += `|------|------|---------|----------|-------------|\n`;

    report.topStrings.forEach((str, i) => {
        const text = str.text.substring(0, 50) + (str.text.length > 50 ? '...' : '');
        md += `| ${i + 1} | ${text} | \`${str.icuKey}\` | ${str.category} | ${str.occurrences} |\n`;
    });

    md += `\n---\n\n## 📁 Files Covered (${report.filesCovered.length})\n\n`;

    report.filesCovered.slice(0, 50).forEach(file => {
        md += `- ${file}\n`;
    });

    if (report.filesCovered.length > 50) {
        md += `\n... and ${report.filesCovered.length - 50} more files\n`;
    }

    md += `\n---\n\n## ✅ Next Steps\n\n`;
    md += `1. Review generated translation files in \`${CONFIG.outputDir}/${CONFIG.sourceLanguage}/\`\n`;
    md += `2. Validate ICU key mappings\n`;
    md += `3. Run PHASE 2: Backend Translation Pipeline\n`;
    md += `4. Generate translations for ${CONFIG.languages.length - 1} additional languages\n`;

    return md;
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           🌍 LYDIAN i18n STRING EXTRACTOR v1.0                   ║
║                                                                   ║
║   Phase 1 - Extract & Normalize                                  ║
║   White-Hat Compliant - 0 Errors, 0 Mock Data                   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Get file patterns from args or use default
    const args = process.argv.slice(2);
    let filePatterns = CONFIG.filePatterns;

    if (args.includes('--all')) {
        console.log('📁 Scanning all files...\n');
    } else if (args.some(arg => arg.startsWith('--file='))) {
        const fileArg = args.find(arg => arg.startsWith('--file='));
        const filePath = fileArg.split('=')[1];
        filePatterns = [filePath];
        console.log(`📁 Scanning single file: ${filePath}\n`);
    } else if (args.some(arg => arg.startsWith('--input='))) {
        const inputArg = args.find(arg => arg.startsWith('--input='));
        const pattern = inputArg.split('=')[1];
        filePatterns = [pattern];
        console.log(`📁 Scanning pattern: ${pattern}\n`);
    }

    // Find files
    console.log('🔍 Finding files...\n');

    // Use Promise-based glob for each pattern
    const allFiles = [];
    for (const pattern of filePatterns) {
        try {
            const files = await new Promise((resolve, reject) => {
                glob(pattern, {
                    ignore: ['**/node_modules/**', '**/*-backup*', '**/*-old*', '**/*.bak*'],
                    cwd: process.cwd(),
                }, (err, matches) => {
                    if (err) reject(err);
                    else resolve(matches);
                });
            });
            allFiles.push(...files);
        } catch (error) {
            console.error(`❌ Error with pattern ${pattern}:`, error.message);
        }
    }

    const files = [...new Set(allFiles)]; // Remove duplicates

    console.log(`✅ Found ${files.length} files to scan\n`);
    console.log('───────────────────────────────────────────────────────────────────\n');

    // Scan files
    for (const file of files) {
        await scanFile(file);
    }

    console.log('\n───────────────────────────────────────────────────────────────────\n');
    console.log(`✅ Scanned ${state.statistics.filesScanned} files`);
    console.log(`✅ Extracted ${state.extractedStrings.size} unique strings\n`);

    // Categorize and map keys
    categorizeAndMapKeys();

    // Generate translation files
    generateTranslationFiles();

    // Generate report
    const report = generateReport();

    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                   ║');
    console.log('║                    ✅ EXTRACTION COMPLETE                         ║');
    console.log('║                                                                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   - Files Scanned: ${report.statistics.filesScanned}`);
    console.log(`   - Strings Extracted: ${state.extractedStrings.size}`);
    console.log(`   - ICU Keys Mapped: ${state.statistics.keysMapped}`);
    console.log(`   - Categories: ${Object.keys(report.categories).length}`);
    console.log('\n📁 Output Files:');
    console.log(`   - Translation files: ${CONFIG.outputDir}/${CONFIG.sourceLanguage}/*.json`);
    console.log(`   - Reports: ${CONFIG.reportDir}/i18n-extraction-report.*`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review translation files');
    console.log('   2. Validate ICU key mappings');
    console.log('   3. Run PHASE 2: Backend Translation Pipeline');
    console.log('\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    });
}

module.exports = { main, scanFile, extractStringsFromHTML, extractStringsFromJS };
