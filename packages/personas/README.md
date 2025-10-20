# Lydian-IQ Personas

**Multi-lingual, culturally-aware AI personas with automatic bias detection**

## Supported Locales

- 🇹🇷 Turkish (tr)
- 🇦🇿 Azerbaijani (az)
- 🇶🇦 Arabic - Qatar (ar-qa)
- 🇸🇦 Arabic - Saudi Arabia (ar-sa)
- 🇬🇷 Greek (el)
- 🇷🇺 Russian (ru)
- 🇩🇪 German (de)
- 🇳🇱 Dutch (nl)
- 🇧🇬 Bulgarian (bg)
- 🇬🇧 English (en)

## Features

- **Cultural Adaptation**: Automatic formality, greetings, number/date formatting
- **RTL Support**: Right-to-left text for Arabic locales
- **Bias Detection**: Gender, age, ethnicity, socioeconomic bias detection
- **Tone Control**: Formal, friendly, professional, casual
- **Conversation Management**: Multi-turn conversations with context

## Installation

```bash
npm install @lydian-iq/personas
```

## Quick Start

```typescript
import { PersonaEngine } from '@lydian-iq/personas';

const engine = new PersonaEngine();

const response = await engine.generateResponse(
  {
    locale: 'tr',
    tone: 'professional',
    domain: 'e-commerce',
    enable_bias_detection: true,
    enable_cultural_adaptation: true,
  },
  'Hello! Your order has been shipped.'
);

console.log(response.text); // "Merhaba! Siparişiniz kargoya verildi."
console.log(response.cultural_adaptations_applied); // ['greeting', 'number_format']
```

## Multi-Locale Responses

```typescript
const responses = await engine.generateMultiLocaleResponses(
  ['tr', 'de', 'ar-qa'],
  'Your order total is $149.99',
  'professional'
);

console.log(responses.tr.text); // Turkish with 149,99 ₺
console.log(responses.de.text); // German with 149,99 €
console.log(responses['ar-qa'].text); // Arabic (RTL) with ١٤٩,٩٩ ر.ق
```

## Conversation Management

```typescript
import { ConversationManager } from '@lydian-iq/personas';

const manager = new ConversationManager();

const sessionId = manager.startConversation({
  user_id: 'user-123',
  locale: 'de',
  tone: 'friendly',
});

await manager.addMessage(sessionId, 'user', 'Hallo!');

const response = await manager.generateContextualResponse(
  sessionId,
  'Thanks for contacting us!'
);

console.log(response.text); // "Danke für die Kontaktaufnahme!"
```

## Cultural Features

### Formality

Automatically adapts pronouns based on cultural norms:
- Turkish: sen → siz (formal)
- German: du → Sie (formal)
- Russian: ты → вы (formal)

### Number Formatting

- Turkish: 1.234,56 ₺
- German: 1.234,56 €
- English: 1,234.56 $
- Russian: 1 234,56 ₽

### Date Formatting

- Turkish: 09.10.2025
- English: 10/09/2025
- Dutch: 09-10-2025

### RTL Support

Arabic locales automatically apply RTL markers:
```typescript
response.text_direction // 'rtl'
// Text includes Unicode RTL markers: ‫...‬
```

## Bias Detection

Automatically detects potential bias:

```typescript
const response = await engine.generateResponse(config,
  'The salesman will help you with the purchase.'
);

console.log(response.bias_warnings);
// ["Consider using gender-neutral language"]
```

Detected bias types:
- Gender bias (he/she, gendered job titles)
- Age bias (young, old, millennial)
- Socioeconomic bias (poor, wealthy)

## Helper Methods

```typescript
// Generate localized greetings
engine.generateGreeting('tr', 'formal'); // "Merhaba"
engine.generateGreeting('ar-qa', 'informal'); // "مرحبا"

// Generate farewells
engine.generateFarewell('de', 'formal'); // "Auf Wiedersehen"

// Generate affirmatives
engine.generateAffirmative('ru'); // "Да"

// Generate apologies
engine.generateApology('nl'); // "Sorry"

// Generate gratitude
engine.generateGratitude('bg'); // "Благодаря"
```

## Locale Packs

Each locale pack includes:
- Formal/informal greetings and farewells
- Affirmatives, negatives, apologies, gratitude
- Cultural rules (formality, honorifics, date/number formats)
- Currency symbols

Example locale pack structure:
```typescript
{
  locale: 'tr',
  display_name: 'Türkçe',
  text_direction: 'ltr',
  greetings: { formal: [...], informal: [...] },
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true,
    date_format: 'DD.MM.YYYY',
    currency_symbol: '₺',
    number_format: 'comma'
  }
}
```

## License

UNLICENSED - Internal use only
