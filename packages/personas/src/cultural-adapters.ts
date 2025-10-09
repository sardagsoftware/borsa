/**
 * CULTURAL ADAPTERS
 *
 * Apply cultural adaptations to responses based on locale
 */

import { LocalePack, CulturalAdaptation, BiasDetectionResult, Locale } from './types';
import { LOCALE_PACKS } from './locale-packs';

/**
 * Cultural adapter for locale-specific transformations
 */
export class CulturalAdapter {
  private localePack: LocalePack;

  constructor(locale: Locale) {
    this.localePack = LOCALE_PACKS[locale];
  }

  /**
   * Apply cultural adaptations to text
   */
  adapt(text: string, tone: 'formal' | 'friendly' | 'professional' | 'casual'): {
    adapted_text: string;
    adaptations: CulturalAdaptation[];
  } {
    let adapted_text = text;
    const adaptations: CulturalAdaptation[] = [];

    // 1. Apply formality adjustments
    if (tone === 'formal' && this.localePack.cultural_rules.use_honorifics) {
      const formalityAdaptation = this.applyFormality(adapted_text, tone);
      if (formalityAdaptation) {
        adapted_text = formalityAdaptation.adapted;
        adaptations.push(formalityAdaptation);
      }
    }

    // 2. Apply greetings
    const greetingAdaptation = this.adaptGreeting(adapted_text, tone);
    if (greetingAdaptation) {
      adapted_text = greetingAdaptation.adapted;
      adaptations.push(greetingAdaptation);
    }

    // 3. Format numbers according to locale
    const numberAdaptations = this.formatNumbers(adapted_text);
    adapted_text = numberAdaptations.adapted;
    adaptations.push(...numberAdaptations.adaptations);

    // 4. Format dates according to locale
    const dateAdaptations = this.formatDates(adapted_text);
    adapted_text = dateAdaptations.adapted;
    adaptations.push(...dateAdaptations.adaptations);

    // 5. Apply RTL markers if needed
    if (this.localePack.text_direction === 'rtl') {
      adapted_text = `\u202B${adapted_text}\u202C`; // RTL markers
    }

    return { adapted_text, adaptations };
  }

  /**
   * Apply formality adjustments
   */
  private applyFormality(
    text: string,
    tone: 'formal' | 'friendly' | 'professional' | 'casual'
  ): CulturalAdaptation | null {
    // Locale-specific formality transformations
    if (this.localePack.locale === 'tr') {
      // Turkish: Replace "sen" with "siz" for formal
      if (tone === 'formal') {
        const formalText = text
          .replace(/\bsen\b/gi, 'siz')
          .replace(/\bsenin\b/gi, 'sizin')
          .replace(/\b-sin\b/gi, '-siniz');

        if (formalText !== text) {
          return {
            adaptation_type: 'formality',
            original: text,
            adapted: formalText,
            reason: 'Applied formal pronouns (siz) for Turkish',
          };
        }
      }
    } else if (this.localePack.locale === 'de') {
      // German: Replace "du" with "Sie" for formal
      if (tone === 'formal') {
        const formalText = text
          .replace(/\bdu\b/gi, 'Sie')
          .replace(/\bdein\b/gi, 'Ihr')
          .replace(/\bdir\b/gi, 'Ihnen');

        if (formalText !== text) {
          return {
            adaptation_type: 'formality',
            original: text,
            adapted: formalText,
            reason: 'Applied formal pronouns (Sie) for German',
          };
        }
      }
    }

    return null;
  }

  /**
   * Adapt greetings based on tone
   */
  private adaptGreeting(
    text: string,
    tone: 'formal' | 'friendly' | 'professional' | 'casual'
  ): CulturalAdaptation | null {
    const isFormal = tone === 'formal' || tone === 'professional';
    const greetings = isFormal
      ? this.localePack.greetings.formal
      : this.localePack.greetings.informal;

    // Check if text starts with a generic greeting
    const genericGreetings = ['hello', 'hi', 'hey', 'greetings'];
    for (const generic of genericGreetings) {
      if (text.toLowerCase().startsWith(generic)) {
        const replacement = greetings[0]; // Use first greeting
        const adapted = text.replace(new RegExp(`^${generic}`, 'i'), replacement);

        return {
          adaptation_type: 'greeting',
          original: text,
          adapted,
          reason: `Localized greeting to ${this.localePack.display_name}`,
        };
      }
    }

    return null;
  }

