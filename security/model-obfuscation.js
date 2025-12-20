/**
 * 🔐 MODEL OBFUSCATION SYSTEM
 * =============================
 * Enterprise-grade AI Model Identity Protection
 *
 * SECURITY OBJECTIVES:
 * - Hide all AI model names from frontend/backend source code
 * - Prevent developer tools inspection
 * - Encrypt network requests/responses
 * - Use non-obvious code names
 * - Zero-knowledge architecture
 *
 * WHITE-HAT COMPLIANCE:
 * - No actual encryption breaking
 * - Legal obfuscation techniques
 * - Performance-optimized
 * - Maintainable codebase
 */

const crypto = require('crypto');

/**
 * Model Identity Mapping (CONFIDENTIAL)
 * =====================================
 * CRITICAL: Never expose actual model names in logs, errors, or responses
 *
 * Code Name Strategy:
 * - LX = LyDian eXecution engines
 * - NX = Neural eXecution tier
 * - QX = Quantum-speed tier
 * - VX = Vision-enabled tier
 */

const MODEL_REGISTRY = {
  // Tier 1: Ultra-Fast Response
  'LX01': {
    actualProvider: process.env.MODEL_LX01_PROVIDER,
    actualModel: process.env.MODEL_LX01_NAME,
    capabilities: ['text', 'fast'],
    tier: 'ultra-fast',
    displayName: 'LyDian UltraFast Engine'
  },

  // Tier 2: Balanced Performance
  'LX02': {
    actualProvider: process.env.MODEL_LX02_PROVIDER,
    actualModel: process.env.MODEL_LX02_NAME,
    capabilities: ['text', 'code', 'reasoning'],
    tier: 'balanced',
    displayName: 'LyDian Pro Engine'
  },

  // Tier 3: Advanced Reasoning
  'LX03': {
    actualProvider: process.env.MODEL_LX03_PROVIDER,
    actualModel: process.env.MODEL_LX03_NAME,
    capabilities: ['text', 'code', 'reasoning', 'analysis'],
    tier: 'advanced',
    displayName: 'LyDian Advanced Engine'
  },

  // Tier 4: Premium Intelligence
  'LX04': {
    actualProvider: process.env.MODEL_LX04_PROVIDER,
    actualModel: process.env.MODEL_LX04_NAME,
    capabilities: ['text', 'code', 'reasoning', 'analysis', 'multimodal'],
    tier: 'premium',
    displayName: 'LyDian Premium Engine'
  },

  // Vision Models
  'VX01': {
    actualProvider: process.env.MODEL_VX01_PROVIDER,
    actualModel: process.env.MODEL_VX01_NAME,
    capabilities: ['text', 'vision', 'image-analysis'],
    tier: 'vision',
    displayName: 'LyDian Vision Engine'
  },

  // Quantum Speed Models
  'QX01': {
    actualProvider: process.env.MODEL_QX01_PROVIDER,
    actualModel: process.env.MODEL_QX01_NAME,
    capabilities: ['text', 'ultra-fast'],
    tier: 'quantum',
    displayName: 'LyDian Quantum Engine'
  },

  // Neural Execution Tier
  'NX01': {
    actualProvider: process.env.MODEL_NX01_PROVIDER,
    actualModel: process.env.MODEL_NX01_NAME,
    capabilities: ['text', 'multimodal', 'analysis'],
    tier: 'neural',
    displayName: 'LyDian Neural Engine'
  }
};

/**
 * Request/Response Encryption
 * ===========================
 */

class ModelObfuscator {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = this.deriveKey();
  }

  /**
   * Derive encryption key from environment
   */
  deriveKey() {
    const secret = process.env.MODEL_OBFUSCATION_SECRET || 'ailydian-secure-2025-fallback';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypt model identifier for network transmission
   */
  encrypt(modelCode) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

    let encrypted = cipher.update(modelCode, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt model identifier
   */
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get actual model configuration (NEVER expose to frontend)
   */
  resolveModel(modelCode) {
    const model = MODEL_REGISTRY[modelCode];

    if (!model) {
      throw new Error('INVALID_MODEL_CODE');
    }

    // CRITICAL: Never return actual provider/model names to frontend
    return {
      provider: model.actualProvider,
      model: model.actualModel,
      capabilities: model.capabilities
    };
  }

  /**
   * Get safe model info for frontend display
   */
  getSafeModelInfo(modelCode) {
    const model = MODEL_REGISTRY[modelCode];

    if (!model) {
      return null;
    }

    // SAFE: Only return generic information
    return {
      code: modelCode,
      name: model.displayName,
      capabilities: model.capabilities,
      tier: model.tier
    };
  }

  /**
   * Get all available models (safe for frontend)
   */
  getAvailableModels() {
    return Object.keys(MODEL_REGISTRY).map(code =>
      this.getSafeModelInfo(code)
    );
  }

  /**
   * Sanitize error messages (remove any model references)
   */
  sanitizeError(error) {
    let message = error.message || error.toString();

    // Remove all potential model identifiers
    const sensitivePatterns = [
      /AX9F7E2B/gi,
      /gpt-?[0-9]?/gi,
      /gemini/gi,
      /groq/gi,
      /anthropic/gi,
      /openai/gi,
      /mixtral/gi,
      /llama/gi,
      /model-[a-z0-9-]+/gi
    ];

    sensitivePatterns.forEach(pattern => {
      message = message.replace(pattern, '[AI_ENGINE]');
    });

    return message;
  }

  /**
   * Sanitize log output
   */
  sanitizeLog(logData) {
    if (typeof logData === 'string') {
      return this.sanitizeError({ message: logData });
    }

    if (typeof logData === 'object') {
      const sanitized = { ...logData };

      // Recursively sanitize object properties
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = this.sanitizeError({ message: sanitized[key] });
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeLog(sanitized[key]);
        }
      });

      return sanitized;
    }

    return logData;
  }
}

/**
 * Singleton instance
 */
let obfuscatorInstance = null;

function getObfuscator() {
  if (!obfuscatorInstance) {
    obfuscatorInstance = new ModelObfuscator();
  }
  return obfuscatorInstance;
}

/**
 * Express middleware for request/response obfuscation
 */
function obfuscationMiddleware(req, res, next) {
  const obfuscator = getObfuscator();

  // Intercept response to sanitize any model references
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const sanitized = obfuscator.sanitizeLog(data);
    return originalJson(sanitized);
  };

  // Intercept console.log in production
  if (process.env.NODE_ENV === 'production') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalLog(...sanitized);
    };

    console.error = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalError(...sanitized);
    };

    console.warn = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalWarn(...sanitized);
    };
  }

  next();
}

/**
 * Export public API
 */
module.exports = {
  ModelObfuscator,
  getObfuscator,
  obfuscationMiddleware,

  // Convenience methods
  encrypt: (data) => getObfuscator().encrypt(data),
  decrypt: (data) => getObfuscator().decrypt(data),
  resolveModel: (code) => getObfuscator().resolveModel(code),
  getSafeModelInfo: (code) => getObfuscator().getSafeModelInfo(code),
  getAvailableModels: () => getObfuscator().getAvailableModels(),
  sanitizeError: (error) => getObfuscator().sanitizeError(error),
  sanitizeLog: (data) => getObfuscator().sanitizeLog(data)
};
