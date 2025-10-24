/**
 * 🤖 AILYDIAN AI CLIENT - UNIFIED MULTI-PROVIDER
 * Groq-first fallback strategy for maximum reliability
 *
 * Priority Order:
 * 1. Groq (llama-3.3-70b) - Ultra-fast, 0.5-1s response
 * 2. Anthropic Claude - Best reasoning
 * 3. Azure OpenAI - Enterprise reliability
 * 4. OpenAI GPT-4 - Final fallback
 *
 * @version 2.0.0
 * @author Ailydian Team
 */

class AilydianAIClient {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 60000, // 60 seconds
      retryAttempts: options.retryAttempts || 2,
      language: options.language || 'tr-TR',
      domain: options.domain || 'general',
      ...options
    };

    // Provider priority order (Groq first!)
    this.providers = [
      { name: 'Groq', endpoint: '/api/lydian-iq/solve', priority: 1 },
      { name: 'Claude', endpoint: '/api/chat/claude', priority: 2 },
      { name: 'Azure', endpoint: '/api/chat/azure', priority: 3 },
      { name: 'OpenAI', endpoint: '/api/chat/openai', priority: 4 }
    ];

    this.currentProvider = null;
    this.failedProviders = new Set();
  }

  /**
   * Send AI request with automatic fallback
   * @param {string} message - User message
   * @param {object} options - Request options
   * @returns {Promise<object>} AI response
   */
  async chat(message, options = {}) {
    const requestOptions = { ...this.options, ...options };

    // Try each provider in priority order
    for (const provider of this.providers) {
      // Skip failed providers
      if (this.failedProviders.has(provider.name)) {
        continue;
      }

      try {
        console.log(`🤖 Trying ${provider.name} AI...`);

        const response = await this._makeRequest(provider, message, requestOptions);

        // Success! Mark this as current provider
        this.currentProvider = provider.name;
        console.log(`✅ ${provider.name} AI responded successfully`);

        return {
          success: true,
          provider: provider.name,
          data: response,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.warn(`⚠️ ${provider.name} failed:`, error.message);

        // Mark provider as failed for this session
        this.failedProviders.add(provider.name);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error('All AI providers failed. Please try again later.');
  }

  /**
   * Make request to specific provider
   * @private
   */
  async _makeRequest(provider, message, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      // Determine endpoint based on provider and context
      let endpoint = provider.endpoint;

      // For LyDian IQ, always use solve endpoint
      if (options.domain && ['mathematics', 'coding', 'science', 'strategy', 'logistics'].includes(options.domain)) {
        endpoint = '/api/lydian-iq/solve';
      }

      const requestBody = {
        problem: message,
        message: message,
        domain: options.domain || 'general',
        language: options.language || 'tr-TR',
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000,
        stream: options.stream || false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (data.success === false) {
        throw new Error(data.error || 'AI request failed');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`${provider.name} timeout after ${options.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Stream AI response with automatic fallback
   * @param {string} message - User message
   * @param {function} onChunk - Callback for each chunk
   * @param {object} options - Request options
   */
  async streamChat(message, onChunk, options = {}) {
    const requestOptions = { ...this.options, ...options, stream: true };

    for (const provider of this.providers) {
      if (this.failedProviders.has(provider.name)) {
        continue;
      }

      try {
        console.log(`🤖 Streaming from ${provider.name}...`);

        await this._streamRequest(provider, message, onChunk, requestOptions);

        this.currentProvider = provider.name;
        console.log(`✅ ${provider.name} stream completed`);
        return;

      } catch (error) {
        console.warn(`⚠️ ${provider.name} stream failed:`, error.message);
        this.failedProviders.add(provider.name);
        continue;
      }
    }

    throw new Error('All AI providers failed for streaming.');
  }

  /**
   * Stream request to specific provider
   * @private
   */
  async _streamRequest(provider, message, onChunk, options) {
    let endpoint = provider.endpoint;

    if (options.domain && ['mathematics', 'coding', 'science', 'strategy', 'logistics'].includes(options.domain)) {
      endpoint = '/api/lydian-iq/solve';
    }

    const requestBody = {
      problem: message,
      message: message,
      domain: options.domain || 'general',
      language: options.language || 'tr-TR',
      stream: true
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            onChunk(parsed);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Get current provider status
   */
  getStatus() {
    return {
      currentProvider: this.currentProvider,
      failedProviders: Array.from(this.failedProviders),
      availableProviders: this.providers
        .filter(p => !this.failedProviders.has(p.name))
        .map(p => p.name)
    };
  }

  /**
   * Reset failed providers (retry all)
   */
  resetProviders() {
    this.failedProviders.clear();
    this.currentProvider = null;
    console.log('🔄 All AI providers reset');
  }

  /**
   * Get provider health check
   */
  async healthCheck() {
    const results = {};

    for (const provider of this.providers) {
      try {
        const startTime = Date.now();

        await fetch('/api/health', {
          method: 'GET',
          headers: { 'X-Provider': provider.name }
        });

        const responseTime = Date.now() - startTime;

        results[provider.name] = {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          priority: provider.priority
        };

      } catch (error) {
        results[provider.name] = {
          status: 'unhealthy',
          error: error.message,
          priority: provider.priority
        };
      }
    }

    return results;
  }
}

// Export for global use
window.AilydianAIClient = AilydianAIClient;

// Create default instance
window.ailydianAI = new AilydianAIClient({
  language: navigator.language || 'tr-TR',
  timeout: 60000
});

console.log('🤖 Ailydian AI Client loaded - Groq-first fallback strategy active');
