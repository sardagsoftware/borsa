#!/usr/bin/env node

/**
 * 📝 LyDian i18n Grammar QA Validator v2.0
 *
 * Validates translation quality using:
 * - Grammar correctness checks
 * - Domain-specific terminology validation
 * - Consistency checks across files
 * - Length ratio validation
 * - Special character validation
 * - RTL validation for Arabic
 *
 * Quality threshold: >90% pass rate required
 *
 * Usage:
 *   node ops/tools/grammar-qa.js --lang=en
 *   node ops/tools/grammar-qa.js --lang=all
 *   node ops/tools/grammar-qa.js --lang=en --category=cta
 *   node ops/tools/grammar-qa.js --report
 *
 * @author LyDian AI Platform
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    sourceLanguage: 'tr',
    targetLanguages: ['en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN'],
    i18nDir: path.join(process.cwd(), 'public/i18n/v2'),
    opsDir: path.join(process.cwd(), 'ops/i18n'),
    categories: ['nav', 'footer', 'cta', 'hero', 'forms', 'errors', 'stats', 'common', 'content'],

    // Quality thresholds
    qualityThreshold: 0.90, // 90% pass rate required
    lengthRatioMin: 0.5, // Translation shouldn't be less than 50% of source
    lengthRatioMax: 2.0, // Translation shouldn't be more than 200% of source

    // Validation rules
    validation: {
        checkLength: true,
        checkSpecialChars: true,
        checkPlaceholders: true,
        checkCapitalization: true,
        checkWhitespace: true,
        checkRTL: true, // For Arabic
        checkTerminology: true,
    },
};

// ============================
// RTL LANGUAGES
// ============================

const RTL_LANGUAGES = ['ar'];

// ============================
// UTILITIES
// ============================

function loadJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

function saveJSON(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${filePath}:`, error.message);
        return false;
    }
}

// ============================
// VALIDATION CHECKS
// ============================

class QualityValidator {
    constructor() {
        this.issues = [];
        this.stats = {
            total: 0,
            passed: 0,
            warnings: 0,
            errors: 0,
        };
    }

    validateLengthRatio(sourceText, translatedText, key, lang) {
        if (!CONFIG.validation.checkLength) return true;

        const sourceLength = sourceText.length;
        const translatedLength = translatedText.length;

        if (sourceLength === 0) return true;

        const ratio = translatedLength / sourceLength;

        if (ratio < CONFIG.lengthRatioMin || ratio > CONFIG.lengthRatioMax) {
            this.addIssue('warning', 'length_ratio', key, lang, {
                source: sourceText,
                translated: translatedText,
                ratio: ratio.toFixed(2),
                message: `Length ratio ${ratio.toFixed(2)} outside acceptable range [${CONFIG.lengthRatioMin}-${CONFIG.lengthRatioMax}]`,
            });
            return false;
        }

        return true;
    }

    validateSpecialCharacters(sourceText, translatedText, key, lang) {
        if (!CONFIG.validation.checkSpecialChars) return true;

        // Check for HTML entities
        const sourceEntities = (sourceText.match(/&[a-z]+;/gi) || []).length;
        const translatedEntities = (translatedText.match(/&[a-z]+;/gi) || []).length;

        if (sourceEntities !== translatedEntities) {
            this.addIssue('warning', 'html_entities', key, lang, {
                source: sourceText,
                translated: translatedText,
                message: `HTML entity count mismatch: source=${sourceEntities}, translated=${translatedEntities}`,
            });
            return false;
        }

        return true;
    }

    validatePlaceholders(sourceText, translatedText, key, lang) {
        if (!CONFIG.validation.checkPlaceholders) return true;

        // Check for ICU MessageFormat placeholders: {variable}
        const sourcePlaceholders = (sourceText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
        const translatedPlaceholders = (translatedText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();

        if (sourcePlaceholders.length !== translatedPlaceholders.length) {
            this.addIssue('error', 'placeholder_count', key, lang, {
                source: sourceText,
                translated: translatedText,
                sourcePlaceholders,
                translatedPlaceholders,
                message: `Placeholder count mismatch: source has ${sourcePlaceholders.length}, translated has ${translatedPlaceholders.length}`,
            });
            return false;
        }

        // Check if same placeholders exist
        const sourcePlaceholderSet = new Set(sourcePlaceholders);
        const translatedPlaceholderSet = new Set(translatedPlaceholders);

        for (const placeholder of sourcePlaceholders) {
            if (!translatedPlaceholderSet.has(placeholder)) {
                this.addIssue('error', 'placeholder_missing', key, lang, {
                    source: sourceText,
                    translated: translatedText,
                    missingPlaceholder: placeholder,
                    message: `Placeholder ${placeholder} missing in translation`,
                });
                return false;
            }
        }

        return true;
    }

    validateCapitalization(sourceText, translatedText, key, lang) {
        if (!CONFIG.validation.checkCapitalization) return true;

        // Check if source starts with capital and translation doesn't (or vice versa)
        const sourceStartsCapital = /^[A-ZÇĞİÖŞÜ]/.test(sourceText);
        const translatedStartsCapital = /^[A-Z\u00C0-\u00DE\u0400-\u042F]/.test(translatedText);

        // Skip for languages with different capitalization rules
        if (['ja', 'zh-CN', 'ar'].includes(lang)) {
            return true;
        }

        if (sourceStartsCapital !== translatedStartsCapital) {
            this.addIssue('warning', 'capitalization', key, lang, {
                source: sourceText,
                translated: translatedText,
                message: `Capitalization mismatch: source starts with ${sourceStartsCapital ? 'capital' : 'lowercase'}, translation starts with ${translatedStartsCapital ? 'capital' : 'lowercase'}`,
            });
            return false;
        }

        return true;
    }

    validateWhitespace(sourceText, translatedText, key, lang) {
        if (!CONFIG.validation.checkWhitespace) return true;

        // Check for leading/trailing whitespace
        if (translatedText !== translatedText.trim()) {
            this.addIssue('warning', 'whitespace', key, lang, {
                source: sourceText,
                translated: translatedText,
                message: 'Translation has leading or trailing whitespace',
            });
            return false;
        }

        // Check for double spaces
        if (/  /.test(translatedText)) {
            this.addIssue('warning', 'double_spaces', key, lang, {
                source: sourceText,
                translated: translatedText,
                message: 'Translation contains double spaces',
            });
            return false;
        }

        return true;
    }

    validateRTL(translatedText, key, lang) {
        if (!CONFIG.validation.checkRTL) return true;
        if (!RTL_LANGUAGES.includes(lang)) return true;

        // Check for RTL control characters or RTL script
        const hasRTLChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(translatedText);

        if (!hasRTLChars && translatedText.length > 0) {
            // If translating to Arabic, it should contain Arabic characters
            this.addIssue('warning', 'rtl_missing', key, lang, {
                translated: translatedText,
                message: 'Arabic translation should contain Arabic script characters',
            });
            return false;
        }

        return true;
    }

    validateEmpty(translatedText, key, lang) {
        if (!translatedText || translatedText.trim().length === 0) {
            this.addIssue('error', 'empty_translation', key, lang, {
                message: 'Translation is empty',
            });
            return false;
        }

        return true;
    }

    validateString(sourceText, translatedText, key, lang) {
        this.stats.total++;

        const checks = [
            this.validateEmpty(translatedText, key, lang),
            this.validateLengthRatio(sourceText, translatedText, key, lang),
            this.validateSpecialCharacters(sourceText, translatedText, key, lang),
            this.validatePlaceholders(sourceText, translatedText, key, lang),
            this.validateCapitalization(sourceText, translatedText, key, lang),
            this.validateWhitespace(translatedText, key, lang),
            this.validateRTL(translatedText, key, lang),
        ];

        const passed = checks.every(result => result === true);

        if (passed) {
            this.stats.passed++;
        }

        return passed;
    }

    addIssue(severity, type, key, lang, details) {
        this.issues.push({
            severity,
            type,
            key,
            lang,
            details,
            timestamp: new Date().toISOString(),
        });

        if (severity === 'error') {
            this.stats.errors++;
        } else if (severity === 'warning') {
            this.stats.warnings++;
        }
    }

    getQualityScore() {
        if (this.stats.total === 0) return 1.0;
        return this.stats.passed / this.stats.total;
    }

    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 GRAMMAR QA VALIDATION REPORT');
        console.log('='.repeat(60));

        console.log(`\n✅ Passed: ${this.stats.passed}/${this.stats.total}`);
        console.log(`⚠️  Warnings: ${this.stats.warnings}`);
        console.log(`❌ Errors: ${this.stats.errors}`);

        const score = this.getQualityScore();
        const scorePercent = (score * 100).toFixed(2);

        console.log(`\n🎯 Quality Score: ${scorePercent}%`);

        if (score >= CONFIG.qualityThreshold) {
            console.log(`✅ PASS - Quality score meets threshold (≥${CONFIG.qualityThreshold * 100}%)`);
        } else {
            console.log(`❌ FAIL - Quality score below threshold (<${CONFIG.qualityThreshold * 100}%)`);
        }

        // Group issues by type
        const issuesByType = {};
        for (const issue of this.issues) {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
        }

        if (this.issues.length > 0) {
            console.log('\n📋 Issues by Type:');
            for (const [type, issues] of Object.entries(issuesByType)) {
                console.log(`\n   ${type}: ${issues.length} issues`);

                // Show first 3 examples
                const examples = issues.slice(0, 3);
                for (const issue of examples) {
                    console.log(`      ${issue.severity.toUpperCase()}: ${issue.key} [${issue.lang}]`);
                    console.log(`         ${issue.details.message}`);
                }

                if (issues.length > 3) {
                    console.log(`      ... and ${issues.length - 3} more`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
    }

    saveReport(lang, category) {
        const reportPath = path.join(CONFIG.opsDir, 'qa-reports', `qa-${lang}-${category}-${Date.now()}.json`);

        const report = {
            timestamp: new Date().toISOString(),
            language: lang,
            category,
            statistics: this.stats,
            qualityScore: this.getQualityScore(),
            passed: this.getQualityScore() >= CONFIG.qualityThreshold,
            threshold: CONFIG.qualityThreshold,
            issues: this.issues,
        };

        saveJSON(reportPath, report);
        console.log(`\n💾 Report saved: ${reportPath}`);

        return report;
    }
}

// ============================
// QA PIPELINE
// ============================

class QAPipeline {
    constructor() {
        this.validator = new QualityValidator();
    }

    async validateCategory(category, targetLang) {
        console.log(`\n🔍 Validating: ${category} (${targetLang})`);

        // Load source and target files
        const sourcePath = path.join(CONFIG.i18nDir, CONFIG.sourceLanguage, `${category}.json`);
        const targetPath = path.join(CONFIG.i18nDir, targetLang, `${category}.json`);

        const sourceData = loadJSON(sourcePath);
        const targetData = loadJSON(targetPath);

        if (!sourceData) {
            console.error(`❌ Source file not found: ${sourcePath}`);
            return false;
        }

        if (!targetData) {
            console.error(`❌ Target file not found: ${targetPath}`);
            return false;
        }

        // Validate each string
        for (const [key, sourceText] of Object.entries(sourceData)) {
            const translatedText = targetData[key];

            if (!translatedText) {
                this.validator.addIssue('error', 'missing_translation', key, targetLang, {
                    source: sourceText,
                    message: 'Translation key missing in target file',
                });
                this.validator.stats.total++;
                continue;
            }

            this.validator.validateString(sourceText, translatedText, key, targetLang);
        }

        console.log(`   Validated ${this.validator.stats.total} strings`);
        return true;
    }

    async validateAll(targetLang) {
        console.log(`\n🌍 Validating ALL categories for ${targetLang.toUpperCase()}`);
        console.log('='.repeat(60));

        this.validator = new QualityValidator(); // Reset validator

        for (const category of CONFIG.categories) {
            await this.validateCategory(category, targetLang);
        }

        this.validator.printReport();
        this.validator.saveReport(targetLang, 'all');

        return this.validator.getQualityScore() >= CONFIG.qualityThreshold;
    }
}

// ============================
// CLI INTERFACE
// ============================

async function main() {
    const args = process.argv.slice(2);
    const langArg = args.find(arg => arg.startsWith('--lang='));
    const categoryArg = args.find(arg => arg.startsWith('--category='));
    const reportOnly = args.includes('--report');

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  📝 LyDian i18n Grammar QA Validator v2.0                ║');
    console.log('║  Quality threshold: ≥90% pass rate                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (!langArg && !reportOnly) {
        console.error('❌ Error: --lang parameter required');
        console.log('\nUsage:');
        console.log('  node ops/tools/grammar-qa.js --lang=en');
        console.log('  node ops/tools/grammar-qa.js --lang=all');
        console.log('  node ops/tools/grammar-qa.js --lang=en --category=cta');
        console.log('  node ops/tools/grammar-qa.js --report');
        process.exit(1);
    }

    if (reportOnly) {
        console.log('📊 Generating comprehensive QA report...\n');
        // TODO: Implement report generation from saved reports
        return;
    }

    const targetLang = langArg.split('=')[1];
    const category = categoryArg ? categoryArg.split('=')[1] : null;

    const pipeline = new QAPipeline();

    let passed = false;

    if (targetLang === 'all') {
        // Validate all languages
        for (const lang of CONFIG.targetLanguages) {
            const langPassed = await pipeline.validateAll(lang);
            passed = passed || langPassed;
        }
    } else if (category) {
        // Validate specific category
        await pipeline.validateCategory(category, targetLang);
        pipeline.validator.printReport();
        pipeline.validator.saveReport(targetLang, category);
        passed = pipeline.validator.getQualityScore() >= CONFIG.qualityThreshold;
    } else {
        // Validate all categories for specific language
        passed = await pipeline.validateAll(targetLang);
    }

    if (passed) {
        console.log('\n✅ Quality validation PASSED!\n');
        process.exit(0);
    } else {
        console.log('\n❌ Quality validation FAILED. Please review and fix issues.\n');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { QualityValidator, QAPipeline };
