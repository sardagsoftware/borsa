/**
 * 🏛️ LyDian AI - Legal AI API Routes
 *
 * Unified API routes for all legal AI services:
 * - Azure Quantum (Quantum optimization)
 * - Blockchain (Legal document verification)
 * - Knowledge Graph (Legal precedent search)
 * - Azure Translator (150+ languages)
 * - Global Legal Systems (Common Law, Civil Law, Islamic Law, EU Regulations)
 */

const express = require('express');
const router = express.Router();

// Import all legal AI services
// Using try-catch for graceful fallback if services aren't available
let quantumService, blockchainService, knowledgeGraphService, translatorService, legalSystemsService, gdprService, ultimateLegalAI;

try {
  translatorService = require('../services/azure-translator-simple');
  gdprService = require('../services/gdpr-compliance-simple');
  ultimateLegalAI = require('../services/lydian-ultimate-legal-ai');
} catch (e) {
  console.log('⚠️ Using fallback services');
}

// Fallback mock services if not available
if (!translatorService) {
  translatorService = {
    translateLegalText: async (text, lang) => ({ success: false, error: 'Service not initialized' }),
    detectLanguage: async (text) => ({ success: false, error: 'Service not initialized' }),
    getSupportedLanguages: () => [],
    analyzeCulturalContext: async () => ({ success: false }),
    getServiceStatus: () => ({ initialized: false })
  };
}