  /**
   * Format numbers according to locale
   */
  private formatNumbers(text: string): {
    adapted: string;
    adaptations: CulturalAdaptation[];
  } {
    const adaptations: CulturalAdaptation[] = [];
    let adapted = text;

    // Match numbers with decimal points
    const numberRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
    const matches = text.match(numberRegex);

    if (matches) {
      for (const match of matches) {
        const formatted = this.formatNumber(parseFloat(match.replace(/,/g, '')));

        if (formatted !== match) {
          adapted = adapted.replace(match, formatted);
          adaptations.push({
            adaptation_type: 'number_format',
            original: match,
            adapted: formatted,
            reason: `Formatted number for ${this.localePack.display_name} locale`,
          });
        }
      }
    }

    return { adapted, adaptations };
  }

  /**
   * Format a number according to locale rules
   */
  private formatNumber(value: number): string {
    const parts = value.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousands separator
    let formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Add decimal separator
    if (this.localePack.cultural_rules.number_format === 'comma') {
      formatted += `,${decimalPart}`;
    } else if (this.localePack.cultural_rules.number_format === 'dot') {
      formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted += `.${decimalPart}`;
    } else {
      // space
      formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      formatted += `,${decimalPart}`;
    }

    return formatted;
  }

  /**
   * Format dates according to locale
   */
  private formatDates(text: string): {
    adapted: string;
    adaptations: CulturalAdaptation[];
  } {
    const adaptations: CulturalAdaptation[] = [];
    let adapted = text;

    // Match ISO dates (YYYY-MM-DD)
    const isoDateRegex = /\d{4}-\d{2}-\d{2}/g;
    const matches = text.match(isoDateRegex);

    if (matches) {
      for (const match of matches) {
        const formatted = this.formatDate(new Date(match));

        if (formatted !== match) {
          adapted = adapted.replace(match, formatted);
          adaptations.push({
            adaptation_type: 'date_format',
            original: match,
            adapted: formatted,
            reason: `Formatted date for ${this.localePack.display_name} locale`,
          });
        }
      }
    }

    return { adapted, adaptations };
  }

  /**
   * Format a date according to locale rules
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const format = this.localePack.cultural_rules.date_format;

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', String(year));
  }
}

/**
 * Bias detector
 */
export class BiasDetector {
  /**
   * Detect potential bias in text
   */
  detect(text: string): BiasDetectionResult {
    const bias_types: Array<'gender' | 'age' | 'ethnicity' | 'religion' | 'socioeconomic' | 'other'> = [];
    const suggestions: string[] = [];

    // Gender bias patterns
    const genderBiasPatterns = [
      { pattern: /\b(he|him|his)\b/gi, type: 'gender' as const },
      { pattern: /\b(she|her|hers)\b/gi, type: 'gender' as const },
      { pattern: /\b(mankind|manpower)\b/gi, type: 'gender' as const },
    ];

    for (const { pattern, type } of genderBiasPatterns) {
      if (pattern.test(text)) {
        if (!bias_types.includes(type)) {
          bias_types.push(type);
          suggestions.push('Consider using gender-neutral language');
        }
      }
    }

    // Age bias patterns
    if (/\b(young|old|elderly|millennial|boomer)\b/gi.test(text)) {
      bias_types.push('age');
      suggestions.push('Avoid age-based assumptions');
    }

    // Socioeconomic bias patterns
    if (/\b(poor|rich|wealthy|low-income|upper-class)\b/gi.test(text)) {
      bias_types.push('socioeconomic');
      suggestions.push('Avoid socioeconomic stereotypes');
    }

    return {
      has_bias: bias_types.length > 0,
      bias_types,
      confidence: bias_types.length > 0 ? 0.7 : 0.0,
      suggestions,
    };
  }
}
