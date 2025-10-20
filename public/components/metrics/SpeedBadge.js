/**
 * SpeedBadge Component
 * Displays real-time token count, latency, and cost
 *
 * Usage:
 * <div class="speed-badge" data-tokens="150" data-ms="320" data-cost="0.075">
 *   <svg class="speed-badge-icon">...</svg>
 *   <span class="speed-badge-text">150 token • 320 ms</span>
 * </div>
 *
 * Features:
 * - Glass morphism design (theme-compatible)
 * - Motion-safe animations
 * - Loading state support
 * - Responsive sizing (sm, md)
 */

class SpeedBadge {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('SpeedBadge: Container not found');
    }

    this.options = {
      size: options.size || 'md', // 'sm' or 'md'
      showCost: options.showCost !== false, // Show cost by default
      loading: options.loading || false,
      tokens: options.tokens || 0,
      ms: options.ms || 0,
      cost: options.cost || 0,
      ...options
    };

    this.render();
  }

  /**
   * Render the badge
   */
  render() {
    const { size, loading, tokens, ms, cost, showCost } = this.options;

    // Create badge HTML
    const badgeHTML = `
      <div class="speed-badge speed-badge--${size} ${loading ? 'speed-badge--loading' : ''}"
           data-tokens="${tokens}"
           data-ms="${ms}"
           data-cost="${cost}">
        <svg class="speed-badge-icon"
             width="16"
             height="16"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span class="speed-badge-text">
          ${loading ? 'Calculating...' : this.formatText(tokens, ms, cost, showCost)}
        </span>
      </div>
    `;

    this.container.innerHTML = badgeHTML;
    this.badgeElement = this.container.querySelector('.speed-badge');
  }

  /**
   * Format badge text
   */
  formatText(tokens, ms, cost, showCost) {
    const parts = [];

    if (tokens > 0) {
      parts.push(`${tokens} token${tokens !== 1 ? 's' : ''}`);
    }

    if (ms > 0) {
      parts.push(`${ms} ms`);
    }

    if (showCost && cost > 0) {
      parts.push(`$${cost.toFixed(4)}`);
    }

    return parts.join(' • ') || 'Ready';
  }

  /**
   * Update badge values
   */
  update(data) {
    const { tokens, ms, cost, loading } = data;

    if (tokens !== undefined) this.options.tokens = tokens;
    if (ms !== undefined) this.options.ms = ms;
    if (cost !== undefined) this.options.cost = cost;
    if (loading !== undefined) this.options.loading = loading;

    // Re-render
    this.render();

    // Animate update (motion-safe)
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      this.badgeElement.classList.add('speed-badge--updated');
      setTimeout(() => {
        this.badgeElement.classList.remove('speed-badge--updated');
      }, 600);
    }
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.update({ loading });
  }

  /**
   * Show badge
   */
  show() {
    this.container.style.display = 'block';
  }

  /**
   * Hide badge
   */
  hide() {
    this.container.style.display = 'none';
  }

  /**
   * Destroy badge
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

/**
 * Initialize SpeedBadge from data attributes
 * Usage: <div data-speed-badge data-tokens="150" data-ms="320"></div>
 */
function initSpeedBadges() {
  const badges = document.querySelectorAll('[data-speed-badge]');

  badges.forEach(element => {
    const tokens = parseInt(element.dataset.tokens) || 0;
    const ms = parseInt(element.dataset.ms) || 0;
    const cost = parseFloat(element.dataset.cost) || 0;
    const size = element.dataset.size || 'md';
    const showCost = element.dataset.showCost !== 'false';

    new SpeedBadge(element, {
      tokens,
      ms,
      cost,
      size,
      showCost
    });
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpeedBadges);
} else {
  initSpeedBadges();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeedBadge;
}

// Export for global use
if (typeof window !== 'undefined') {
  window.SpeedBadge = SpeedBadge;
}
