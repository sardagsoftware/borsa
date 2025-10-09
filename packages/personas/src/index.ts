/**
 * LYDIAN-IQ PERSONAS
 *
 * Purpose: Multi-lingual, culturally-aware AI personas
 * Locales: TR, AZ, AR (QA/SA), EL, RU, DE, NL, BG, EN, FR
 * Features:
 * - Cultural tone adaptation
 * - RTL support for Arabic
 * - Bias detection and safety guards
 * - Context-aware responses
 *
 * Compliance: Cultural sensitivity, bias mitigation
 */

export * from './types';
export * from './persona-engine';
export * from './locale-packs';
export * from './cultural-adapters';

export const VERSION = '1.0.0';
export const SUPPORTED_LOCALES = ['tr', 'az', 'ar-qa', 'ar-sa', 'el', 'ru', 'de', 'nl', 'bg', 'en'] as const;
