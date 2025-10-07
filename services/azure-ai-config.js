/**
 * ⚖️ LyDian AI - Azure AI Services Configuration
 * Global Legal AI System - White-Hat Security Active
 *
 * Priority Users: Judges → Prosecutors → Lawyers → Citizens
 * Data: Real-time Turkish & International Legal Systems
 */

// Azure AI Services Configuration
const AZURE_CONFIG = {
  // Azure OpenAI Service
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://ailydian-openai.openai.azure.com/',
    apiKey: process.env.AZURE_OPENAI_API_KEY || 'FoUbKXu08Pks2btAoMj4hZwhbQrFHhY7zX9QRyjqF54VHvhSAAYwJQQJ99BJACfhMk5XJ3w3AAABACOG88Te',
    apiVersion: '2024-10-01-preview',

    models: {
      // Legal Analysis - GPT-4 Turbo
      legalAnalysis: {
        deployment: 'gpt-4-turbo',
        model: 'gpt-4-turbo-2024-04-09',
        maxTokens: 4096,
        temperature: 0.3, // Low temperature for legal accuracy
        topP: 0.95,
        useCase: 'Turkish law analysis, case research, legal drafting'
      },

      // Multimodal Reasoning - GPT-4o
      multimodal: {
        deployment: 'gpt-4o',
        model: 'gpt-4o-2024-11-20',
        maxTokens: 4096,
        temperature: 0.2,
        vision: true,
        useCase: 'Document analysis, evidence review, multimodal legal reasoning'
      },

      // Embeddings for RAG
      embedding: {
        deployment: 'text-embedding-3-large',
        model: 'text-embedding-3-large',
        dimensions: 3072,
        useCase: 'Legal document search, semantic similarity, RAG retrieval'
      },

      // Alternative embedding model
      embeddingSmall: {
        deployment: 'text-embedding-ada-002',
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        useCase: 'Fast legal text embedding, cost-effective RAG'
      }
    }
  },

  // Azure Speech Services
  speech: {
    endpoint: process.env.AZURE_SPEECH_ENDPOINT || 'https://swedencentral.api.cognitive.microsoft.com/',
    apiKey: process.env.AZURE_SPEECH_KEY || '4b34da7b17144b1bab1f18f20ebcee1d',
    region: process.env.AZURE_SPEECH_REGION || 'swedencentral',

    features: {
      // Speech-to-Text for legal proceedings
      speechToText: {
        language: 'tr-TR', // Turkish primary
        supportedLanguages: ['tr-TR', 'en-US', 'de-DE', 'fr-FR', 'ar-SA'],
        profanityFilter: true,
        diarization: true, // Speaker separation in court
        punctuation: true,
        useCase: 'Court transcription, lawyer consultations, voice commands'
      },

      // Whisper v3 for professional transcription
      whisper: {
        deployment: 'whisper-v3',
        model: 'whisper-large-v3',
        languages: 'auto-detect',
        quality: 'high',
        useCase: 'Audio evidence transcription, legal recordings analysis'
      },

      // Text-to-Speech for accessibility
      textToSpeech: {
        voice: 'tr-TR-AhmetNeural', // Turkish male voice
        voiceAlternative: 'tr-TR-EmelNeural', // Turkish female voice
        speed: 1.0,
        pitch: 0,
        useCase: 'Legal document reading, accessibility for visually impaired'
      },

      // Voice Biometric Authentication
      voiceBiometric: {
        liveness: true, // Anti-spoofing
        deepfakeDetection: true,
        threshold: 0.85,
        useCase: 'Secure judge/prosecutor/lawyer authentication'
      }
    }
  },

  // Azure Computer Vision
  computerVision: {
    endpoint: process.env.AZURE_VISION_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/',
    apiKey: process.env.AZURE_VISION_KEY || '',

    features: {
      // Document Image Analysis
      imageAnalysis: {
        visualFeatures: ['Objects', 'Tags', 'Description', 'Faces', 'Text'],
        details: ['Celebrities', 'Landmarks'],
        language: 'tr',
        useCase: 'Evidence photo analysis, crime scene documentation'
      },

      // OCR for scanned documents
      ocr: {
        language: 'tr',
        detectOrientation: true,
        handwriting: true,
        useCase: 'Scanned legal documents, old court records'
      }
    }
  },

  // Azure Document Intelligence (Form Recognizer)
  documentIntelligence: {
    endpoint: process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/',
    apiKey: process.env.AZURE_DOC_INTELLIGENCE_KEY || '',

    models: {
      // Pre-built models
      invoice: {
        model: 'prebuilt-invoice',
        useCase: 'Legal billing, financial evidence'
      },

      receipt: {
        model: 'prebuilt-receipt',
        useCase: 'Expense evidence, transaction proof'
      },

      idDocument: {
        model: 'prebuilt-idDocument',
        useCase: 'Identity verification, passport analysis'
      },

      // Custom models for legal documents
      legalContract: {
        model: 'custom-legal-contract',
        training: 'Turkish contract templates',
        fields: ['parties', 'date', 'clauses', 'signatures'],
        useCase: 'Contract analysis, clause extraction'
      },

      courtDecision: {
        model: 'custom-court-decision',
        training: 'Yargıtay decisions, Constitutional Court rulings',
        fields: ['case_number', 'date', 'parties', 'verdict', 'reasoning'],
        useCase: 'Case law extraction, precedent analysis'
      },

      petition: {
        model: 'custom-legal-petition',
        training: 'Turkish legal petitions (dilekçe)',
        fields: ['court', 'plaintiff', 'defendant', 'claims', 'evidence'],
        useCase: 'Petition drafting assistance, petition analysis'
      }
    }
  },

  // Azure Video Indexer
  videoIndexer: {
    accountId: process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID || '',
    apiKey: process.env.AZURE_VIDEO_INDEXER_KEY || '',
    location: 'trial', // or your Azure region

    features: {
      insights: [
        'Transcript',
        'OCR',
        'Keywords',
        'Topics',
        'Faces',
        'Emotions',
        'Labels',
        'Brands',
        'NamedEntities',
        'AudioEffects'
      ],

      customModels: {
        legalPersons: {
          type: 'People',
          training: 'Turkish judges, prosecutors, famous lawyers',
          useCase: 'Identify legal professionals in court videos'
        },

        legalBrands: {
          type: 'Brands',
          training: 'Law firms, courts, legal institutions',
          useCase: 'Identify organizations in legal videos'
        }
      },

      useCase: 'Court hearing videos, security footage evidence, witness testimony analysis'
    }
  },

  // Azure Translator
  translator: {
    endpoint: process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com/',
    apiKey: process.env.AZURE_TRANSLATOR_KEY || '',
    region: 'global',

    features: {
      // 150+ languages support
      languages: {
        primary: 'tr', // Turkish
        legal: ['en', 'de', 'fr', 'ar', 'ru', 'zh-Hans', 'ja', 'es', 'it'],
        total: 150,
        useCase: 'International law, cross-border cases, multilingual legal research'
      },

      // Legal terminology preservation
      customGlossary: {
        domain: 'legal',
        termCount: 10000,
        languages: ['tr', 'en', 'de', 'fr'],
        useCase: 'Preserve legal terms accuracy in translation'
      },

      // Document translation
      documentTranslation: {
        formats: ['pdf', 'docx', 'txt', 'html'],
        preserveFormatting: true,
        useCase: 'Translate legal documents while preserving layout'
      }
    }
  },

  // Azure Content Safety (White-Hat Security)
  contentSafety: {
    endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/',
    apiKey: process.env.AZURE_CONTENT_SAFETY_KEY || '',

    features: {
      // Text moderation
      textModeration: {
        categories: ['Hate', 'Violence', 'Sexual', 'SelfHarm'],
        severityLevels: [0, 2, 4, 6], // 0=Safe, 6=Severe
        blockThreshold: 4, // Block medium-high severity
        useCase: 'Filter harmful content in legal queries, protect users'
      },

      // Image moderation
      imageModeration: {
        categories: ['Hate', 'Violence', 'Sexual', 'SelfHarm'],
        useCase: 'Moderate uploaded evidence photos, filter inappropriate images'
      },

      // Custom blocklists
      blocklists: {
        offensiveTerms: true,
        personalInfo: true, // PII protection
        useCase: 'KVKK/GDPR compliance, protect sensitive data'
      }
    }
  }
};