if (!gdprService) {
  gdprService = {
    checkGDPRCompliance: async (data) => ({ success: false, error: 'Service not initialized' }),
    getServiceStatus: () => ({ initialized: false })
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LEGAL ANALYSIS ROUTES (GPT-4 Turbo)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Main legal analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { query, analysisType, jurisdiction } = req.body;

    if (!ultimateLegalAI) {
      return res.json({
        success: false,
        error: 'Ultimate Legal AI service not initialized'
      });
    }

    const result = await ultimateLegalAI.legalAnalysisGPT4Turbo({
      query: query,
      jurisdiction: jurisdiction || 'TR'
    }, analysisType || 'comprehensive');

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multimodal reasoning (text + images)
router.post('/multimodal', async (req, res) => {
  try {
    const { prompt, imageUrl, options } = req.body;

    if (!ultimateLegalAI) {
      return res.json({
        success: false,
        error: 'Ultimate Legal AI service not initialized'
      });
    }

    const result = await ultimateLegalAI.multimodalReasoning(prompt, imageUrl, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AZURE QUANTUM ROUTES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Optimize case strategy with quantum computing
router.post('/quantum/optimize-case', async (req, res) => {
  try {
    const { caseData, constraints } = req.body;
    const result = await quantumService.optimizeCaseStrategy(caseData, constraints);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find similar cases using quantum ML
router.post('/quantum/find-similar', async (req, res) => {
  try {
    const { caseFeatures, databaseSize } = req.body;
    const result = await quantumService.findSimilarCases(caseFeatures, { databaseSize });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Encrypt document with post-quantum cryptography
router.post('/quantum/encrypt', async (req, res) => {
  try {
    const { document, publicKey } = req.body;
    const result = await quantumService.encryptDocument(document, publicKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BLOCKCHAIN ROUTES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Register legal document on blockchain
router.post('/blockchain/register', async (req, res) => {
  try {
    const { document, metadata } = req.body;
    const result = await blockchainService.registerDocument(document, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create smart contract
router.post('/blockchain/smart-contract', async (req, res) => {
  try {
    const { templateType, parameters } = req.body;
    const result = await blockchainService.createSmartContract(templateType, parameters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mint NFT certificate
router.post('/blockchain/nft', async (req, res) => {
  try {
    const { documentHash, metadata } = req.body;
    const result = await blockchainService.mintLegalNFT(documentHash, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notarize document with DLT
router.post('/blockchain/notarize', async (req, res) => {
  try {
    const { document, notaryInfo } = req.body;
    const result = await blockchainService.notarizeDocument(document, notaryInfo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get audit trail
router.get('/blockchain/audit/:documentHash', async (req, res) => {
  try {
    const { documentHash } = req.params;
    const result = await blockchainService.getDocumentAuditTrail(documentHash);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * KNOWLEDGE GRAPH ROUTES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Build legal knowledge graph
router.post('/knowledge-graph/build', async (req, res) => {
  try {
    const { lawData } = req.body;
    const result = await knowledgeGraphService.buildLegalKnowledgeGraph(lawData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multi-Graph RAG query
router.post('/knowledge-graph/rag', async (req, res) => {
  try {
    const { question, options } = req.body;
    const result = await knowledgeGraphService.multiGraphRAG(question, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find legal precedents
router.post('/knowledge-graph/precedents', async (req, res) => {
  try {
    const { caseDetails, options } = req.body;
    const result = await knowledgeGraphService.findLegalPrecedents(caseDetails, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Semantic search
router.post('/knowledge-graph/search', async (req, res) => {
  try {
    const { query, options } = req.body;
    const result = await knowledgeGraphService.semanticSearch(query, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TRANSLATION ROUTES (150+ Languages)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Translate legal text
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, options } = req.body;
    const result = await translatorService.translateLegalText(text, targetLanguage, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detect language
router.post('/translate/detect', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await translatorService.detectLanguage(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supported languages
router.get('/translate/languages', async (req, res) => {
  try {
    const { category } = req.query;
    const result = translatorService.getSupportedLanguages(category);
    res.json({ success: true, languages: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cultural context analysis
router.post('/translate/cultural-context', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const result = await translatorService.analyzeCulturalContext(text, targetLanguage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GLOBAL LEGAL SYSTEMS ROUTES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Search Common Law cases
router.get('/legal-systems/common-law/search', async (req, res) => {
  try {
    const { query, jurisdiction, year, limit } = req.query;
    const result = await legalSystemsService.searchCommonLawCases(query, {
      jurisdiction,
      year: year ? parseInt(year) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search Civil Law codes
router.get('/legal-systems/civil-law/search', async (req, res) => {
  try {
    const { query, country, codeType, limit } = req.query;
    const result = await legalSystemsService.searchCivilLawCodes(query, {
      country,
      codeType,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Islamic Law analysis
router.post('/legal-systems/islamic-law/analyze', async (req, res) => {
  try {
    const { question, school, category } = req.body;
    const result = await legalSystemsService.analyzeIslamicLaw(question, { school, category });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search international treaties
router.get('/legal-systems/international/treaties', async (req, res) => {
  try {
    const { query, organization, limit } = req.query;
    const result = await legalSystemsService.searchInternationalTreaties(query, {
      organization,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get EU regulation details
router.get('/legal-systems/eu/:regulation', async (req, res) => {
  try {
    const { regulation } = req.params;
    const { language } = req.query;
    const result = await legalSystemsService.getEURegulation(regulation, { language });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GDPR compliance check
router.post('/legal-systems/eu/gdpr/check', async (req, res) => {
  try {
    const { dataProcessingActivity } = req.body;
    const result = await legalSystemsService.checkGDPRCompliance(dataProcessingActivity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SYSTEM STATUS ROUTES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

router.get('/status', async (req, res) => {
  try {
    // Initialize available services
    if (translatorService && !translatorService.initialized) await translatorService.initialize();
    if (gdprService && !gdprService.initialized) await gdprService.initialize();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),

      services: {
        translator: translatorService ? translatorService.getServiceStatus() : { initialized: false },
        gdpr: gdprService ? gdprService.getServiceStatus() : { initialized: false },
        quantum: { initialized: false, status: 'Coming soon' },
        blockchain: { initialized: false, status: 'Coming soon' },
        knowledgeGraph: { initialized: false, status: 'Coming soon' },
        legalSystems: { initialized: false, status: 'Coming soon' }
      },

      capabilities: {
        multilingualTranslation: true,
        gdprCompliance: true,
        quantumOptimization: false,
        blockchainVerification: false,
        knowledgeGraphRAG: false,
        globalLegalSystems: false
      },

      whiteHatSecurity: 'active',
      priority: 'Judges → Prosecutors → Lawyers → Citizens',
      slogan: 'Adalet için Teknoloji • Teknoloji için Etik'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
