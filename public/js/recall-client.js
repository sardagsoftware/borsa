/* global window, document, navigator, fetch, AbortController */
/**
 * AILYDIAN Recall Client
 * Frontend RAG client with Online/Offline support
 *
 * @version 1.0.0
 * @license MIT
 */

class RecallClient {
  constructor(options = {}) {
    this.options = {
      baseUrl: options.baseUrl || '',
      timeout: options.timeout || 30000,
      mode: options.mode || 'hybrid', // 'online', 'offline', 'hybrid'
      domain: options.domain || 'general',
      autoDetect: options.autoDetect !== false,
      onModeChange: options.onModeChange || null,
      onStatusChange: options.onStatusChange || null,
      ...options,
    };

    this.isOnline = navigator.onLine;
    this.lastHealthCheck = null;
    this.serviceStatus = 'unknown';

    // Initialize network listeners
    this._initNetworkListeners();

    // Initial status check
    if (this.options.autoDetect) {
      this.checkStatus().catch(() => {});
    }
  }

  /**
   * Initialize network status listeners
   * @private
   */
  _initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this._notifyModeChange();
      this.checkStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this._notifyModeChange();
    });
  }

  /**
   * Notify mode change callback
   * @private
   */
  _notifyModeChange() {
    if (this.options.onModeChange) {
      this.options.onModeChange({
        mode: this.getEffectiveMode(),
        isOnline: this.isOnline,
        serviceStatus: this.serviceStatus,
      });
    }
  }

  /**
   * Get effective mode based on network status
   * @returns {string}
   */
  getEffectiveMode() {
    if (!this.isOnline) {
      return 'offline';
    }
    return this.options.mode;
  }

  /**
   * Check service status
   * @returns {Promise<object>}
   */
  async checkStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.options.baseUrl}/api/recall`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        this.serviceStatus = 'online';
        this.lastHealthCheck = new Date();

        if (this.options.onStatusChange) {
          this.options.onStatusChange({
            status: 'online',
            data,
            timestamp: this.lastHealthCheck,
          });
        }

        return data;
      }

      this.serviceStatus = 'degraded';
      return { status: 'degraded' };
    } catch (error) {
      this.serviceStatus = 'offline';

      if (this.options.onStatusChange) {
        this.options.onStatusChange({
          status: 'offline',
          error: error.message,
        });
      }

      return { status: 'offline', error: error.message };
    }
  }

  /**
   * Search knowledge base
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>}
   */
  async search(query, options = {}) {
    const { domain = this.options.domain, topK = 5, includeContext = true } = options;

    try {
      const response = await this._request('/api/recall/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          domain,
          topK,
          mode: this.getEffectiveMode(),
          includeContext,
        }),
      });

      return response;
    } catch (error) {
      console.warn('[LYRA_CLIENT] Search failed:', error.message);

      // Return empty result on error
      return {
        success: false,
        error: error.message,
        results: [],
        fallback: true,
      };
    }
  }

  /**
   * Send message with RAG enhancement
   * @param {string} message - User message
   * @param {object} options - Message options
   * @returns {Promise<object>}
   */
  async chat(message, options = {}) {
    const {
      domain = this.options.domain,
      conversationHistory = [],
      preferOffline = false,
      maxTokens = 4000,
      temperature = 0.7,
      language = 'tr-TR',
    } = options;

    try {
      const response = await this._request('/api/recall/hybrid', {
        method: 'POST',
        body: JSON.stringify({
          message,
          domain,
          preferOffline: preferOffline || !this.isOnline,
          conversationHistory,
          maxTokens,
          temperature,
          language,
        }),
      });

      return response;
    } catch (error) {
      console.warn('[LYRA_CLIENT] Chat failed:', error.message);

      // Attempt fallback to basic chat endpoint
      try {
        return await this._fallbackChat(message, options);
      } catch (_fallbackError) {
        return {
          success: false,
          error: error.message,
          fallback: true,
          response: this.isOnline
            ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
            : 'Çevrimdışı modda ve yerel bilgi tabanında yanıt bulunamadı.',
        };
      }
    }
  }

  /**
   * Fallback to basic chat endpoint
   * @private
   */
  async _fallbackChat(message, options) {
    const response = await this._request('/api/chat/specialized', {
      method: 'POST',
      body: JSON.stringify({
        message,
        aiType: options.domain || 'chat',
        language: options.language || 'tr-TR',
      }),
    });

    return {
      ...response,
      fallback: true,
      source: 'basic_chat',
    };
  }

  /**
   * Make HTTP request
   * @private
   */
  async _request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(`${this.options.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Set operating mode
   * @param {string} mode - 'online', 'offline', or 'hybrid'
   */
  setMode(mode) {
    if (!['online', 'offline', 'hybrid'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    this.options.mode = mode;
    this._notifyModeChange();
  }

  /**
   * Set domain context
   * @param {string} domain - Domain name
   */
  setDomain(domain) {
    this.options.domain = domain;
  }

  /**
   * Get current status
   * @returns {object}
   */
  getStatus() {
    return {
      mode: this.options.mode,
      effectiveMode: this.getEffectiveMode(),
      isOnline: this.isOnline,
      serviceStatus: this.serviceStatus,
      domain: this.options.domain,
      lastCheck: this.lastHealthCheck,
    };
  }

  /**
   * Create status indicator element
   * @returns {HTMLElement}
   */
  createStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'recall-status-indicator';
    indicator.innerHTML = `
      <div class="recall-status-dot"></div>
      <span class="recall-status-text">Checking...</span>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .recall-status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .recall-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6b7280;
        transition: all 0.3s ease;
      }

      .recall-status-indicator[data-status="online"] .recall-status-dot {
        background: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
      }

      .recall-status-indicator[data-status="offline"] .recall-status-dot {
        background: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
      }

      .recall-status-indicator[data-status="hybrid"] .recall-status-dot {
        background: #f59e0b;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
      }

      .recall-status-text {
        color: rgba(255, 255, 255, 0.8);
      }
    `;

    if (!document.querySelector('#recall-status-styles')) {
      style.id = 'recall-status-styles';
      document.head.appendChild(style);
    }

    // Update indicator based on status
    this._updateIndicator(indicator);

    // Listen for status changes
    this.options.onStatusChange = status => {
      this._updateIndicator(indicator, status);
    };

    this.options.onModeChange = status => {
      this._updateIndicator(indicator, status);
    };

    return indicator;
  }

  /**
   * Update status indicator
   * @private
   */
  _updateIndicator(indicator, _status = null) {
    const effectiveMode = this.getEffectiveMode();
    const textEl = indicator.querySelector('.recall-status-text');

    indicator.setAttribute('data-status', effectiveMode);

    const modeLabels = {
      online: '🟢 Çevrimiçi',
      offline: '🔴 Çevrimdışı',
      hybrid: '🟡 Hibrit',
    };

    textEl.textContent = modeLabels[effectiveMode] || effectiveMode;
  }
}

// Export for global use
window.RecallClient = RecallClient;

// Auto-initialize with default settings
window.ailydianRecall = new RecallClient({
  domain: 'general',
  autoDetect: true,
});
