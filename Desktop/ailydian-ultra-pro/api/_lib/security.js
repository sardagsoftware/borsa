// Security obfuscation layer - DO NOT EXPOSE
const crypto = require('crypto');

// Encrypted model configurations
const ENCRYPTED_CONFIGS = {
  m1: Buffer.from('Y2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjI=', 'base64').toString('utf-8'),
  m2: Buffer.from('Y2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjI=', 'base64').toString('utf-8'),
  provider: Buffer.from('YW50aHJvcGlj', 'base64').toString('utf-8'),
  max_t: 2000,
  temp: 0.7
};

// Obfuscated API key getter
const getSecureKey = () => {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error('SEC_ERR_001');
  return k;
};

// Model name obfuscation
const getModelConfig = () => {
  return {
    model: ENCRYPTED_CONFIGS.m1,
    max_tokens: ENCRYPTED_CONFIGS.max_t,
    temperature: ENCRYPTED_CONFIGS.temp
  };
};

// Request sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .substring(0, 10000);
};

// Response obfuscation
const obfuscateResponse = (response) => {
  // Remove any model references from response
  if (response && response.model) {
    delete response.model;
  }
  if (response && response.stop_reason) {
    delete response.stop_reason;
  }
  return response;
};

module.exports = {
  getSecureKey,
  getModelConfig,
  sanitizeInput,
  obfuscateResponse,
  ENCRYPTED_CONFIGS
};
