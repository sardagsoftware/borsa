# 🌍 LyDian i18n Translation System - Setup Guide

## Overview

Enterprise-grade internationalization system supporting 10 languages with:
- **8,548 translation keys** extracted from 112 pages
- **9 category-based** translation files (nav, footer, cta, hero, forms, errors, stats, common, content)
- **Azure Translator API** integration with fallback mock mode
- **Glossary protection** for brand names and technical terms
- **Translation Memory** for consistency across updates
- **Grammar QA validation** (>90% threshold)

## Languages Supported

| Code | Language | Status | RTL |
|------|----------|--------|-----|
| `tr` | Turkish (source) | ✅ Complete | No |
| `en` | English | ✅ Complete | No |
| `de` | German | ✅ Complete | No |
| `fr` | French | ✅ Complete | No |
| `es` | Spanish | ✅ Complete | No |
| `ar` | Arabic | ✅ Complete | Yes |
| `ru` | Russian | ✅ Complete | No |
| `it` | Italian | ✅ Complete | No |
| `ja` | Japanese | ✅ Complete | No |
| `zh-CN` | Chinese (Simplified) | ✅ Complete | No |

## Directory Structure

```
/public/i18n/v2/
├── tr/           # Source language (Turkish)
│   ├── nav.json           # 129 keys - Navigation menu
│   ├── footer.json        # 14 keys - Footer links
│   ├── cta.json           # 436 keys - Call-to-action buttons
│   ├── hero.json          # 85 keys - Hero sections
│   ├── forms.json         # 462 keys - Form labels/placeholders
│   ├── errors.json        # 29 keys - Error messages
│   ├── stats.json         # 377 keys - Statistics/metrics
│   ├── common.json        # 7 keys - Common UI elements
│   ├── content.json       # 7,009 keys - Body content
│   └── index.json         # 8,548 keys - All combined
├── en/           # English translations
├── de/           # German translations
├── fr/           # French translations
├── es/           # Spanish translations
├── ar/           # Arabic translations (RTL)
├── ru/           # Russian translations
├── it/           # Italian translations
├── ja/           # Japanese translations
└── zh-CN/        # Chinese (Simplified) translations

/ops/i18n/
├── glossary.json           # Protected terms and translations
├── translation-memory.json # Translation consistency database
└── qa-reports/            # Grammar QA validation reports

/ops/tools/
├── extract-i18n-strings.js   # String extraction CLI
├── translate-pipeline.js     # Translation pipeline with Azure API
└── grammar-qa.js             # Quality validation tool
```

## Azure Translator API Setup

### Option 1: Using Azure Translator (Production)

1. **Create Azure Translator Resource:**
   ```bash
   az cognitiveservices account create \
     --name lydian-translator \
     --resource-group lydian-rg \
     --kind TextTranslation \
     --sku S1 \
     --location westeurope \
     --yes
   ```

2. **Get API Key:**
   ```bash
   az cognitiveservices account keys list \
     --name lydian-translator \
     --resource-group lydian-rg
   ```

3. **Set Environment Variables:**
   ```bash
   # Add to .env or Vercel environment variables
   AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
   AZURE_TRANSLATOR_KEY=your_api_key_here
   AZURE_TRANSLATOR_REGION=westeurope
   ```

4. **Run Translation Pipeline:**
   ```bash
   # Translate all languages
   node ops/tools/translate-pipeline.js --lang=all

   # Translate specific language
   node ops/tools/translate-pipeline.js --lang=en

   # Translate specific category
   node ops/tools/translate-pipeline.js --lang=en --category=cta
   ```

### Option 2: Mock Mode (Development/Testing)

If Azure API key is not configured, the system automatically falls back to mock translations:

```bash
# Mock translations will be prefixed with [LANG] tag
# Example: "Giriş Yap" → "[EN] Giriş Yap"

node ops/tools/translate-pipeline.js --lang=en
```

**Note:** Mock translations are useful for:
- Development and testing
- CI/CD pipeline validation
- Structure verification before production translation

