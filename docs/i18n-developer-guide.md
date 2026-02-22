# 🌍 LyDian i18n Developer Guide

**Version:** 2.0.0
**Last Updated:** 2025-10-07
**Audience:** Frontend & Backend Developers

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Developer Workflow](#developer-workflow)
4. [CLI Reference](#cli-reference)
5. [Frontend Integration](#frontend-integration)
6. [Backend Integration](#backend-integration)
7. [Git Hooks & CI/CD](#git-hooks--cicd)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## 🚀 Quick Start

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/lydiansoftware/borsa.git
cd ailydian-ultra-pro

# 2. Install dependencies
npm install

# 3. Install git hooks
./scripts/install-hooks.sh

# 4. Initialize i18n system
node ops/tools/lydian-i18n.js init
```

### First Translation

```bash
# 1. Extract strings from source files
node ops/tools/lydian-i18n.js extract --all

# 2. Translate to English
node ops/tools/lydian-i18n.js translate --lang=en

# 3. Validate translations
node ops/tools/lydian-i18n.js validate --lang=en

# 4. Check status
node ops/tools/lydian-i18n.js status
```

---

## 🏗️ System Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LyDian i18n System                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │  Frontend   │    │  Backend    │    │   DevOps    │   │
│  │  (Browser)  │◄──►│ (Node.js)   │◄──►│  (CI/CD)    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Core Components                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • locale-engine.js       - Client-side i18n engine        │
│  • locale-switcher.js     - Language selector UI           │
│  • i18n-rtl.css          - RTL support (Arabic)           │
│  • translate-pipeline.js  - Azure Translator API          │
│  • grammar-qa.js          - Quality validation            │
│  • glossary.json          - Protected terms               │
│  • translation-memory.json - Translation cache            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
ailydian-ultra-pro/
├── public/
│   ├── i18n/
│   │   └── v2/                    # Translation files
│   │       ├── tr/                # Turkish (source)
│   │       │   ├── nav.json
│   │       │   ├── footer.json
│   │       │   ├── cta.json
│   │       │   ├── hero.json
│   │       │   ├── forms.json
│   │       │   ├── errors.json
│   │       │   ├── stats.json
│   │       │   ├── common.json
│   │       │   ├── content.json
│   │       │   └── index.json     # Combined file
│   │       ├── en/                # English
│   │       ├── de/                # German
│   │       ├── fr/                # French
│   │       ├── es/                # Spanish
│   │       ├── ar/                # Arabic
│   │       ├── ru/                # Russian
│   │       ├── it/                # Italian
│   │       ├── ja/                # Japanese
│   │       └── zh-CN/             # Chinese
│   ├── js/
│   │   ├── locale-engine.js       # i18n engine
│   │   └── locale-switcher.js     # Language selector
│   └── css/
│       └── i18n-rtl.css           # RTL support
│
├── ops/
│   ├── i18n/
│   │   ├── glossary.json          # Protected terms
│   │   └── translation-memory.json # Translation cache
│   ├── tools/
│   │   ├── lydian-i18n.js         # CLI wrapper
│   │   ├── extract-i18n-strings.js # String extraction
│   │   ├── translate-pipeline.js  # Translation automation
│   │   └── grammar-qa.js          # Quality validation
│   └── reports/                   # Generated reports
│
├── .githooks/
│   └── pre-commit                 # Git pre-commit hook
│
├── .github/
│   └── workflows/
│       └── i18n-validation.yml    # CI/CD workflow
│
├── scripts/
│   └── install-hooks.sh           # Hook installer
│
└── docs/
    └── i18n-developer-guide.md    # This file
```

---

## 👨‍💻 Developer Workflow

### Scenario 1: Adding New Content

**Problem:** You're adding a new feature with text content

**Solution:**

1. **Write HTML with i18n keys:**

```html
<button data-i18n="cta.startTrial">Start Free Trial</button>
<p data-i18n="hero.subtitle">AI-powered platform</p>
```

2. **Extract strings:**

```bash
node ops/tools/lydian-i18n.js extract --all
```

This creates entries in `public/i18n/v2/tr/cta.json`:

```json
{
  "cta.startTrial": "Ücretsiz Deneme Başlat",
  "hero.subtitle": "AI destekli platform"
}
```

3. **Translate to all languages:**

```bash
node ops/tools/lydian-i18n.js translate --lang=all
```

4. **Validate translations:**

```bash
node ops/tools/lydian-i18n.js validate --lang=all
```

5. **Test in browser:**

```html
<script src="/js/locale-engine.js"></script>
<script>
  const i18n = new LocaleEngine();
  await i18n.init();

  // Now all data-i18n elements are translated automatically
</script>
```

6. **Commit:**

```bash
git add public/i18n/v2/
git commit -m "feat(i18n): Add new feature translations"
# Pre-commit hook validates automatically
```

---

### Scenario 2: Updating Existing Translations

**Problem:** Need to fix a translation or update wording

**Solution:**

1. **Edit source file (Turkish):**

Edit `public/i18n/v2/tr/nav.json`:

```json
{
  "nav.dashboard": "Kontrol Paneli"  // Changed from "Panel"
}
```

2. **Re-translate affected languages:**

```bash
# Translate only English
node ops/tools/lydian-i18n.js translate --lang=en

# Or translate all
node ops/tools/lydian-i18n.js translate --lang=all
```

3. **Validate:**

```bash
node ops/tools/lydian-i18n.js validate --lang=en
```

4. **Commit:**

```bash
git add public/i18n/v2/
git commit -m "fix(i18n): Update dashboard label"
```

---

### Scenario 3: Adding Protected Terms (Brand Names)

**Problem:** Need to protect "LyDian IQ" from translation

**Solution:**

1. **Edit glossary:**

Edit `ops/i18n/glossary.json`:

```json
{
  "version": "2.0.0",
  "terms": {
    "LyDian IQ": {
      "category": "brand",
      "protect": true,
      "note": "Product name - never translate",
      "tr": "LyDian IQ",
      "en": "LyDian IQ",
      "de": "LyDian IQ",
      "fr": "LyDian IQ",
      "es": "LyDian IQ",
      "ar": "LyDian IQ",
      "ru": "LyDian IQ",
      "it": "LyDian IQ",
      "ja": "LyDian IQ",
      "zh-CN": "LyDian IQ"
    }
  },
  "protectedPatterns": [
    "^LyDian.*"  // Protects anything starting with "LyDian"
  ]
}
```

2. **Re-translate:**

```bash
node ops/tools/lydian-i18n.js translate --lang=all
# Now "LyDian IQ" won't be translated
```

---

## 🛠️ CLI Reference

### `lydian-i18n` Commands

```bash
# Initialize i18n system
node ops/tools/lydian-i18n.js init

# Extract strings from HTML files
node ops/tools/lydian-i18n.js extract --all
node ops/tools/lydian-i18n.js extract --file=public/index.html

# Translate strings
node ops/tools/lydian-i18n.js translate --lang=en
node ops/tools/lydian-i18n.js translate --lang=all
node ops/tools/lydian-i18n.js translate --lang=en --category=cta

# Validate translations
node ops/tools/lydian-i18n.js validate --lang=en
node ops/tools/lydian-i18n.js validate --lang=all

# Sync translation memory
node ops/tools/lydian-i18n.js sync

# Show system status
node ops/tools/lydian-i18n.js status
```

---

## 🌐 Frontend Integration

### Basic Setup

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>LyDian</title>

  <!-- RTL support for Arabic -->
  <link rel="stylesheet" href="/css/i18n-rtl.css">
</head>
<body>

  <!-- Language selector -->
  <div id="locale-switcher"></div>

  <!-- i18n content -->
  <h1 data-i18n="hero.title">Yapay Zeka Platformu</h1>
  <button data-i18n="cta.getStarted">Başlayın</button>

  <!-- Load i18n scripts -->
  <script src="/js/locale-engine.js"></script>
  <script src="/js/locale-switcher.js"></script>

  <script>
    (async () => {
      // Initialize i18n engine
      const i18n = new LocaleEngine({
        defaultLocale: 'tr',
        autoDetect: true
      });

      await i18n.init();

      // Apply translations to DOM
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = i18n.t(key);
      });

      // Initialize language switcher
      new LocaleSwitcher('#locale-switcher', {
        i18nEngine: i18n,
        autoReload: true
      });
    })();
  </script>
</body>
</html>
```

### Dynamic Content Translation

```javascript
// Translate string programmatically
const greeting = i18n.t('hero.greeting', { name: 'Emrah' });
// Turkish: "Merhaba, Emrah!"
// English: "Hello, Emrah!"

// Format numbers
const price = i18n.formatNumber(1234.56);
// Turkish: "1.234,56"
// English: "1,234.56"

// Format dates
const date = i18n.formatDate(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// Turkish: "7 Ekim 2025"
// English: "October 7, 2025"

// Format currency
const amount = i18n.formatCurrency(99.99, 'USD');
// Turkish: "$99,99"
// English: "$99.99"
```

### Locale Change Callback

```javascript
// React to locale changes
i18n.subscribe((newLocale) => {
  console.log(`Language changed to: ${newLocale}`);

  // Update all translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n.t(key);
  });

  // Update page title
  document.title = i18n.t('meta.title');
});
```

---

## 🔧 Backend Integration

### Server-Side Translation (Optional)

If you need server-side rendering (SSR), integrate the translation system:

```javascript
// server.js
const fs = require('fs');
const path = require('path');

class ServerI18n {
  constructor(locale = 'tr') {
    this.locale = locale;
    this.translations = {};
    this.loadTranslations();
  }

  loadTranslations() {
    const i18nDir = path.join(__dirname, 'public/i18n/v2', this.locale);
    const indexPath = path.join(i18nDir, 'index.json');

    if (fs.existsSync(indexPath)) {
      this.translations = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }
  }

  t(key, params = {}) {
    let translation = this.translations[key] || key;

    // Simple parameter replacement
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });

    return translation;
  }
}

// Express middleware
app.use((req, res, next) => {
  const locale = req.cookies.ailydian_locale ||
                 req.query.lang ||
                 req.acceptsLanguages(['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN']) ||
                 'tr';

  req.i18n = new ServerI18n(locale);
  next();
});

// Use in routes
app.get('/', (req, res) => {
  res.render('index', {
    title: req.i18n.t('meta.title'),
    greeting: req.i18n.t('hero.greeting', { name: 'User' })
  });
});
```

---

## 🚀 Git Hooks & CI/CD

### Pre-Commit Hook

The pre-commit hook automatically validates:

- ✅ JSON syntax in translation files
- ✅ Translation completeness
- ✅ Glossary consistency
- ✅ Security issues (XSS, RTL spoofing)
- ✅ Missing translation keys

**Install:**

```bash
./scripts/install-hooks.sh
```

**Bypass (not recommended):**

```bash
git commit --no-verify
```

### GitHub Actions Workflow

On every pull request, the CI pipeline runs:

1. **Extract Strings** - Ensures all strings are extracted
2. **Validate Translations** - Runs Grammar QA for all 9 languages
3. **Check Completeness** - Verifies translation coverage
4. **Validate Glossary** - Checks glossary.json syntax
5. **Security Scan** - Scans for XSS and RTL spoofing
6. **Final Report** - Posts summary to PR

**View workflow:**
`.github/workflows/i18n-validation.yml`

---

## ✅ Best Practices

### 1. **Always use i18n keys, never hardcode text**

❌ **Bad:**

```html
<button>Start Free Trial</button>
```

✅ **Good:**

```html
<button data-i18n="cta.startTrial">Start Free Trial</button>
```

### 2. **Use semantic key names**

❌ **Bad:**

```json
{
  "text1": "Dashboard",
  "button2": "Submit"
}
```

✅ **Good:**

```json
{
  "nav.dashboard": "Dashboard",
  "cta.submit": "Submit"
}
```

### 3. **Organize keys by category**

- `nav.*` - Navigation items
- `footer.*` - Footer content
- `cta.*` - Call-to-action buttons
- `hero.*` - Hero section
- `forms.*` - Form labels/placeholders
- `errors.*` - Error messages
- `stats.*` - Statistics/numbers
- `common.*` - Common words (Save, Cancel, etc.)
- `content.*` - Long-form content

### 4. **Protect brand names in glossary**

Add all brand names, product names, and technical terms to `ops/i18n/glossary.json` to prevent translation.

### 5. **Test RTL layout for Arabic**

Always test Arabic layout with `?lang=ar` to ensure proper RTL rendering.

### 6. **Use placeholders for dynamic content**

```json
{
  "greeting": "Hello, {name}!",
  "itemCount": "You have {count} items"
}
```

```javascript
i18n.t('greeting', { name: 'Emrah' });
// Output: "Hello, Emrah!"
```

### 7. **Run validation before committing**

```bash
node ops/tools/lydian-i18n.js validate --lang=all
```

### 8. **Keep translation keys under 100 characters**

Long keys are harder to maintain. Split into multiple keys if needed.

---

## 🐛 Troubleshooting

### Problem: Translation not showing

**Solution:**

1. Check if key exists:
   ```bash
   grep -r "your.key" public/i18n/v2/tr/
   ```

2. Check browser console for errors:
   ```
   Translation not found: your.key
   ```

3. Re-extract strings:
   ```bash
   node ops/tools/lydian-i18n.js extract --all
   ```

### Problem: Language not switching

**Solution:**

1. Check locale detection:
   ```javascript
   console.log(i18n.getCurrentLocale());
   ```

2. Clear cookies:
   ```javascript
   document.cookie = 'ailydian_locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
   ```

3. Force locale:
   ```javascript
   await i18n.setLocale('en');
   ```

### Problem: RTL layout broken for Arabic

**Solution:**

1. Check if RTL CSS is loaded:
   ```html
   <link rel="stylesheet" href="/css/i18n-rtl.css">
   ```

2. Check dir attribute:
   ```javascript
   console.log(document.documentElement.dir); // Should be "rtl"
   ```

3. Test with:
   ```
   http://localhost:3100?lang=ar
   ```

### Problem: GitHub Actions CI failing

**Solution:**

1. Check workflow logs at:
   ```
   https://github.com/lydiansoftware/borsa/actions
   ```

2. Run validation locally:
   ```bash
   node ops/tools/lydian-i18n.js validate --lang=all
   ```

3. Fix issues and push again

---

## ❓ FAQ

### Q: How do I add a new language?

**A:**

1. Add language code to `ops/tools/lydian-i18n.js`:
   ```javascript
   supportedLanguages: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN', 'pt']
   ```

2. Run translation:
   ```bash
   node ops/tools/lydian-i18n.js translate --lang=pt
   ```

3. Update locale-engine.js and locale-switcher.js

### Q: Can I translate without Azure API key?

**A:** Yes! The system falls back to mock translation mode if `AZURE_TRANSLATOR_KEY` is not set. Mock translations preserve the source text with a language prefix.

### Q: How do I update existing translations?

**A:**

1. Edit source (Turkish) files in `public/i18n/v2/tr/`
2. Re-run translation pipeline
3. Validate with Grammar QA

### Q: What's the quality threshold?

**A:** Default is **90%**. Translations must pass:
- Length ratio check (50%-200% of source)
- Placeholder preservation
- RTL script validation (for Arabic)
- No XSS vulnerabilities

### Q: How do I translate placeholders?

**A:** Placeholders like `{name}`, `{count}` are automatically preserved and not translated.

### Q: Can I use React/Vue/Angular?

**A:** Yes! The `locale-engine.js` is framework-agnostic. You can integrate it with any frontend framework. See examples:

**React:**
```javascript
import { useEffect, useState } from 'react';

function useTranslation() {
  const [i18n, setI18n] = useState(null);

  useEffect(() => {
    const engine = new LocaleEngine();
    engine.init().then(() => setI18n(engine));
  }, []);

  return { t: i18n?.t.bind(i18n) };
}

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('cta.submit')}</button>;
}
```

---

## 📞 Support

**Issues:**
https://github.com/lydiansoftware/borsa/issues

**Documentation:**
https://docs.ailydian.com/i18n

**Slack:**
#i18n-support

---

## 📝 Changelog

### v2.0.0 (2025-10-07)
- ✅ Complete system rewrite
- ✅ Azure Translator integration
- ✅ CLI wrapper (lydian-i18n.js)
- ✅ GitHub Actions workflow
- ✅ Pre-commit hooks
- ✅ RTL support for Arabic
- ✅ 10 languages supported
- ✅ 8,548 translation keys

---

**Made with ❤️ by LyDian AI Platform**
