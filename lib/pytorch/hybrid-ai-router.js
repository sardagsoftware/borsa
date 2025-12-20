/**
 * 🧠 HYBRID AI ROUTER
 * Intelligent routing between PyTorch/ONNX models and 3rd party APIs
 * Optimizes for cost, speed, and accuracy
 *
 * Strategy:
 * 1. Simple queries → ONNX models (fast, cheap)
 * 2. Complex queries → 3rd party APIs (accurate, expensive)
 * 3. Fallback if ONNX fails → 3rd party APIs
 * 4. A/B testing support
 */

const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('lydian-labs');
const axios = require('axios');
const { getDatabase } = require('../../database/init-db');

// Query complexity classifier
class QueryClassifier {
  static analyze(query, context = {}) {
    const features = {
      wordCount: query.split(/\s+/).length,
      hasMedicalTerms: /radyoloji|teşhis|tedavi|ilaç|hastalık|semptom|tanı/i.test(query),
      hasLegalTerms: /kanun|madde|yasa|sözleşme|hukuk|dava|mahkeme/i.test(query),
      hasComplexKeywords: /analiz|karşılaştır|değerlendir|incele|araştır/i.test(query),
      questionMarks: (query.match(/\?/g) || []).length,
      hasContext: Object.keys(context).length > 0
    };

    // Complexity score (0-100)
    let score = 0;

    // Word count (longer = more complex)
    if (features.wordCount < 10) score += 10;
    else if (features.wordCount < 20) score += 20;
    else if (features.wordCount < 50) score += 30;
    else score += 50;

    // Domain-specific terms
    if (features.hasMedicalTerms) score += 20;
    if (features.hasLegalTerms) score += 20;

    // Complex keywords
    if (features.hasComplexKeywords) score += 15;

    // Multiple questions
    if (features.questionMarks > 1) score += 10;

    // Context available (multimodal)
    if (features.hasContext) score += 15;

    return {
      score,
      complexity: score < 30 ? 'simple' : score < 60 ? 'medium' : 'complex',
      features
    };
  }
}

// Router decision engine
class HybridRouter {
  constructor() {
    this.config = {
      // Thresholds
      simpleThreshold: 30,    // score < 30 → ONNX
      mediumThreshold: 60,    // 30 ≤ score < 60 → ONNX or 3rd party (A/B)
      complexThreshold: 60,   // score ≥ 60 → 3rd party

      // Fallback strategy
      maxOnnxRetries: 2,
      fallbackTo3rdParty: true,

      // Cost optimization
      onnxCostPerRequest: 0.0001,  // $0.0001
      apiCostPerRequest: 0.02      // $0.02 (average)
    };
  }

  /**
   * Route query to appropriate AI backend
   */
  async route(query, options = {}) {
    const {
      context = {},
      userId = null,
      forceBackend = null,  // 'onnx', '3rdparty'
      abTestId = null
    } = options;

    // Classify query
    const classification = QueryClassifier.analyze(query, context);

    console.log(`🔀 Routing decision:`, {
      complexity: classification.complexity,
      score: classification.score,
      wordCount: classification.features.wordCount
    });

    // Force specific backend (for testing)
    if (forceBackend) {
      console.log(`⚠️  Forced backend: ${forceBackend}`);
      return {
        backend: forceBackend,
        reason: 'forced',
        classification
      };
    }

    // A/B testing override
    if (abTestId) {
      const abChoice = await this.getABTestChoice(abTestId, userId);
      if (abChoice) {
        console.log(`🧪 A/B test routing: ${abChoice}`);
        return {
          backend: abChoice,
          reason: 'ab-test',
          abTestId,
          classification
        };
      }
    }

    // Decision logic
    if (classification.score < this.config.simpleThreshold) {
      // Simple query → ONNX
      return {
        backend: 'onnx',
        reason: 'simple-query',
        classification,
        estimatedCost: this.config.onnxCostPerRequest
      };

    } else if (classification.score < this.config.mediumThreshold) {
      // Medium query → 50/50 A/B test (or user preference)
      const choice = Math.random() < 0.5 ? 'onnx' : '3rdparty';
      return {
        backend: choice,
        reason: 'medium-query-ab',
        classification,
        estimatedCost: choice === 'onnx' ?
          this.config.onnxCostPerRequest :
          this.config.apiCostPerRequest
      };

    } else {
      // Complex query → 3rd party API
      return {
        backend: '3rdparty',
        reason: 'complex-query',
        classification,
        estimatedCost: this.config.apiCostPerRequest
      };
    }
  }