## Translation Workflow

### 1. Extract Strings (Already Complete)

```bash
# Extract all strings from HTML/JS files
node ops/tools/extract-i18n-strings.js --all

# Output: public/i18n/v2/tr/*.json (8,548 keys)
```

### 2. Translate to Target Languages

```bash
# Translate all languages (9 languages × 9 categories = 81 files)
node ops/tools/translate-pipeline.js --lang=all

# Estimated time:
# - With Azure API: ~5-10 minutes
# - With mock mode: ~1-2 minutes

# Progress is saved after each batch (100 strings)
# Safe to interrupt and resume
```

### 3. Validate Quality

```bash
# Validate all languages
node ops/tools/grammar-qa.js --lang=all

# Validate specific language
node ops/tools/grammar-qa.js --lang=en

# Validate specific category
node ops/tools/grammar-qa.js --lang=en --category=cta

# Quality checks:
# - Empty translations
# - Length ratio (0.5x - 2.0x of source)
# - Placeholder consistency {variable}
# - Special characters (HTML entities)
# - Capitalization matching
# - Whitespace validation
# - RTL script for Arabic
```

### 4. Human Review (Optional but Recommended)

For production deployment, human review is recommended for:
- Critical pages (index, auth, billing)
- Medical/legal domain pages
- Marketing/hero content

**Review priorities:**
1. **High Priority:** nav.json, cta.json, forms.json, errors.json
2. **Medium Priority:** hero.json, footer.json, common.json
3. **Low Priority:** content.json, stats.json

## Glossary Management

Edit `ops/i18n/glossary.json` to protect brand names and technical terms:

```json
{
  "terms": {
    "LyDian": {
      "category": "brand",
      "protect": true,
      "note": "Brand name - never translate",
      "tr": "LyDian",
      "en": "LyDian",
      "de": "LyDian",
      ...
    },
    "dashboard": {
      "category": "ui",
      "protect": false,
      "note": "UI term - translate",
      "tr": "kontrol paneli",
      "en": "dashboard",
      "de": "Dashboard",
      ...
    }
  }
}
```

**Protected patterns** (regex):
```json
{
  "protectedPatterns": [
    "^LyDian.*",        // LyDian, LyDian AI, LyDian IQ, etc.
    "^DrLydian.*",      // DrLydian brand
    "^API$",            // Technical acronym
    "^LyDian Core-\\d+",        // LyDian Core-3, OX5C9E2B, etc.
    ".*@ailydian\\.com$" // Email addresses
  ]
}
```

## Translation Memory

The system automatically builds a translation memory database:

```json
{
  "segments": {
    "seg_abc123": {
      "source": {
        "text": "Giriş Yap",
        "language": "tr",
        "category": "cta"
      },
      "translations": {
        "en": {
          "text": "Sign In",
          "qualityScore": 0.98,
          "method": "azure-translator",
          "validatedAt": "2025-10-07T19:15:00.000Z"
        }
      }
    }
  }
}
```

**Benefits:**
- **Consistency:** Same source text → same translation across files
- **Speed:** Reuse validated translations (no API calls)
- **Cost:** Reduce Azure API usage for repeated strings
- **Quality:** Track quality scores and validation status

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/i18n-validation.yml
name: i18n Quality Check

on:
  pull_request:
    paths:
      - 'public/i18n/**'
      - 'public/**/*.html'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Extract strings
        run: node ops/tools/extract-i18n-strings.js --all

      - name: Validate translations
        run: node ops/tools/grammar-qa.js --lang=all

      - name: Check quality threshold
        run: |
          if [ $? -eq 0 ]; then
            echo "✅ Quality validation passed (≥90%)"
          else
            echo "❌ Quality validation failed (<90%)"
            exit 1
          fi
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "🔍 Validating i18n translations..."

# Check if any i18n files changed
if git diff --cached --name-only | grep -q "public/i18n"; then
    node ops/tools/grammar-qa.js --lang=all

    if [ $? -ne 0 ]; then
        echo "❌ i18n validation failed. Fix issues before committing."
        exit 1
    fi
