# Season 2: Localization Note

**Version**: 2.0.0
**Date**: January 15, 2026
**Localization Team**: i18n & LQA
**Status**: APPROVED

---

## Overview

Season 2 ships with **8 languages** (TR default + EN/AR/DE/RU/NL/BG/EL) and full RTL support for Arabic. All strings passed Language Quality Assurance (LQA) with zero truncation/overlap/offline character errors.

---

## Supported Languages

| Code | Language | Region | Direction | CLDR | Status |
|------|----------|--------|-----------|------|--------|
| **tr-TR** | Türkçe (Turkish) | Turkey | LTR | ✅ | ✅ DEFAULT |
| **en-US** | English | United States | LTR | ✅ | ✅ Complete |
| **ar-SA** | العربية (Arabic) | Saudi Arabia | **RTL** | ✅ | ✅ Complete |
| **de-DE** | Deutsch (German) | Germany | LTR | ✅ | ✅ Complete |
| **ru-RU** | Русский (Russian) | Russia | LTR | ✅ | ✅ Complete |
| **nl-NL** | Nederlands (Dutch) | Netherlands | LTR | ✅ | ✅ Complete |
| **bg-BG** | Български (Bulgarian) | Bulgaria | LTR | ✅ | ✅ Complete |
| **el-GR** | Ελληνικά (Greek) | Greece | LTR | ✅ | ✅ Complete |

---

## File Structure

```
/public/i18n/
├── tr/s2.json    (Türkçe - DEFAULT)
├── en/s2.json    (English)
├── ar/s2.json    (Arabic - RTL)
├── de/s2.json    (German)
├── ru/s2.json    (Russian)
├── nl/s2.json    (Dutch)
├── bg/s2.json    (Bulgarian)
└── el/s2.json    (Greek)
```

**File Size**: ~25-35 KB per language (uncompressed JSON)

---

## Translation Coverage

### Core Content
- ✅ Season title, subtitle, description
- ✅ 6 week themes + descriptions
- ✅ All events (mini-boss, photo contest, vendor sale, co-op week, finale)
- ✅ Mechanics (Resonance Link, Storm Puzzles)
- ✅ Bosses (Echo Sentinel, phases, tells)
- ✅ Biomes (Canyon Night-Storm, Ruins Sand-Gale)
- ✅ Quests (Storm Callers, Sentinel Origins)
- ✅ Cosmetics (5 items: 3 costumes + 2 effects)
- ✅ Currency (CR/AC names, abbreviations, symbols)
- ✅ UI labels (buttons, navigation, stats)
- ✅ Notifications (event start/end, season ending)
- ✅ Errors (event not active, already claimed, etc.)
- ✅ Compliance (KVKK rights, privacy, data export)

### Total Strings
- **tr.json**: 152 strings
- **Other languages**: 152 strings each (1:1 parity)

---

## CLDR Formatting

### Date/Time Formats
| Locale | Date Format | Time Format | Timezone |
|--------|-------------|-------------|----------|
| tr-TR | `d MMMM yyyy` | `HH:mm` | Europe/Istanbul |
| en-US | `MMMM d, yyyy` | `h:mm a` | America/New_York |
| ar-SA | `d MMMM yyyy` | `HH:mm` | Asia/Riyadh |
| de-DE | `d. MMMM yyyy` | `HH:mm` | Europe/Berlin |
| ru-RU | `d MMMM yyyy` | `HH:mm` | Europe/Moscow |
| nl-NL | `d MMMM yyyy` | `HH:mm` | Europe/Amsterdam |
| bg-BG | `d MMMM yyyy` | `HH:mm` | Europe/Sofia |
| el-GR | `d MMMM yyyy` | `HH:mm` | Europe/Athens |

**Examples**:
- Turkish: `15 Ocak 2026 20:00`
- English: `January 15, 2026 8:00 PM`
- Arabic: `15 يناير 2026 20:00`

### Number Formats
| Locale | Number | Currency |
|--------|--------|----------|
| tr-TR | `#.##0,##` | `#.##0,## ₺` |
| en-US | `#,##0.##` | `$#,##0.##` |
| ar-SA | `#,##0.##` | `#,##0.## ر.س` |
| de-DE | `#.##0,##` | `#.##0,## €` |
| ru-RU | `#\u00a0##0,##` | `#\u00a0##0,## ₽` |

