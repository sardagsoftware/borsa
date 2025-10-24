#!/usr/bin/env node

/**
 * TIER 2A SEO VALIDATION SCRIPT
 *
 * Validates all Tier 2A SEO content
 * - Title length (30-65 chars)
 * - Description length (80-165 chars)
 * - Keywords count (3-10 keywords)
 *
 * @version 1.0.0
 * @date 2025-10-25
 */

const { TIER_2A_CONTENT } = require('./tier2a-seo-content');

const LANGUAGES = ['tr', 'en', 'de', 'ar', 'ru', 'zh'];

function validateSEO(page, lang, content) {
  const errors = [];
  const warnings = [];

  // Title validation (30-65 chars)
  if (!content.title) {
    errors.push(`Missing title`);
  } else if (content.title.length < 30) {
    errors.push(`Title too short: ${content.title.length} chars (min 30)`);
  } else if (content.title.length > 65) {
    errors.push(`Title too long: ${content.title.length} chars (max 65)`);
  }

  // Description validation (80-165 chars)
  if (!content.description) {
    errors.push(`Missing description`);
  } else if (content.description.length < 80) {
    errors.push(`Description too short: ${content.description.length} chars (min 80)`);
  } else if (content.description.length > 165) {
    errors.push(`Description too long: ${content.description.length} chars (max 165)`);
  }

  // Keywords validation (3-10 keywords)
  if (!content.keywords) {
    errors.push(`Missing keywords`);
  } else {
    const keywordCount = content.keywords.split(',').length;
    if (keywordCount < 3) {
      warnings.push(`Too few keywords: ${keywordCount} (recommended 3-10)`);
    } else if (keywordCount > 10) {
      errors.push(`Too many keywords: ${keywordCount} (max 10, avoid stuffing)`);
    }
  }

  return {
    page,
    lang,
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      titleLength: content.title?.length || 0,
      descLength: content.description?.length || 0,
      keywordCount: content.keywords?.split(',').length || 0
    }
  };
}

function main() {
  console.log('🔍 TIER 2A SEO VALIDATION\n');
  console.log('━'.repeat(60));

  const results = [];
  let totalValid = 0;
  let totalErrors = 0;

  const pages = Object.keys(TIER_2A_CONTENT);

  console.log(`📄 Pages: ${pages.length}`);
  console.log(`🌍 Languages: ${LANGUAGES.length}`);
  console.log(`📦 Total packages: ${pages.length * LANGUAGES.length}\n`);
  console.log('━'.repeat(60));

  for (const page of pages) {
    console.log(`\n📄 ${page}`);

    for (const lang of LANGUAGES) {
      const content = TIER_2A_CONTENT[page][lang];
      const result = validateSEO(page, lang, content);
      results.push(result);

      if (result.valid) {
        totalValid++;
        console.log(`  ✅ ${lang.toUpperCase()}: PASS (title: ${result.stats.titleLength}, desc: ${result.stats.descLength}, kw: ${result.stats.keywordCount})`);
      } else {
        totalErrors += result.errors.length;
        console.log(`  ❌ ${lang.toUpperCase()}: FAIL`);
        result.errors.forEach(err => console.log(`     - ${err}`));
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(warn => console.log(`     ⚠️  ${warn}`));
      }
    }
  }

  // Summary
  const totalPackages = pages.length * LANGUAGES.length;
  const successRate = ((totalValid / totalPackages) * 100).toFixed(1);

  console.log('\n' + '━'.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('━'.repeat(60));
  console.log(`Total Packages:    ${totalPackages}`);
  console.log(`✅ Valid:          ${totalValid}/${totalPackages}`);
  console.log(`❌ Invalid:        ${totalPackages - totalValid}/${totalPackages}`);
  console.log(`📈 Success Rate:   ${successRate}%`);
  console.log(`🐛 Total Errors:   ${totalErrors}`);
  console.log('━'.repeat(60));

  if (totalValid === totalPackages) {
    console.log('\n🎉 ALL VALIDATIONS PASSED! 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${totalPackages - totalValid} packages failed validation.\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateSEO };
