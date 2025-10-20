# Medical AI i18n Integration Guide

## Overview

Complete internationalization (i18n) system for LyDian Medical AI with support for 8 languages and RTL (Right-to-Left) support.

## Supported Languages

1. **EN** - English (Default/Fallback)
2. **TR** - Turkish (Türkçe)
3. **DE** - German (Deutsch)
4. **FR** - French (Français)
5. **ES** - Spanish (Español)
6. **AR** - Arabic (العربية) - RTL Support
7. **RU** - Russian (Русский)
8. **ZH** - Chinese (中文)

## File Structure

```
/public/
├── i18n/
│   └── medical/
│       ├── en.json          # English translations (baseline)
│       ├── tr.json          # Turkish translations
│       ├── de.json          # German translations
│       ├── fr.json          # French translations
│       ├── es.json          # Spanish translations
│       ├── ar.json          # Arabic translations
│       ├── ru.json          # Russian translations
│       └── zh.json          # Chinese translations
├── js/
│   └── i18n-manager.js      # Core i18n manager
└── css/
    └── rtl-support.css      # RTL language support
```

## Quick Start

### 1. Include Required Files in HTML

Add these scripts to your HTML `<head>` section:

```html
<!-- i18n Manager (load first) -->
<script src="/js/i18n-manager.js"></script>

<!-- RTL Support CSS -->
<link rel="stylesheet" href="/css/rtl-support.css">
```

### 2. Add Language Selector

Add a language selector dropdown in your HTML:

```html
<select id="languageSelector" class="language-selector">
    <!-- Options will be populated automatically -->
</select>
```

### 3. Mark Translatable Elements

Use `data-i18n` attributes to mark elements for translation:

```html
<!-- Text content -->
<h1 data-i18n="app.title">LyDian Medical AI</h1>

<!-- Button text -->
<button data-i18n="buttons.submit">Submit</button>

<!-- Input placeholder -->
<input type="text" data-i18n-placeholder="chat.inputPlaceholder">

<!-- Element title -->
<div data-i18n-title="header.newConsultation">
    <span data-i18n="header.newConsultation">New Consultation</span>
</div>
```

## Usage Examples

### Basic Translation Keys

```javascript
// Get translation
const title = window.medicalI18n.get('app.title');
// Returns: "LyDian Medical AI"

// Shorthand helper
const subtitle = window.t('app.subtitle');
// Returns: "Healthcare Intelligence Expert"

// With parameters
const greeting = window.t('greeting.hello', { name: 'Dr. Smith' });
// Translation: "Hello, {name}!" → "Hello, Dr. Smith!"
```

### Programmatic Language Change

```javascript
// Change to Turkish
await window.medicalI18n.setLanguage('tr');

// Change to Arabic (enables RTL)
await window.medicalI18n.setLanguage('ar');

// Get current language
const current = window.medicalI18n.getCurrentLanguage();
console.log(current);
// { code: 'en', name: 'English', nativeName: 'English', isRTL: false }
```

### Number and Date Formatting

```javascript
// Format numbers (locale-aware)
const formatted = window.medicalI18n.formatNumber(1234.56);
// EN: "1,234.56"
// DE: "1.234,56"
// TR: "1.234,56"

// Format dates
const date = new Date();
const formattedDate = window.medicalI18n.formatDate(date);
// EN: "January 6, 2025"
// TR: "6 Ocak 2025"
// DE: "6. Januar 2025"

// Format time
const time = window.medicalI18n.formatTime(date);
// Returns locale-formatted time
```

### RTL Detection

```javascript
// Check if current language is RTL
if (window.medicalI18n.isRTL()) {
    console.log('RTL mode active');
}

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
    console.log('Language:', event.detail.language);
    console.log('Is RTL:', event.detail.isRTL);
});
```

## Translation Key Structure

Translations are organized hierarchically:

```json
{
  "app": {
    "title": "...",
    "subtitle": "..."
  },
  "header": {
    "newConsultation": "...",
    "emergencyNumbers": "..."
  },
  "specialties": {
    "cardiology": "...",
    "neurology": "..."
  },
  "calculators": {
    "general": {
      "title": "...",
      "vitalSigns": "..."
    }
  }
}
```

Access with dot notation: `app.title`, `calculators.general.title`

## HTML Integration Attributes

### data-i18n

For text content:

```html
<span data-i18n="buttons.save">Save</span>
```

### data-i18n-placeholder

For input placeholders:

```html
<input type="text" data-i18n-placeholder="chat.inputPlaceholder">
```

### data-i18n-title

For title attributes (tooltips):

```html
<button data-i18n-title="chat.voiceInput">🎤</button>
```

### data-i18n-html

For HTML content (use cautiously):

```html
<div data-i18n-html="disclaimer.text"></div>
```

## Adding New Languages

### Step 1: Create Translation File

Create `/public/i18n/medical/[code].json`:

```json
{
  "app": {
    "title": "Translated Title",
    "subtitle": "Translated Subtitle"
  },
  // ... copy structure from en.json and translate
}
```

### Step 2: Register Language

Edit `i18n-manager.js` and add to `availableLanguages`:

```javascript
this.availableLanguages = {
    // ... existing languages
    'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
};
```

### Step 3: Add RTL Support (if needed)

If the language is RTL, add it to `rtlLanguages`:

```javascript
this.rtlLanguages = ['ar', 'he', 'fa', 'ur', 'your-rtl-lang'];
```

## Translation Best Practices

### 1. Medical Terminology Accuracy

- Use professional medical terminology
- Consult medical dictionaries
- Have medical professionals review translations

### 2. Context Preservation

- Maintain medical context in translations
- Preserve abbreviations where appropriate (e.g., "mmHg", "mg/dL")
- Keep units consistent

### 3. Consistency

- Use consistent terminology across all translations
- Maintain the same tone (professional medical)
- Keep button labels short and clear

### 4. Placeholders

Use `{variable}` for dynamic content:

```json
{
  "greeting": "Hello, {name}!",
  "result": "Your {metric} is {value} {unit}"
}
```

## RTL (Right-to-Left) Support

### Automatic RTL Detection

When Arabic, Hebrew, Persian, or Urdu is selected:

1. `<html dir="rtl">` is set automatically
2. `body.rtl` class is added
3. All layouts flip to RTL
4. CSS applies RTL-specific styles

### Testing RTL

```javascript
// Test RTL mode
await window.medicalI18n.setLanguage('ar');

// Verify RTL
console.log(document.dir); // "rtl"
console.log(document.body.classList.contains('rtl')); // true
```

### Custom RTL Styles

Add custom RTL styles in your CSS:

```css
[dir="rtl"] .your-element {
    /* RTL-specific styles */
}

body.rtl .your-element {
    /* Alternative RTL syntax */
}
```

## Dynamic Content Translation

For dynamically added content:

```javascript
// Add new element with translation
const button = document.createElement('button');
button.setAttribute('data-i18n', 'buttons.submit');
button.textContent = window.t('buttons.submit');
document.body.appendChild(button);

// The MutationObserver will automatically translate new elements
```

## Performance Optimization

### Lazy Loading

Languages are loaded on-demand:

```javascript
// First language change loads the file
await window.medicalI18n.setLanguage('de'); // Loads de.json

// Subsequent changes use cached translations
await window.medicalI18n.setLanguage('de'); // Uses cache
```

### Preloading Languages

Preload multiple languages:

```javascript
// Preload commonly used languages
await Promise.all([
    window.medicalI18n.loadLanguage('en'),
    window.medicalI18n.loadLanguage('tr'),
    window.medicalI18n.loadLanguage('ar')
]);
```

## Troubleshooting

### Translation Not Showing

1. Check if key exists in JSON file
2. Verify `data-i18n` attribute spelling
3. Check browser console for errors
4. Ensure JSON file is valid (use JSON validator)

### RTL Not Working

1. Verify language is in `rtlLanguages` array
2. Check if `rtl-support.css` is loaded
3. Inspect `<html dir>` attribute
4. Clear browser cache

### Language File Not Loading

1. Check file path: `/i18n/medical/{code}.json`
2. Verify JSON syntax (no trailing commas)
3. Check server MIME type (should be `application/json`)
4. Check browser network tab for 404 errors

## API Reference

### MedicalI18nManager Class

#### Methods

**get(key, params)**
- Get translation by key
- Params: Optional object for parameter replacement

**setLanguage(langCode)**
- Change current language
- Returns: Promise<boolean>

**getCurrentLanguage()**
- Returns current language info object

**getAvailableLanguages()**
- Returns array of all available languages

**isRTL(langCode)**
- Check if language is RTL
- Params: Optional language code (uses current if not provided)

**formatNumber(number, options)**
- Format number according to locale

**formatDate(date, options)**
- Format date according to locale

**formatTime(date, options)**
- Format time according to locale

### Global Helpers

**window.medicalI18n**
- Main i18n manager instance

**window.t(key, params)**
- Shorthand for `window.medicalI18n.get()`

## Event Reference

### languageChanged

Fired when language changes:

```javascript
window.addEventListener('languageChanged', (event) => {
    const { language, isRTL, languageName } = event.detail;
    console.log(`Language changed to ${languageName}`);

    // Update your app state
    updateUI(language, isRTL);
});
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features Used:**
- Intl.NumberFormat
- Intl.DateTimeFormat
- MutationObserver
- async/await
- localStorage

## Security Considerations

1. **XSS Prevention**: Never use `data-i18n-html` with user input
2. **JSON Validation**: Validate translation files
3. **Content Security**: Sanitize dynamic translations
4. **CORS**: Ensure translation files are served with correct headers

## Testing

### Manual Testing Checklist

- [ ] All UI text translates correctly
- [ ] Input placeholders translate
- [ ] Button labels translate
- [ ] Error messages translate
- [ ] Date/number formats are locale-correct
- [ ] RTL languages display correctly
- [ ] Language selector works
- [ ] Language preference persists (localStorage)
- [ ] Dynamic content translates
- [ ] All 8 languages load successfully

### Automated Testing

```javascript
// Test all languages
async function testAllLanguages() {
    const languages = window.medicalI18n.getAvailableLanguages();

    for (const lang of languages) {
        await window.medicalI18n.setLanguage(lang.code);
        console.log(`Testing ${lang.nativeName}:`, window.t('app.title'));
    }
}

testAllLanguages();
```

## Support

For issues or questions:
- Check this guide first
- Review browser console for errors
- Verify JSON file syntax
- Test with English (fallback language)

## License

Part of LyDian Medical AI system.
All translations © 2025 LyDian AI.