**Examples**:
- Turkish: `1.234,56 ₺`
- English: `$1,234.56`
- Arabic: `1,234.56 ر.س`

---

## RTL Support (Arabic)

### Key Considerations
- **Direction Attribute**: All Arabic pages use `dir="rtl"` on `<html>` tag
- **CSS Mirroring**: UI elements aligned right (flex-direction: row-reverse)
- **Icon Flipping**: Directional icons (arrows) flipped horizontally
- **Punctuation**: Arabic punctuation (‏،‏ instead of `,` and ‏؛‏ instead of `;`)

### Implementation
```html
<!-- HTML -->
<html lang="ar-SA" dir="rtl">

<!-- CSS -->
[dir="rtl"] .container {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .arrow-icon {
  transform: scaleX(-1);
}
```

### LQA Checkpoints (Arabic)
- ✅ Text flows right-to-left
- ✅ UI elements aligned right (buttons, menus)
- ✅ No mixed LTR/RTL text issues
- ✅ Numbers display correctly (1234 not reversed)
- ✅ Dates formatted per locale (15 يناير 2026)

---

## LQA (Language Quality Assurance)

### Process
1. **Native Speaker Review**: All 8 languages reviewed by native speakers
2. **In-Game Testing**: Visual inspection on 1920x1080, 2560x1440, 3840x2160
3. **Automated Checks**: Script validates JSON structure, missing keys
4. **Manual QA**: 100% string coverage, no placeholders left

### LQA Criteria
| Check | Pass/Fail |
|-------|-----------|
| **No Truncation** | ✅ PASS (longest German string fits within UI) |
| **No Overlap** | ✅ PASS (no overlapping text on buttons/labels) |
| **No Offline Characters** | ✅ PASS (all Unicode characters supported) |
| **Contextually Accurate** | ✅ PASS (terminology consistent with S1) |
| **Proper Capitalization** | ✅ PASS (title case for English, sentence case for others) |
| **Gender/Plural Forms** | ✅ PASS (Russian/Arabic plural forms correct) |

### LQA Failures Found & Fixed
| Issue | Language | Fix |
|-------|----------|-----|
| "Storm Walker" truncated to "Storm Wal..." | de-DE | Reduced font size by 2px |
| Mixed LTR/RTL in notification | ar-SA | Wrapped dynamic content in `<bdi>` tag |
| Plural form incorrect ("1 trials") | ru-RU | Implemented ICU MessageFormat for plurals |

---

## Translation Memory & Terminology

### Glossary (Core Terms)
| English | Turkish | Arabic | German | Russian |
|---------|---------|--------|--------|---------|
| Echo Storms | Yankı Fırtınaları | عواصف الصدى | Echo-Stürme | Эхо Бурь |
| Resonance Link | Yankı Bağlantısı | رابط الرنين | Resonanz-Verbindung | Резонансная Связь |
| Echo Sentinel | Yankı Bekçisi | حارس الصدى | Echo-Wächter | Эхо Страж |
| Chordstone Remnants | Akortaşı Kalıntıları | بقايا حجر الوتر | Akkordstein-Reste | Остатки Аккордного Камня |

**Consistency**: All terms carried over from S1 glossary, no changes

---

## Locale Detection & Fallback

### Detection Logic
1. **User Preference**: Check account settings (`user.locale`)
2. **Browser Language**: Parse `Accept-Language` header
3. **IP Geolocation**: Use IP to determine region (TR → tr-TR, SA → ar-SA)
4. **Fallback**: If unsupported, fallback to `en-US`, then `tr-TR`

### Example
```javascript
function detectLocale(user, req) {
  // 1. User preference
  if (user.locale && SUPPORTED_LOCALES.includes(user.locale)) {
    return user.locale;
  }

  // 2. Browser language
  const browserLang = req.headers['accept-language'];
  const matched = matchLocale(browserLang, SUPPORTED_LOCALES);
  if (matched) return matched;

  // 3. IP geolocation
  const country = geoip.lookup(req.ip).country;
  if (country === 'TR') return 'tr-TR';
  if (country === 'SA') return 'ar-SA';

  // 4. Fallback
  return 'en-US'; // or 'tr-TR' if Turkish-first strategy
}
```

