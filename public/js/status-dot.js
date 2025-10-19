// 🟢 STATUS DOT COMPONENT - Vanilla JS
// Shows colored status indicator (up/warn/down)

/**
 * Create a status dot element
 * @param {string} status - 'up' | 'warn' | 'down'
 * @returns {HTMLElement}
 */
function createStatusDot(status = 'down') {
  const dot = document.createElement('span');
  dot.className = 'status-dot';
  dot.setAttribute('data-status', status);

  // Styles map
  const styles = {
    up: {
      background: 'linear-gradient(180deg, #21e39b, #00c47f)',
      boxShadow: '0 0 12px rgba(0,196,127,.55)'
    },
    warn: {
      background: 'linear-gradient(180deg, #ffd166, #f9b233)',
      boxShadow: '0 0 12px rgba(249,178,51,.55)'
    },
    down: {
      background: 'linear-gradient(180deg, #ff6b6b, #e63946)',
      boxShadow: '0 0 12px rgba(230,57,70,.55)'
    }
  };

  const style = styles[status] || styles.down;

  Object.assign(dot.style, {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    marginRight: '8px',
    verticalAlign: 'middle',
    ...style
  });

  return dot;
}

/**
 * Update existing status dot
 * @param {HTMLElement} dot
 * @param {string} status
 */
function updateStatusDot(dot, status) {
  if (!dot) return;

  dot.setAttribute('data-status', status);

  const styles = {
    up: {
      background: 'linear-gradient(180deg, #21e39b, #00c47f)',
      boxShadow: '0 0 12px rgba(0,196,127,.55)'
    },
    warn: {
      background: 'linear-gradient(180deg, #ffd166, #f9b233)',
      boxShadow: '0 0 12px rgba(249,178,51,.55)'
    },
    down: {
      background: 'linear-gradient(180deg, #ff6b6b, #e63946)',
      boxShadow: '0 0 12px rgba(230,57,70,.55)'
    }
  };

  const style = styles[status] || styles.down;
  Object.assign(dot.style, style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createStatusDot, updateStatusDot };
}
