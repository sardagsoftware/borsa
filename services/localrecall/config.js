/**
 * AILYDIAN LocalRecall Configuration
 * @version 1.0.0
 * @license MIT
 */

const path = require('path');

const config = {
  // LocalRecall binary path
  binaryPath: path.join(__dirname, '../../bin/localrecall'),

  // Default listening port for LocalRecall
  port: process.env.LOCALRECALL_PORT || 8089,

  // Collection storage path
  collectionsPath: path.join(__dirname, 'collections'),

  // File assets path
  assetsPath: path.join(__dirname, 'assets'),

  // Vector engine: 'chromem' (offline) or 'postgres' (online)
  vectorEngine: process.env.VECTOR_ENGINE || 'chromem',

  // Embedding configuration
  embedding: {
    model: process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2',
    // Use local embedding or external service
    useLocal: process.env.USE_LOCAL_EMBEDDING !== 'false',
  },

  // Chunking configuration
  chunking: {
    maxSize: parseInt(process.env.MAX_CHUNKING_SIZE) || 500,
    overlap: parseInt(process.env.CHUNK_OVERLAP) || 50,
  },

  // PostgreSQL configuration (for online mode)
  postgres: {
    url: process.env.DATABASE_URL_RECALL || process.env.DATABASE_URL,
    // Hybrid search weights
    bm25Weight: parseFloat(process.env.HYBRID_BM25_WEIGHT) || 0.3,
    vectorWeight: parseFloat(process.env.HYBRID_VECTOR_WEIGHT) || 0.7,
  },

  // Pre-defined collections
  collections: {
    // For lydian-iq.html - Mathematics, Science, Logic
    IQ_MASTER: {
      name: 'iq_master',
      description: 'Mathematics, Science, Logic knowledge base',
      domains: ['mathematics', 'science', 'logic', 'coding', 'strategy'],
    },
    // For chat.html - General knowledge
    CHAT_GENERAL: {
      name: 'chat_general',
      description: 'General knowledge and conversation',
      domains: ['general', 'conversation', 'help'],
    },
    // Medical knowledge
    MEDICAL_KB: {
      name: 'medical_kb',
      description: 'Medical and health information',
      domains: ['medical', 'health', 'diagnosis'],
    },
    // Legal knowledge
    LEGAL_KB: {
      name: 'legal_kb',
      description: 'Legal information and Turkish law',
      domains: ['legal', 'law', 'contracts'],
    },
  },

  // Mode configuration
  modes: {
    ONLINE: 'online', // Cloud AI + PostgreSQL
    OFFLINE: 'offline', // Local AI + Chromem
    HYBRID: 'hybrid', // Best of both
  },

  // Default mode
  defaultMode: process.env.RECALL_MODE || 'hybrid',

  // Timeout settings (ms)
  timeout: {
    search: 30000,
    upload: 60000,
    embedding: 45000,
  },
};

module.exports = config;
