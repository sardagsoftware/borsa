/* global fetch, AbortController, AbortSignal */
/**
 * AILYDIAN LocalRecall Service
 *
 * Node.js wrapper for LocalRecall RAG engine
 * Supports Online (PostgreSQL) and Offline (Chromem) modes
 *
 * @version 1.0.0
 * @license MIT
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const obfuscation = require('./obfuscation');

class AilydianRecall {
  constructor(options = {}) {
    this.options = {
      port: options.port || config.port,
      mode: options.mode || config.defaultMode,
      autoStart: options.autoStart !== false,
      ...options,
    };

    this.process = null;
    this.isRunning = false;
    this.baseUrl = `http://localhost:${this.options.port}`;

    // Ensure directories exist
    this._ensureDirectories();

    // Auto-start if enabled
    if (this.options.autoStart && process.env.NODE_ENV !== 'test') {
      this.start().catch(err => {
        console.warn('[RAG_CORE] Auto-start failed:', err.message);
      });
    }
  }

  /**
   * Ensure required directories exist
   * @private
   */
  _ensureDirectories() {
    const dirs = [config.collectionsPath, config.assetsPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Start LocalRecall process
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      console.log('[RAG_CORE] Already running');
      return;
    }

    // Check if binary exists
    if (!fs.existsSync(config.binaryPath)) {
      throw new Error(`LocalRecall binary not found at ${config.binaryPath}`);
    }

    // Environment variables for LocalRecall
    const env = {
      ...process.env,
      LISTENING_ADDRESS: `:${this.options.port}`,
      COLLECTION_DB_PATH: config.collectionsPath,
      FILE_ASSETS: config.assetsPath,
      VECTOR_ENGINE: this._getVectorEngine(),
      EMBEDDING_MODEL: config.embedding.model,
      MAX_CHUNKING_SIZE: String(config.chunking.maxSize),
      CHUNK_OVERLAP: String(config.chunking.overlap),
    };

    // Add PostgreSQL config if online mode
    if (this.options.mode !== 'offline' && config.postgres.url) {
      env.DATABASE_URL = config.postgres.url;
      env.HYBRID_SEARCH_BM25_WEIGHT = String(config.postgres.bm25Weight);
      env.HYBRID_SEARCH_VECTOR_WEIGHT = String(config.postgres.vectorWeight);
    }

    return new Promise((resolve, reject) => {
      this.process = spawn(config.binaryPath, [], { env, stdio: 'pipe' });

      this.process.stdout.on('data', data => {
        const output = obfuscation.sanitizeModelNames(data.toString());
        if (process.env.DEBUG_RECALL) {
          console.log('[RAG_CORE]', output);
        }
      });

      this.process.stderr.on('data', data => {
        const output = obfuscation.sanitizeModelNames(data.toString());
        console.error('[RAG_CORE_ERR]', output);
      });

      this.process.on('error', err => {
        this.isRunning = false;
        reject(err);
      });

      this.process.on('close', code => {
        this.isRunning = false;
        if (code !== 0 && code !== null) {
          console.warn(`[RAG_CORE] Process exited with code ${code}`);
        }
      });

      // Wait for startup
      setTimeout(async () => {
        try {
          await this.healthCheck();
          this.isRunning = true;
          console.log(
            `[RAG_CORE] Started on port ${this.options.port} (${this.options.mode} mode)`
          );
          resolve();
        } catch (err) {
          reject(new Error(`LocalRecall failed to start: ${err.message}`));
        }
      }, 2000);
    });
  }

  /**
   * Stop LocalRecall process
   */
  stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
      this.isRunning = false;
      console.log('[RAG_CORE] Stopped');
    }
  }

  /**
   * Get vector engine based on mode
   * @private
   */
  _getVectorEngine() {
    switch (this.options.mode) {
      case 'offline':
        return 'chromem';
      case 'online':
        return config.postgres.url ? 'postgres' : 'chromem';
      case 'hybrid':
      default:
        return config.postgres.url ? 'postgres' : 'chromem';
    }
  }

  /**
   * Make HTTP request to LocalRecall API
   * @private
   */
  async _request(method, endpoint, body = null, timeout = config.timeout.search) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Health check
   * @returns {Promise<object>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/collections`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return { status: 'healthy', running: response.ok };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Create a new collection
   * @param {string} name - Collection name
   * @returns {Promise<object>}
   */
  async createCollection(name) {
    return this._request('POST', '/api/collections', { name });
  }

  /**
   * List all collections
   * @returns {Promise<object>}
   */
  async listCollections() {
    return this._request('GET', '/api/collections');
  }

  /**
   * Upload file to collection
   * @param {string} collection - Collection name
   * @param {string} filePath - Path to file
   * @param {string} content - File content (alternative to filePath)
   * @returns {Promise<object>}
   */
  async uploadToCollection(collection, filePath = null, content = null) {
    if (!filePath && !content) {
      throw new Error('Either filePath or content must be provided');
    }

    // For text content, create a temporary file
    if (content) {
      const tempPath = path.join(config.assetsPath, `temp_${Date.now()}.txt`);
      fs.writeFileSync(tempPath, content, 'utf-8');
      filePath = tempPath;
    }

    // Use multipart form data for file upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await fetch(`${this.baseUrl}/api/collections/${collection}/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    // Clean up temp file
    if (content && filePath.includes('temp_')) {
      fs.unlinkSync(filePath);
    }

    return response.json();
  }

  /**
   * Search in collection
   * @param {string} collection - Collection name
   * @param {string} query - Search query
   * @param {number} topK - Number of results
   * @returns {Promise<object>}
   */
  async search(collection, query, topK = 5) {
    return this._request('POST', `/api/collections/${collection}/search`, {
      query,
      top_k: topK,
    });
  }

  /**
   * Search with RAG context enhancement
   * @param {string} query - User query
   * @param {object} options - Search options
   * @returns {Promise<object>}
   */
  async searchWithContext(query, options = {}) {
    const { domain = 'general', collection = null, topK = 5, includeMetadata = true } = options;

    // Determine collection based on domain
    const targetCollection = collection || this._getCollectionForDomain(domain);

    try {
      const results = await this.search(targetCollection, query, topK);

      // Format context for AI consumption
      const context = this._formatContext(results, includeMetadata);

      return {
        success: true,
        query,
        domain,
        collection: targetCollection,
        context,
        results: results.data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: true,
      };
    }
  }

  /**
   * Get collection name for domain
   * @private
   */
  _getCollectionForDomain(domain) {
    const domainLower = domain.toLowerCase();

    // Map domains to collections
    if (['mathematics', 'science', 'coding', 'logic', 'strategy', 'iq'].includes(domainLower)) {
      return config.collections.IQ_MASTER.name;
    }

    if (['medical', 'health', 'diagnosis'].includes(domainLower)) {
      return config.collections.MEDICAL_KB.name;
    }

    if (['legal', 'law', 'contracts'].includes(domainLower)) {
      return config.collections.LEGAL_KB.name;
    }

    return config.collections.CHAT_GENERAL.name;
  }

  /**
   * Format search results as context
   * @private
   */
  _formatContext(results, includeMetadata) {
    if (!results.data || !Array.isArray(results.data)) {
      return '';
    }

    return results.data
      .map((item, index) => {
        let context = `[Kaynak ${index + 1}]\n${item.content || item.text || ''}`;

        if (includeMetadata && item.metadata) {
          context += `\n(Kaynak: ${item.metadata.source || 'bilinmiyor'})`;
        }

        return context;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Initialize default collections
   * @returns {Promise<void>}
   */
  async initializeCollections() {
    const collections = Object.values(config.collections);

    for (const col of collections) {
      try {
        await this.createCollection(col.name);
        console.log(`[RAG_CORE] Collection '${col.name}' created`);
      } catch (error) {
        // Collection might already exist
        if (!error.message.includes('already exists')) {
          console.warn(`[RAG_CORE] Failed to create '${col.name}':`, error.message);
        }
      }
    }
  }

  /**
   * Get current mode
   * @returns {string}
   */
  getMode() {
    return this.options.mode;
  }

  /**
   * Set operating mode
   * @param {string} mode - 'online', 'offline', or 'hybrid'
   */
  async setMode(mode) {
    if (!['online', 'offline', 'hybrid'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.options.mode = mode;

    if (wasRunning) {
      await this.start();
    }
  }

  /**
   * Check network connectivity
   * @returns {Promise<boolean>}
   */
  async isOnline() {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);

      await fetch('https://www.ailydian.com/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smart search with automatic mode selection
   * @param {string} query - Search query
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async smartSearch(query, options = {}) {
    const { domain = 'general', preferOffline = false } = options;

    // Check connectivity
    const online = await this.isOnline();

    // Determine best mode
    let mode = this.options.mode;
    if (preferOffline || !online) {
      mode = 'offline';
    }

    // Get optimal model
    const modelCode = obfuscation.selectOptimalModel({
      domain,
      isOnline: online,
      preferSpeed: options.preferSpeed,
      preferAccuracy: options.preferAccuracy,
    });

    // Search with context
    const contextResult = await this.searchWithContext(query, {
      domain,
      topK: options.topK || 5,
    });

    return {
      ...contextResult,
      mode,
      modelCode,
      isOnline: online,
      modelConfig: obfuscation.getModel(modelCode),
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create AilydianRecall instance
 * @param {object} options - Options
 * @returns {AilydianRecall}
 */
function getInstance(options = {}) {
  if (!instance) {
    instance = new AilydianRecall(options);
  }
  return instance;
}

module.exports = {
  AilydianRecall,
  getInstance,
  config,
  obfuscation,
};
