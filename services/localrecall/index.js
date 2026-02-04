/**
 * AILYDIAN LocalRecall Service
 * Entry point for RAG-powered knowledge management
 *
 * @version 1.0.0
 * @license MIT
 */

const { AilydianRecall, getInstance, config, obfuscation } = require('./ailydian-recall');

module.exports = {
  // Main class
  AilydianRecall,

  // Singleton getter
  getInstance,

  // Configuration
  config,

  // AI Model obfuscation utilities
  obfuscation,

  // Convenience exports
  getModel: obfuscation.getModel,
  getModelForDomain: obfuscation.getModelForDomain,
  selectOptimalModel: obfuscation.selectOptimalModel,
  sanitizeModelNames: obfuscation.sanitizeModelNames,
  encryptForClient: obfuscation.encryptForClient,
  decryptFromClient: obfuscation.decryptFromClient,

  // Collection names
  COLLECTIONS: {
    IQ_MASTER: config.collections.IQ_MASTER.name,
    CHAT_GENERAL: config.collections.CHAT_GENERAL.name,
    MEDICAL_KB: config.collections.MEDICAL_KB.name,
    LEGAL_KB: config.collections.LEGAL_KB.name,
  },

  // Operating modes
  MODES: config.modes,
};
