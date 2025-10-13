/**
 * Search Meter Integration
 * Integrates SpeedBadge with search inputs
 *
 * Usage:
 * 1. Include SpeedBadge.js and SpeedBadge.css
 * 2. Include this file
 * 3. Add data-search-meter to your search input
 *
 * Example:
 * <input type="text" data-search-meter placeholder="Search..." />
 * <div id="search-speed-badge"></div>
 */

(function() {
  'use strict';

  class SearchMeterIntegration {
    constructor(inputElement, options = {}) {
      this.input = typeof inputElement === 'string'
        ? document.querySelector(inputElement)
        : inputElement;

      if (!this.input) {
        console.error('[SearchMeter] Input element not found');
        return;
      }

      this.options = {
        badgeContainer: options.badgeContainer || this.createBadgeContainer(),
        apiEndpoint: options.apiEndpoint || '/api/metrics/measure',
        debounceMs: options.debounceMs || 300,
        showCost: options.showCost !== false,
        modality: options.modality || 'search',
        ...options
      };

      this.badge = null;
      this.debounceTimer = null;
      this.lastMeasurement = null;

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
        console.error('[SearchMeter] SpeedBadge not found. Include SpeedBadge.js first.');
        return;
      }

      // Attach event listeners
      this.input.addEventListener('input', this.handleInput.bind(this));
      this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Create badge container if not provided
     */
    createBadgeContainer() {
      const container = document.createElement('div');
      container.className = 'search-meter-badge-container';
      container.style.display = 'inline-block';
      container.style.marginLeft = '0.5rem';

      // Insert after input
      if (this.input && this.input.parentNode) {
        this.input.parentNode.insertBefore(container, this.input.nextSibling);
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

      // Show loading state
      if (this.badge) {
        this.badge.show();
        this.badge.setLoading(true);
      }

      // Debounce measurement
      this.debounceTimer = setTimeout(() => {
        this.measurePrompt(prompt);
      }, this.options.debounceMs);
    }

    /**
     * Handle Enter key press
     */
    handleKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();

        const prompt = event.target.value.trim();
        if (!prompt) return;

        // Clear debounce timer
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        // Immediate measurement on Enter
        this.measurePrompt(prompt, true);
      }
    }

    /**
     * Measure prompt tokens and latency
     */
    async measurePrompt(prompt, isSubmit = false) {
      try {
        // Generate idempotency key
        const idempotencyKey = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
          const { tokensTotal, latencyMs, costUsd } = data.metrics;

          // Update badge
          if (this.badge) {
            this.badge.update({
              tokens: tokensTotal,
              ms: latencyMs || latency,
              cost: costUsd,
              loading: false
            });
          }

          // Store last measurement
          this.lastMeasurement = {
            tokens: tokensTotal,
            ms: latencyMs || latency,
            cost: costUsd,
            timestamp: new Date().toISOString()
          };

          // Dispatch custom event
          this.input.dispatchEvent(new CustomEvent('search-meter-updated', {
            detail: this.lastMeasurement
          }));

          // If this is a submit, trigger search event
          if (isSubmit) {
            this.input.dispatchEvent(new CustomEvent('search-meter-submit', {
              detail: {
                prompt,
                metrics: this.lastMeasurement
              }
            }));
          }
        }
      } catch (error) {
        console.error('[SearchMeter] Measurement failed:', error);

        // Show error state
        if (this.badge) {
          this.badge.update({
            tokens: 0,
            ms: 0,
            cost: 0,
            loading: false
          });
        }
      }
    }

    /**
     * Get last measurement
     */
    getLastMeasurement() {
      return this.lastMeasurement;
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
   * Auto-initialize all search meters
   */
  function initSearchMeters() {
    const inputs = document.querySelectorAll('[data-search-meter]');

    inputs.forEach(input => {
      const badgeContainerId = input.dataset.searchMeterBadge;
      const badgeContainer = badgeContainerId
        ? document.getElementById(badgeContainerId)
        : null;

      const showCost = input.dataset.searchMeterCost !== 'false';
      const modality = input.dataset.searchMeterModality || 'search';

      new SearchMeterIntegration(input, {
        badgeContainer,
        showCost,
        modality
      });
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchMeters);
  } else {
    initSearchMeters();
  }

  // Export for module use
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchMeterIntegration;
  }

  // Export for global use
  if (typeof window !== 'undefined') {
    window.SearchMeterIntegration = SearchMeterIntegration;
  }
})();