  /**
   * Get A/B test assignment
   */
  async getABTestChoice(abTestId, userId) {
    const db = getDatabase();
    try {
      const test = db.prepare(`
        SELECT * FROM pytorch_ab_tests
        WHERE id = ? AND status = 'running'
      `).get(abTestId);

      if (!test) return null;

      // Consistent assignment based on userId hash
      if (userId) {
        const hash = require('crypto')
          .createHash('sha256')
          .update(userId.toString())
          .digest('hex');
        const hashValue = parseInt(hash.substring(0, 8), 16);
        const choice = (hashValue % 100) < test.traffic_split_percent ? 'model_a' : 'model_b';

        return choice === 'model_a' ? 'onnx' : '3rdparty';
      }

      // Random assignment
      return Math.random() < (test.traffic_split_percent / 100) ? 'onnx' : '3rdparty';

    } catch (error) {
      console.error('A/B test error:', error);
      return null;
    } finally {
      db.close();
    }
  }

  /**
   * Execute inference with fallback
   */
  async execute(query, routingDecision, options = {}) {
    const { backend, reason, classification } = routingDecision;
    let result = null;
    let actualBackend = backend;
    let retries = 0;

    // Try ONNX first (if routed to ONNX)
    if (backend === 'onnx') {
      try {
        console.log(`🚀 Executing ONNX inference...`);
        result = await this.executeONNX(query, options);
        console.log(`✅ ONNX inference successful`);

      } catch (error) {
        console.error(`❌ ONNX inference failed:`, error.message);

        // Fallback to 3rd party if enabled
        if (this.config.fallbackTo3rdParty && retries < this.config.maxOnnxRetries) {
          console.log(`⚠️  Falling back to 3rd party API...`);
          actualBackend = '3rdparty-fallback';
          result = await this.execute3rdParty(query, options);
        } else {
          throw error;
        }
      }
    }

    // Execute 3rd party API
    if (backend === '3rdparty' || actualBackend === '3rdparty-fallback') {
      console.log(`🚀 Executing 3rd party API...`);
      result = await this.execute3rdParty(query, options);
      console.log(`✅ 3rd party API successful`);
    }

    // Log routing decision
    this.logRoutingDecision({
      query,
      backend: actualBackend,
      reason,
      classification,
      success: !!result,
      userId: options.userId
    });

    return {
      result,
      metadata: {
        backend: actualBackend,
        reason,
        complexity: classification.complexity,
        complexityScore: classification.score
      }
    };
  }

  /**
   * Execute ONNX model inference
   */
  async executeONNX(query, options) {
    // Call local ONNX inference API
    const response = await axios.post('http://localhost:3100/api/pytorch/inference', {
      model_name: options.modelName || 'chest-xray-classifier-demo',
      image: options.image
    });

    return response.data;
  }

  /**
   * Execute 3rd party API (Anthropic AX9F7E2B)
   */
  async execute3rdParty(query, options) {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: 'AX9F7E2B',
      max_tokens: options.maxTokens || 4000,
      messages: [
        { role: 'user', content: query }
      ]
    });

    return {
      response: response.content[0].text,
      provider: 'Anthropic AX9F7E2B',
      usage: response.usage
    };
  }

  /**
   * Log routing decision to database
   */
  logRoutingDecision(data) {
    const db = getDatabase();
    try {
      // For now, log to activity_log (can create dedicated table later)
      db.prepare(`
        INSERT INTO activity_log (userId, action, description, metadata)
        VALUES (?, ?, ?, ?)
      `).run(
        data.userId || 0,
        'hybrid_routing',
        `Routed to ${data.backend}: ${data.reason}`,
        JSON.stringify({
          complexity: data.classification.complexity,
          score: data.classification.score,
          backend: data.backend,
          success: data.success
        })
      );
    } catch (error) {
      console.error('Failed to log routing:', error);
    } finally {
      db.close();
    }
  }
}

// Export singleton
module.exports = new HybridRouter();
