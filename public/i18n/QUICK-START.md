# Medical AI i18n - Quick Start Guide

## 5-Minute Setup

### Step 1: Add Files to Your HTML (30 seconds)

Add these lines to your `medical-expert.html` in the `<head>` section:

```html
<!-- i18n Manager -->
<script src="/js/i18n-manager.js"></script>

<!-- RTL Support -->
<link rel="stylesheet" href="/css/rtl-support.css">
```

### Step 2: Add Language Selector (30 seconds)

Add this dropdown anywhere in your header:

```html
<select id="languageSelector" class="language-selector"></select>
```

The options will populate automatically!

### Step 3: Mark Text for Translation (3 minutes)

Add `data-i18n` attributes to elements you want translated:

```html
<!-- Before -->
<h1>General Medicine</h1>
<button>Submit</button>
<input placeholder="Enter patient name">

<!-- After -->
<h1 data-i18n="specialties.generalMedicine">General Medicine</h1>
<button data-i18n="buttons.submit">Submit</button>
<input data-i18n-placeholder="calculators.general.patientName" placeholder="Enter patient name">
```

### Step 4: Test (1 minute)

1. Open your page in a browser
2. Select a language from the dropdown
3. Watch everything translate automatically!

## Common Patterns

### Button Text
```html
<button data-i18n="buttons.save">Save</button>
```

### Input Placeholders
```html
<input data-i18n-placeholder="chat.inputPlaceholder" placeholder="Type here...">
```

### Tooltips
```html
<button data-i18n-title="chat.voiceInput" title="Voice Input">🎤</button>
```

### Headings
```html
<h2 data-i18n="calculators.general.title">General Calculator</h2>
```

### Paragraphs
```html
<p data-i18n="disclaimer.text">This is a disclaimer...</p>
```

## Translation Keys Cheat Sheet

### Common Keys

| Key | English | Use For |
|-----|---------|---------|
| `app.title` | LyDian Medical AI | Page title |
| `header.newConsultation` | New Consultation | New consultation button |
| `buttons.submit` | Submit | Submit buttons |
| `buttons.cancel` | Cancel | Cancel buttons |
| `buttons.save` | Save | Save buttons |
| `status.loading` | Loading... | Loading states |
| `status.success` | Success! | Success messages |
| `status.error` | Error occurred | Error messages |

### Specialties

| Key | Value |
|-----|-------|
| `specialties.generalMedicine` | General Medicine |
| `specialties.cardiology` | Cardiology |
| `specialties.neurology` | Neurology |
| `specialties.oncology` | Oncology |
| `specialties.pediatrics` | Pediatrics |
| `specialties.psychiatry` | Psychiatry |
| `specialties.orthopedics` | Orthopedics |

### Calculators

| Key | Value |
|-----|-------|
| `calculators.general.title` | General Medical Calculator |
| `calculators.general.vitalSigns` | Vital Signs |
| `calculators.general.systolic` | Systolic BP (mmHg) |
| `calculators.general.heartRate` | Heart Rate (bpm) |
| `calculators.general.calculate` | Calculate |
| `calculators.general.results` | Results |

## JavaScript Usage

### Get Translation
```javascript
// Get translation
const title = window.t('app.title');

// With parameters
const greeting = window.t('greeting.hello', { name: 'Dr. Smith' });
```

### Change Language
```javascript
// Change to Turkish
await window.medicalI18n.setLanguage('tr');

// Change to Arabic (enables RTL)
await window.medicalI18n.setLanguage('ar');
```

### Check Current Language
```javascript
const current = window.medicalI18n.getCurrentLanguage();
console.log(current.code); // 'en', 'tr', 'ar', etc.
console.log(current.isRTL); // true for Arabic
```

### Format Numbers & Dates
```javascript
// Numbers
const formatted = window.medicalI18n.formatNumber(1234.56);
// EN: "1,234.56", DE: "1.234,56", TR: "1.234,56"

// Dates
const date = window.medicalI18n.formatDate(new Date());
// EN: "January 6, 2025", TR: "6 Ocak 2025"
```

### Listen for Language Changes
```javascript
window.addEventListener('languageChanged', (event) => {
    console.log('New language:', event.detail.language);
    console.log('Is RTL:', event.detail.isRTL);

    // Update your UI here
});
```

## Supported Languages

| Code | Language | Native Name | Flag | RTL |
|------|----------|-------------|------|-----|
| `en` | English | English | 🇬🇧 | No |
| `tr` | Turkish | Türkçe | 🇹🇷 | No |
| `de` | German | Deutsch | 🇩🇪 | No |
| `fr` | French | Français | 🇫🇷 | No |
| `es` | Spanish | Español | 🇪🇸 | No |
| `ar` | Arabic | العربية | 🇸🇦 | **Yes** |
| `ru` | Russian | Русский | 🇷🇺 | No |
| `zh` | Chinese | 中文 | 🇨🇳 | No |

## FAQ

### Q: How do I add a new translation?

A: Add the key to all language JSON files in `/public/i18n/medical/`:

```json
{
  "myNewKey": "My New Translation"
}
```

### Q: What if a translation is missing?

A: The system automatically falls back to English if a translation is missing.

### Q: How do I test RTL?

A: Change language to Arabic:

```javascript
await window.medicalI18n.setLanguage('ar');
```

### Q: Can I use HTML in translations?

A: For security, use plain text. If you absolutely need HTML, use:

```html
<div data-i18n-html="my.html.key"></div>
```

**Warning:** Never use with user-generated content (XSS risk)!

### Q: How do I translate dynamically added content?

A: Just add `data-i18n` attributes. The MutationObserver will automatically translate new elements:

```javascript
const button = document.createElement('button');
button.setAttribute('data-i18n', 'buttons.submit');
button.textContent = window.t('buttons.submit');
document.body.appendChild(button);
// Automatically translated!
```

### Q: Does it work on mobile?

A: Yes! Fully responsive with mobile support.

### Q: What about browser compatibility?

A: Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Language not changing?

1. Check browser console for errors
2. Verify language code is correct
3. Check if JSON file exists at `/i18n/medical/{code}.json`
4. Clear browser cache

### Text not translating?

1. Check if `data-i18n` attribute is correct
2. Verify key exists in JSON file
3. Check browser console for warnings
4. Ensure i18n-manager.js is loaded

### RTL not working?

1. Verify language is Arabic (`ar`)
2. Check if `rtl-support.css` is loaded
3. Inspect HTML: `<html dir="rtl">`
4. Check body class: `body.rtl`

## Examples

See `/public/i18n/MEDICAL-EXPERT-INTEGRATION.html` for complete working examples.

## Need Help?

Check the full documentation: `/public/i18n/INTEGRATION-GUIDE.md`

---

**That's it! Your medical AI interface is now multilingual! 🌍**