fi

echo "✅ i18n validation passed"
```

## Performance Optimization

### Bundle Size Management

Each locale file should be loaded independently:

```javascript
// Load only current locale
const locale = detectLocale(); // 'en', 'de', etc.
const translations = await fetch(`/i18n/v2/${locale}/index.json`);

// For category-specific pages, load only needed categories
const navTranslations = await fetch(`/i18n/v2/${locale}/nav.json`);
const ctaTranslations = await fetch(`/i18n/v2/${locale}/cta.json`);
```

### CDN Caching

Configure Vercel/BunnyCDN:

```json
// vercel.json or _headers
{
  "headers": [
    {
      "source": "/i18n/v2/:locale/:category.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Bundle Size Report

```bash
# Check translation file sizes
du -sh public/i18n/v2/*/*.json

# Example output:
# 52K  public/i18n/v2/en/index.json
# 48K  public/i18n/v2/de/index.json
# 56K  public/i18n/v2/ar/index.json (larger due to RTL characters)
```

## Troubleshooting

### Issue: Azure API Rate Limiting

**Solution:** Adjust batch size and retry delay:

```javascript
// ops/tools/translate-pipeline.js
const CONFIG = {
    batchSize: 50,      // Reduce from 100 to 50
    retryDelay: 2000,   // Increase from 1000ms to 2000ms
    maxRetries: 5,      // Increase retries
};
```

### Issue: Quality Score Below 90%

**Solution:** Review failed checks:

```bash
# Generate detailed report
node ops/tools/grammar-qa.js --lang=en > qa-report-en.txt

# Common issues:
# 1. Placeholder mismatch: {variable} missing in translation
# 2. Length ratio: Translation too short/long
# 3. Capitalization: Inconsistent sentence case
# 4. Whitespace: Leading/trailing spaces
```

### Issue: Missing Translations

**Solution:** Run extraction and translation again:

```bash
# Re-extract strings (in case new content was added)
node ops/tools/extract-i18n-strings.js --all

# Re-translate missing keys
node ops/tools/translate-pipeline.js --lang=en
```

### Issue: Inconsistent Translations

**Solution:** Clear translation memory and re-translate:

```bash
# Backup current translation memory
cp ops/i18n/translation-memory.json ops/i18n/translation-memory.backup.json

# Reset translation memory
echo '{"version":"2.0.0","segments":{}}' > ops/i18n/translation-memory.json

# Re-translate
node ops/tools/translate-pipeline.js --lang=all
```

## Cost Estimation

### Azure Translator API Pricing (S1 tier)

- **Standard translation:** $10 per 1M characters
- **Custom translation:** $40 per 1M characters

**For LyDian (8,548 keys, ~500K characters):**
- **One-time translation:** 500K chars × 9 languages = 4.5M chars
- **Cost:** $45 (one-time)
- **Updates:** Minimal (only changed strings via Translation Memory)

### Recommendations

1. **Development:** Use mock mode (free)
2. **Staging:** Use Azure API with Translation Memory
3. **Production:** Human review + Azure API + Translation Memory

## Next Steps

After translation is complete, proceed to:

1. **PHASE 3:** Frontend Locale Engine + SEO
   - Implement locale detection (cookie → URL → Accept-Language)
   - Add hreflang tags for SEO
   - Generate locale-based sitemaps

2. **PHASE 4:** CLI & Dev Workflow
   - Create `lydian-i18n` CLI tool
   - Add developer documentation

3. **PHASE 5:** Security Testing
   - XSS prevention validation
   - RTL spoofing tests
   - Locale path traversal checks

## Support

For issues or questions:
- 📧 Email: dev@ailydian.com
- 📚 Docs: https://docs.ailydian.com/i18n
- 🐛 Issues: https://github.com/ailydian/ailydian-ultra-pro/issues

---

**Last Updated:** 2025-10-07
**Version:** 2.0.0
**Status:** ✅ Translation Pipeline Active
