/**
 * Chat Meter Integration
 * Integrates SpeedBadge with chat prompt inputs
 *
 * Usage:
 * 1. Include SpeedBadge.js and SpeedBadge.css
 * 2. Include this file
 * 3. Add data-chat-meter to your chat input/textarea
 *
 * Example:
 * <textarea data-chat-meter placeholder="Type your message..."></textarea>
 * <div id="chat-speed-badge"></div>
 */

(function() {
  'use strict';

  class ChatMeterIntegration {
    constructor(inputElement, options = {}) {
      this.input = typeof inputElement === 'string'
        ? document.querySelector(inputElement)
        : inputElement;

      if (!this.input) {
        console.error('[ChatMeter] Input element not found');
        return;
      }

      this.options = {
        badgeContainer: options.badgeContainer || this.createBadgeContainer(),
        apiEndpoint: options.apiEndpoint || '/api/metrics/measure',
        debounceMs: options.debounceMs || 500, // Longer debounce for chat
        showCost: options.showCost !== false,
        modality: options.modality || 'chat',
        showEstimate: options.showEstimate !== false, // Show estimate while typing
        ...options
      };

      this.badge = null;
      this.debounceTimer = null;
      this.lastMeasurement = null;
      this.isSubmitting = false;

      this.init();
    }

    /**
     * Initialize integration
     */
    init() {
      // Create SpeedBadge instance
      if (typeof SpeedBadge !== 'undefined') {
        this.badge = new SpeedBadge(this.options.badgeContainer, {
          size: 'sm',
          showCost: this.options.showCost,
          loading: false
        });
        this.badge.hide(); // Hide initially
      } else {
        console.error('[ChatMeter] SpeedBadge not found. Include SpeedBadge.js first.');
        return;
      }

      // Attach event listeners
      this.input.addEventListener('input', this.handleInput.bind(this));
      this.input.addEventListener('keydown', this.handleKeydown.bind(this));

      // If there's a send button, attach to it too
      const sendButton = this.input.form?.querySelector('[type="submit"]') ||
                         document.querySelector('[data-chat-send]');
      if (sendButton) {
        sendButton.addEventListener('click', this.handleSubmit.bind(this));
      }
    }

    /**
     * Create badge container if not provided
     */
    createBadgeContainer() {
      const container = document.createElement('div');
      container.className = 'chat-meter-badge-container';
      container.style.position = 'relative';
      container.style.display = 'inline-block';

      // Try to insert near input
      if (this.input && this.input.parentNode) {
        // Look for a better insertion point (prompt bar footer, etc.)
        const promptBar = this.input.closest('[data-prompt-bar]') ||
                          this.input.closest('.prompt-bar') ||
                          this.input.parentNode;

        promptBar.appendChild(container);
      }

      return container;
    }

    /**
     * Handle input event (debounced)
     */
    handleInput(event) {
      const prompt = event.target.value.trim();

      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Hide badge if input is empty
      if (!prompt) {
        if (this.badge) this.badge.hide();
        return;
      }

      // Show estimate while typing (if enabled)
      if (this.options.showEstimate && this.badge) {
        const estimatedTokens = Math.ceil(prompt.length / 4); // BPE approximation
        this.badge.show();
        this.badge.update({
          tokens: estimatedTokens,
          ms: 0,
          cost: 0,
          loading: false
        });
      }

      // Debounce full measurement
      this.debounceTimer = setTimeout(() => {
        this.measurePrompt(prompt, false);
      }, this.options.debounceMs);
    }

    /**
     * Handle Ctrl/Cmd+Enter for submit
     */
    handleKeydown(event) {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        this.handleSubmit(event);
      }
    }

    /**
     * Handle submit (send button click or Ctrl+Enter)
     */
    async handleSubmit(event) {
      if (event) {
        event.preventDefault();
      }

      const prompt = this.input.value.trim();
      if (!prompt || this.isSubmitting) return;

      this.isSubmitting = true;

      // Clear debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Show loading state
      if (this.badge) {
        this.badge.show();
        this.badge.setLoading(true);
      }

      // Measure prompt (final measurement before send)
      await this.measurePrompt(prompt, true);

      this.isSubmitting = false;
    }

    /**
     * Measure prompt tokens and latency
     */
    async measurePrompt(prompt, isSubmit = false) {
      try {
        // Generate idempotency key
        const idempotencyKey = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const startTime = Date.now();

        const response = await fetch(this.options.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({
            prompt,
            modality: this.options.modality,
            model: 'default'
          })
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.ok && data.metrics) {
          const { tokensPrompt, tokensTotal, latencyMs, costUsd } = data.metrics;

          // Update badge
          if (this.badge) {
            this.badge.update({
              tokens: tokensTotal || tokensPrompt,
              ms: latencyMs || latency,
              cost: costUsd,
              loading: false
            });
          }

          // Store last measurement
          this.lastMeasurement = {
            tokensPrompt,
            tokensTotal: tokensTotal || tokensPrompt,
            ms: latencyMs || latency,
            cost: costUsd,
            timestamp: new Date().toISOString(),
            isSubmit
          };

          // Dispatch custom event
          this.input.dispatchEvent(new CustomEvent('chat-meter-updated', {
            detail: this.lastMeasurement
          }));

          // If this is a submit, trigger send event
          if (isSubmit) {
            this.input.dispatchEvent(new CustomEvent('chat-meter-submit', {
              detail: {
                prompt,
                metrics: this.lastMeasurement
              }
            }));

            // Optional: Clear input after measurement
            // this.input.value = '';
            // this.badge.hide();
          }
        }
      } catch (error) {
        console.error('[ChatMeter] Measurement failed:', error);

        // Show error state
        if (this.badge) {
          this.badge.update({
            tokens: 0,
            ms: 0,
            cost: 0,
            loading: false
          });
        }

        this.isSubmitting = false;
      }
    }

    /**
     * Get last measurement
     */
    getLastMeasurement() {
      return this.lastMeasurement;
    }

    /**
     * Update after message sent (with actual completion tokens)
     */
    updateAfterResponse(completionTokens, actualLatencyMs) {
      if (!this.lastMeasurement) return;

      const tokensTotal = this.lastMeasurement.tokensPrompt + completionTokens;
      const costUsd = this.calculateCost(this.lastMeasurement.tokensPrompt, completionTokens);

      this.lastMeasurement.tokensCompletion = completionTokens;
      this.lastMeasurement.tokensTotal = tokensTotal;
      this.lastMeasurement.ms = actualLatencyMs;
      this.lastMeasurement.cost = costUsd;

      // Update badge with final numbers
      if (this.badge) {
        this.badge.update({
          tokens: tokensTotal,
          ms: actualLatencyMs,
          cost: costUsd,
          loading: false
        });
      }

      // Dispatch update event
      this.input.dispatchEvent(new CustomEvent('chat-meter-response-complete', {
        detail: this.lastMeasurement
      }));
    }

    /**
     * Calculate cost (simplified)
     */
    calculateCost(promptTokens, completionTokens) {
      const costPer1K = 0.0005; // Default cost
      return ((promptTokens + completionTokens) / 1000) * costPer1K;
    }

    /**
     * Reset meter
     */
    reset() {
      if (this.badge) {
        this.badge.hide();
      }
      this.lastMeasurement = null;
      this.isSubmitting = false;
    }

    /**
     * Destroy integration
     */
    destroy() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      if (this.badge) {
        this.badge.destroy();
      }

      // Remove event listeners
      this.input.removeEventListener('input', this.handleInput);
      this.input.removeEventListener('keydown', this.handleKeydown);
    }
  }

  /**
   * Auto-initialize all chat meters
   */
  function initChatMeters() {
    const inputs = document.querySelectorAll('[data-chat-meter]');

    inputs.forEach(input => {
      const badgeContainerId = input.dataset.chatMeterBadge;
      const badgeContainer = badgeContainerId
        ? document.getElementById(badgeContainerId)
        : null;

      const showCost = input.dataset.chatMeterCost !== 'false';
      const showEstimate = input.dataset.chatMeterEstimate !== 'false';
      const modality = input.dataset.chatMeterModality || 'chat';

      new ChatMeterIntegration(input, {
        badgeContainer,
        showCost,
        showEstimate,
        modality
      });
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatMeters);
  } else {
    initChatMeters();
  }

  // Export for module use
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatMeterIntegration;
  }

  // Export for global use
  if (typeof window !== 'undefined') {
    window.ChatMeterIntegration = ChatMeterIntegration;
  }
})();
