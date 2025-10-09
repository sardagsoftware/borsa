/**
 * PERSONAS TYPES
 *
 * Type-safe interfaces for multi-lingual personas
 */

import { z } from 'zod';

/**
 * Supported locales
 */
export type Locale = 'tr' | 'az' | 'ar-qa' | 'ar-sa' | 'el' | 'ru' | 'de' | 'nl' | 'bg' | 'en';

/**
 * Text direction
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Cultural tone
 */
export type CulturalTone = 'formal' | 'friendly' | 'professional' | 'casual';

/**
 * Persona configuration
 */
export const PersonaConfig = z.object({
  locale: z.enum(['tr', 'az', 'ar-qa', 'ar-sa', 'el', 'ru', 'de', 'nl', 'bg', 'en']),
  tone: z.enum(['formal', 'friendly', 'professional', 'casual']).default('professional'),
  domain: z.enum(['e-commerce', 'healthcare', 'finance', 'general']).default('e-commerce'),
  enable_bias_detection: z.boolean().default(true),
  enable_cultural_adaptation: z.boolean().default(true),
});
export type PersonaConfig = z.infer<typeof PersonaConfig>;

/**
 * Locale pack (translations + cultural rules)
 */
export interface LocalePack {
  locale: Locale;
  display_name: string;
  text_direction: TextDirection;
  greetings: {
    formal: string[];
    informal: string[];
  };
  farewells: {
    formal: string[];
    informal: string[];
  };
  affirmatives: string[];
  negatives: string[];
  apologies: string[];
  gratitude: string[];
  cultural_rules: {
    formality_default: CulturalTone;
    use_honorifics: boolean;
    gender_neutral_preferred: boolean;
    date_format: string; // e.g., "DD/MM/YYYY"
    currency_symbol: string;
    number_format: 'comma' | 'dot' | 'space'; // Decimal separator
  };
}

/**
 * Persona response
 */
export const PersonaResponse = z.object({
  locale: z.string(),
  text: z.string(),
  tone: z.string(),
  text_direction: z.enum(['ltr', 'rtl']),
  cultural_adaptations_applied: z.array(z.string()),
  bias_warnings: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
});
export type PersonaResponse = z.infer<typeof PersonaResponse>;

/**
 * Conversation context
 */
export interface ConversationContext {
  user_id?: string;
  session_id?: string;
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  user_preferences?: {
    locale?: Locale;
    tone?: CulturalTone;
  };
  domain_context?: Record<string, any>;
}

/**
 * Bias detection result
 */
export interface BiasDetectionResult {
  has_bias: boolean;
  bias_types: Array<'gender' | 'age' | 'ethnicity' | 'religion' | 'socioeconomic' | 'other'>;
  confidence: number;
  suggestions: string[];
}

/**
 * Cultural adaptation
 */
export interface CulturalAdaptation {
  adaptation_type: 'honorific' | 'formality' | 'idiom' | 'date_format' | 'number_format' | 'greeting';
  original: string;
  adapted: string;
  reason: string;
}