---

## String Interpolation & Variables

### Syntax
```json
{
  "objectives": {
    "complete_storm_puzzles": "Complete {{count}} storm puzzles",
    "reach_season_level": "Reach season level {{level}}"
  },
  "notifications": {
    "event_starting_soon": "{{event}} starting in {{time}}!"
  }
}
```

### Usage (JavaScript)
```javascript
const i18n = require('./i18n-loader');
const t = i18n.t('tr-TR');

console.log(t('objectives.complete_storm_puzzles', { count: 5 }));
// Output: "5 fırtına bulmacasını tamamla"

console.log(t('notifications.event_starting_soon', {
  event: 'Mini-Boss',
  time: '2 hours'
}));
// Output: "Mini-Boss 2 hours içinde başlıyor!"
```

---

## Accessibility (a11y)

### Screen Reader Support
- ✅ All strings have `aria-label` equivalents
- ✅ Icon buttons labeled (e.g., `aria-label="Close"`)
- ✅ Dynamic content announced (e.g., "Event starting soon")

### Keyboard Navigation
- ✅ All UI elements tab-navigable
- ✅ Focus indicators visible (2px outline)
- ✅ Skip-to-content links for screen readers

### Color-Blind Safe
- ✅ Text contrast ≥4.5:1 (WCAG AA)
- ✅ No color-only information (icons + text labels)

---

## Compliance & Legal

### KVKK/GDPR/PDPL
- ✅ **Data Minimization**: No PII in i18n files
- ✅ **User Rights**: All 8 languages have "Export My Data" / "Delete Account" strings
- ✅ **Transparency**: "About Data Usage" page localized
- ✅ **Consent**: Cookie consent banners localized

### Legal Review
| Language | Legal Review | Date | Status |
|----------|--------------|------|--------|
| tr-TR | ✅ KVKK compliant | Jan 8, 2026 | Approved |
| en-US | ✅ GDPR compliant | Jan 8, 2026 | Approved |
| ar-SA | ✅ PDPL compliant | Jan 9, 2026 | Approved |
| All others | ✅ GDPR compliant | Jan 9, 2026 | Approved |

---

## Maintenance & Updates

### Mid-Season Updates
**If new strings added mid-season**:
1. Add to `tr/s2.json` first (source of truth)
2. Send to translation agency (24h turnaround SLA)
3. LQA review for new strings only
4. Deploy via canary (10%→50%→100%)

### S3 Planning
- Start S3 translations 2 weeks before launch
- Reuse S2 glossary, update only new terms
- Consider adding 2 more languages (FR, ES) based on player data

---

## Testing & Validation

### Automated Tests
```bash
# Validate JSON structure
npm run validate:i18n

# Check for missing keys
npm run i18n:check-missing

# Verify CLDR formatting
npm run i18n:test-cldr
```

### Manual Testing Checklist
- [ ] All 8 languages load without errors
- [ ] Date/time formatted correctly per locale
- [ ] Currency symbols display correctly
- [ ] Arabic RTL layout correct
- [ ] No truncation on longest strings (German)
- [ ] Notifications display in correct language
- [ ] User can change language in settings

---

## Deployment Status

| Language | File | Size | LQA | Deployed |
|----------|------|------|-----|----------|
| tr-TR | `tr/s2.json` | 32 KB | ✅ PASS | ✅ Live |
| en-US | `en/s2.json` | 28 KB | ✅ PASS | ✅ Live |
| ar-SA | `ar/s2.json` | 35 KB | ✅ PASS | ✅ Live |
| de-DE | `de/s2.json` | 18 KB | ✅ PASS | ✅ Live |
| ru-RU | `ru/s2.json` | 19 KB | ✅ PASS | ✅ Live |
| nl-NL | `nl/s2.json` | 18 KB | ✅ PASS | ✅ Live |
| bg-BG | `bg/s2.json` | 19 KB | ✅ PASS | ✅ Live |
| el-GR | `el/s2.json` | 18 KB | ✅ PASS | ✅ Live |

---

**Locale Note Status**: ✅ APPROVED
**LQA**: ✅ PASS (0 errors)
**RTL Support**: ✅ Verified
**CLDR**: ✅ Compliant

**Version**: 2.0.0
**Prepared by**: i18n Team
