/**
 * PERSONA ENGINE
 *
 * Main orchestrator for multi-lingual, culturally-aware responses
 */

import crypto from 'crypto';
import {
  PersonaConfig,
  PersonaResponse,
  ConversationContext,
  Locale,
} from './types';
import { getLocalePack } from './locale-packs';
import { CulturalAdapter, BiasDetector } from './cultural-adapters';

/**
 * Persona Engine
 */
export class PersonaEngine {
  private biasDetector: BiasDetector;

  constructor() {
    this.biasDetector = new BiasDetector();
  }

  /**
   * Generate a culturally-adapted response
   *
   * @param config - Persona configuration
   * @param rawResponse - Raw AI response (before cultural adaptation)
   * @param context - Conversation context (optional)
   * @returns Culturally-adapted persona response
   */
  async generateResponse(
    config: PersonaConfig,
    rawResponse: string,
    context?: ConversationContext
  ): Promise<PersonaResponse> {
    // Validate config
    PersonaConfig.parse(config);

    // Get locale pack
    const localePack = getLocalePack(config.locale);

    // Create cultural adapter
    const adapter = new CulturalAdapter(config.locale);

    // Apply cultural adaptations
    let adapted_text = rawResponse;
    let cultural_adaptations_applied: string[] = [];

    if (config.enable_cultural_adaptation) {
      const { adapted_text: culturallyAdapted, adaptations } = adapter.adapt(
        rawResponse,
        config.tone
      );

      adapted_text = culturallyAdapted;
      cultural_adaptations_applied = adaptations.map((a) => a.adaptation_type);
    }

    // Detect bias
    let bias_warnings: string[] | undefined;
    if (config.enable_bias_detection) {
      const biasResult = this.biasDetector.detect(adapted_text);

      if (biasResult.has_bias) {
        bias_warnings = biasResult.suggestions;
      }
    }

    // Calculate confidence
    const confidence = this.calculateConfidence({
      has_bias: bias_warnings ? bias_warnings.length > 0 : false,
      cultural_adaptations_count: cultural_adaptations_applied.length,
      locale_supported: true,
    });

    return {
      locale: config.locale,
      text: adapted_text,
      tone: config.tone,
      text_direction: localePack.text_direction,
      cultural_adaptations_applied,
      bias_warnings,
      confidence,
    };
  }

  /**
   * Generate a greeting based on locale and tone
   */
  generateGreeting(locale: Locale, tone: 'formal' | 'informal' = 'formal'): string {
    const localePack = getLocalePack(locale);
    const greetings =
      tone === 'formal' ? localePack.greetings.formal : localePack.greetings.informal;

    return greetings[0]; // Return first greeting
  }

  /**
   * Generate a farewell based on locale and tone
   */
  generateFarewell(locale: Locale, tone: 'formal' | 'informal' = 'formal'): string {
    const localePack = getLocalePack(locale);
    const farewells =
      tone === 'formal' ? localePack.farewells.formal : localePack.farewells.informal;

    return farewells[0]; // Return first farewell
  }

  /**
   * Generate an affirmative response
   */
  generateAffirmative(locale: Locale): string {
    const localePack = getLocalePack(locale);
    return localePack.affirmatives[0];
  }

  /**
   * Generate a negative response
   */
  generateNegative(locale: Locale): string {
    const localePack = getLocalePack(locale);
    return localePack.negatives[0];
  }

  /**
   * Generate an apology
   */
  generateApology(locale: Locale): string {
    const localePack = getLocalePack(locale);
    return localePack.apologies[0];
  }

  /**
   * Generate a gratitude expression
   */
  generateGratitude(locale: Locale): string {
    const localePack = getLocalePack(locale);
    return localePack.gratitude[0];
  }

  /**
   * Batch generate responses for multiple locales
   */
  async generateMultiLocaleResponses(
    locales: Locale[],
    rawResponse: string,
    tone: 'formal' | 'friendly' | 'professional' | 'casual' = 'professional'
  ): Promise<Record<Locale, PersonaResponse>> {
    const results: Record<string, PersonaResponse> = {};

    for (const locale of locales) {
      const config: PersonaConfig = {
        locale,
        tone,
        domain: 'e-commerce',
        enable_bias_detection: true,
        enable_cultural_adaptation: true,
      };

      results[locale] = await this.generateResponse(config, rawResponse);
    }

    return results as Record<Locale, PersonaResponse>;
  }

  /**
   * Calculate response confidence score
   */
  private calculateConfidence(params: {
    has_bias: boolean;
    cultural_adaptations_count: number;
    locale_supported: boolean;
  }): number {
    let confidence = 1.0;

    // Reduce confidence if bias detected
    if (params.has_bias) {
      confidence -= 0.3;
    }

    // Increase confidence based on cultural adaptations
    if (params.cultural_adaptations_count > 0) {
      confidence = Math.min(1.0, confidence + params.cultural_adaptations_count * 0.05);
    }

    // Reduce if locale not supported
    if (!params.locale_supported) {
      confidence -= 0.4;
    }

    return Math.max(0.0, Math.min(1.0, confidence));
  }
}

/**
 * Conversation manager for persona-based multi-turn conversations
 */
export class ConversationManager {
  private conversations: Map<string, ConversationContext> = new Map();
  private personaEngine: PersonaEngine;

  constructor() {
    this.personaEngine = new PersonaEngine();
  }

  /**
   * Start a new conversation
   */
  startConversation(params: {
    user_id?: string;
    locale: Locale;
    tone?: 'formal' | 'friendly' | 'professional' | 'casual';
  }): string {
    const session_id = crypto.randomUUID();

    const context: ConversationContext = {
      user_id: params.user_id,
      session_id,
      conversation_history: [],
      user_preferences: {
        locale: params.locale,
        tone: params.tone || 'professional',
      },
    };

    this.conversations.set(session_id, context);

    return session_id;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    session_id: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const context = this.conversations.get(session_id);

    if (!context) {
      throw new Error(`Conversation not found: ${session_id}`);
    }

    if (!context.conversation_history) {
      context.conversation_history = [];
    }

    context.conversation_history.push({ role, content });
  }

  /**
   * Generate response with conversation context
   */
  async generateContextualResponse(
    session_id: string,
    rawResponse: string
  ): Promise<PersonaResponse> {
    const context = this.conversations.get(session_id);

    if (!context) {
      throw new Error(`Conversation not found: ${session_id}`);
    }

    const config: PersonaConfig = {
      locale: context.user_preferences?.locale || 'en',
      tone: context.user_preferences?.tone || 'professional',
      domain: 'e-commerce',
      enable_bias_detection: true,
      enable_cultural_adaptation: true,
    };

    const response = await this.personaEngine.generateResponse(
      config,
      rawResponse,
      context
    );

    // Add to conversation history
    await this.addMessage(session_id, 'assistant', response.text);

    return response;
  }

  /**
   * Get conversation context
   */
  getContext(session_id: string): ConversationContext | undefined {
    return this.conversations.get(session_id);
  }

  /**
   * End conversation
   */
  endConversation(session_id: string): void {
    this.conversations.delete(session_id);
  }
}