// White-Hat Security Rules
const SECURITY_RULES = {
  ethical_ai: {
    enabled: true,
    rules: [
      'No malicious intent detection',
      'No harmful legal advice',
      'No privacy violation assistance',
      'No illegal activity support',
      'Transparency in AI decisions',
      'Explainable AI for legal outcomes',
      'User consent for data processing',
      'Right to human review',
      'Bias detection and mitigation',
      'Fairness in legal predictions'
    ]
  },

  data_protection: {
    kvkk_compliance: true, // Turkish Personal Data Protection Law
    gdpr_compliance: true,
    ccpa_compliance: true,
    encryption: 'AES-256',
    data_retention: '7 years', // Legal requirement in Turkey
    right_to_deletion: true,
    data_portability: true
  },

  authentication: {
    multi_factor: true,
    biometric: true,
    role_based_access: {
      judge: ['all_cases', 'verdicts', 'confidential_docs'],
      prosecutor: ['investigations', 'evidence', 'case_files'],
      lawyer: ['client_cases', 'court_docs', 'research'],
      citizen: ['public_info', 'basic_search', 'self_service']
    }
  },

  audit_logging: {
    enabled: true,
    log_queries: true,
    log_ai_decisions: true,
    retention_period: '10 years',
    tamper_proof: true, // Blockchain-based
    useCase: 'Legal accountability, transparency, compliance'
  }
};

// Rate Limiting Configuration
const RATE_LIMITS = {
  citizen: {
    requests_per_minute: 10,
    requests_per_day: 100,
    concurrent_sessions: 1
  },

  lawyer: {
    requests_per_minute: 50,
    requests_per_day: 1000,
    concurrent_sessions: 5
  },

  prosecutor: {
    requests_per_minute: 100,
    requests_per_day: 5000,
    concurrent_sessions: 10
  },

  judge: {
    requests_per_minute: 200,
    requests_per_day: 10000,
    concurrent_sessions: 20
  }
};

// Export configuration
module.exports = {
  AZURE_CONFIG,
  SECURITY_RULES,
  RATE_LIMITS
};
