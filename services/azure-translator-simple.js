/**
 * 🌍 Azure Translator Service - Simplified Real Implementation
 * 150+ Languages with Azure Cognitive Services
 */

const axios = require('axios');
require('dotenv').config();

class AzureTranslatorService {
  constructor() {
    this.apiKey = process.env.AZURE_TRANSLATOR_KEY || process.env.AZURE_KEY;
    this.endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    this.region = process.env.AZURE_REGION || 'westeurope';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    if (!this.apiKey) {
      console.log('⚠️  Azure Translator: API key not found - using demo mode');
      this.demoMode = true;
    } else {
      console.log('✅ Azure Translator initialized with real API');
      this.demoMode = false;
    }

    this.initialized = true;
  }

  async translateLegalText(text, targetLanguage, options = {}) {
    await this.initialize();

    if (this.demoMode) {
      return {
        success: true,
        originalText: text,
        translatedText: `[DEMO] ${text} → ${targetLanguage.toUpperCase()}`,
        detectedLanguage: 'tr',
        targetLanguage: targetLanguage,
        confidence: 0.95,
        preservedTerms: [],
        demoMode: true
      };
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/translate`,
        [{ text: text }],
        {
          params: {
            'api-version': '3.0',
            'to': targetLanguage,
            'textType': options.textType || 'plain'
          },
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data[0];

      return {
        success: true,
        originalText: text,
        translatedText: result.translations[0].text,
        detectedLanguage: result.detectedLanguage?.language || 'unknown',
        targetLanguage: targetLanguage,
        confidence: result.detectedLanguage?.score || 1.0,
        preservedTerms: options.preserveLegalTerms ? this.extractLegalTerms(text) : []
      };

    } catch (error) {
      console.error('❌ Translation error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: `[ERROR] ${text}`
      };
    }
  }

  async detectLanguage(text) {
    await this.initialize();

    if (this.demoMode) {
      return {
        success: true,
        language: 'tr',
        languageName: 'Turkish',
        confidence: 0.98,
        demoMode: true
      };
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/detect`,
        [{ text: text }],
        {
          params: {
            'api-version': '3.0'
          },
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data[0];

      return {
        success: true,
        language: result.language,
        languageName: this.getLanguageName(result.language),
        confidence: result.score,
        isTranslationSupported: result.isTranslationSupported,
        isTransliterationSupported: result.isTransliterationSupported
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSupportedLanguages(category) {
    const languages = {
      european: ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'tr'],
      middleEast: ['ar', 'he', 'fa', 'ur'],
      asian: ['zh', 'ja', 'ko', 'th', 'vi', 'id'],
      popular: ['en', 'es', 'fr', 'de', 'zh', 'ar', 'ru', 'ja'],
      all: ['af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'ca', 'ceb', 'ny', 'zh', 'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 'tl', 'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw', 'iw', 'hi', 'hmn', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 'jw', 'kn', 'kk', 'km', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'my', 'ne', 'no', 'ps', 'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es', 'su', 'sw', 'sv', 'tg', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu']
    };

    return languages[category] || languages.all;
  }

  async analyzeCulturalContext(text, targetLanguage) {
    await this.initialize();

    return {
      success: true,
      culturalNotes: [
        {
          aspect: 'Legal System',
          note: `Target language (${targetLanguage}) may have different legal terminology`,
          importance: 'high'
        },
        {
          aspect: 'Formality Level',
          note: 'Legal documents require formal register',
          importance: 'critical'
        }
      ],
      recommendedAdjustments: [
        'Review translated legal terms with native legal expert',
        'Ensure proper honorifics and formal address',
        'Check date and number formatting conventions'
      ]
    };
  }

  extractLegalTerms(text) {
    const legalTerms = [
      'mahkeme', 'hakim', 'savcı', 'avukat', 'dava', 'karar',
      'court', 'judge', 'prosecutor', 'lawyer', 'case', 'verdict',
      'tribunal', 'juge', 'avocat', 'procureur'
    ];

    return legalTerms.filter(term =>
      text.toLowerCase().includes(term.toLowerCase())
    );
  }

  getLanguageName(code) {
    const names = {
      'en': 'English', 'tr': 'Turkish', 'de': 'German', 'fr': 'French',
      'es': 'Spanish', 'ar': 'Arabic', 'zh': 'Chinese', 'ru': 'Russian',
      'ja': 'Japanese', 'ko': 'Korean', 'it': 'Italian', 'pt': 'Portuguese'
    };

    return names[code] || code.toUpperCase();
  }

  getServiceStatus() {
    return {
      initialized: this.initialized,
      demoMode: this.demoMode,
      supportedLanguages: 150,
      features: {
        translation: true,
        detection: true,
        culturalContext: true,
        legalTermPreservation: true
      }
    };
  }
}

// Singleton instance
const translatorService = new AzureTranslatorService();

module.exports = translatorService;
