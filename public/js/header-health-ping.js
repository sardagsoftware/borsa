// 🏥 HEADER HEALTH PING - Inline status indicators for navigation
// Adds colored status dots next to header links based on real-time health

/**
 * Header Health Ping Configuration
 */
const HEADER_HEALTH_CONFIG = {
  apiEndpoint: '/api/healthmap',
  refreshInterval: 60000, // 60 seconds
  enabledByDefault: true,
  dotStyle: {
    size: '6px',
    marginLeft: '6px',
    verticalAlign: 'middle'
  }
};

/**
 * Map of URLs to health check names
 * This allows matching navigation links to health check targets
 */
const URL_TO_HEALTH_MAP = {
  '/auth.html': 'Auth',
  '/chat.html': 'Chat',
  '/lydian-iq.html': 'IQ',
  '/enterprise.html': 'AI Ops',
  '/status.html': 'Status',
  '/developers.html': 'Developers',
  '/api-reference.html': 'API Docs',
  '/changelog.html': 'Changelog',
  '/about.html': 'About',
  '/blog.html': 'Blog',
  '/careers.html': 'Careers',
  '/privacy.html': 'Privacy',
  '/contact.html': 'Contact',
  '/help.html': 'Help',
  '/dashboard.html': 'Dashboard',
  '/models.html': 'Models'
};

/**
 * Header Health Ping Controller
 */
class HeaderHealthPing {
  constructor(options = {}) {
    this.config = { ...HEADER_HEALTH_CONFIG, ...options };
    this.healthData = new Map();
    this.statusDots = new Map();
    this.refreshTimer = null;
  }

  /**
   * Initialize the header health ping system
   */
  async init() {
    if (!this.config.enabledByDefault) {
      console.log('⏸️ Header health ping disabled');
      return;
    }

    console.log('🚀 Initializing Header Health Ping...');

    // Fetch initial health data
    await this.fetchHealth();

    // Find all navigation links and add status dots
    this.attachStatusDots();

    // Start auto-refresh
    this.startAutoRefresh();

    console.log('✅ Header Health Ping initialized');
  }

  /**
   * Fetch health data from API
   */
  async fetchHealth() {
    try {
      const response = await fetch(this.config.apiEndpoint);

      if (!response.ok) {
        console.warn(`⚠️ Health API returned ${response.status}`);
        return;
      }

      const data = await response.json();

      if (!data.success || !data.items) {
        console.warn('⚠️ Invalid health data format');
        return;
      }

      // Update health data map
      this.healthData.clear();
      data.items.forEach(item => {
        this.healthData.set(item.name, item.status);
      });

      // Update existing status dots
      this.updateAllDots();

    } catch (error) {
      console.error('❌ Failed to fetch health data:', error);
    }
  }

  /**
   * Find navigation links and attach status dots
   */
  attachStatusDots() {
    // Find all <a> tags in header/nav
    const headers = document.querySelectorAll('header, nav, .navbar, .header, .nav');

    headers.forEach(header => {
      const links = header.querySelectorAll('a[href]');

      links.forEach(link => {
        const href = link.getAttribute('href');

        // Check if this link maps to a health check target
        if (URL_TO_HEALTH_MAP[href]) {
          const targetName = URL_TO_HEALTH_MAP[href];
          this.addStatusDot(link, targetName);
        }
      });
    });
  }

  /**
   * Add status dot to a link element
   * @param {HTMLAnchorElement} linkElement
   * @param {string} targetName - Name of the health check target
   */
  addStatusDot(linkElement, targetName) {
    // Check if dot already exists
    if (this.statusDots.has(linkElement)) {
      return;
    }

    // Get current status (default to 'down' if not available yet)
    const status = this.healthData.get(targetName) || 'down';

    // Create status dot
    const dot = createStatusDot(status);
    dot.style.width = this.config.dotStyle.size;
    dot.style.height = this.config.dotStyle.size;
    dot.style.marginLeft = this.config.dotStyle.marginLeft;
    dot.style.verticalAlign = this.config.dotStyle.verticalAlign;

    // Store reference
    this.statusDots.set(linkElement, { dot, targetName });

    // Append to link
    linkElement.appendChild(dot);
  }

  /**
   * Update all status dots with latest health data
   */
  updateAllDots() {
    this.statusDots.forEach(({ dot, targetName }, linkElement) => {
      const status = this.healthData.get(targetName) || 'down';
      updateStatusDot(dot, status);
    });
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.fetchHealth();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Manually refresh health data
   */
  async refresh() {
    await this.fetchHealth();
  }

  /**
   * Destroy the health ping system
   */
  destroy() {
    this.stopAutoRefresh();

    // Remove all status dots
    this.statusDots.forEach(({ dot }, linkElement) => {
      if (dot && dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
    });

    this.statusDots.clear();
    this.healthData.clear();
  }
}

/**
 * Global instance for easy access
 */
let headerHealthPing = null;

/**
 * Initialize header health ping on DOM ready
 */
function initHeaderHealthPing(options = {}) {
  if (headerHealthPing) {
    console.warn('⚠️ Header Health Ping already initialized');
    return headerHealthPing;
  }

  headerHealthPing = new HeaderHealthPing(options);
  headerHealthPing.init();

  return headerHealthPing;
}

/**
 * Auto-initialize if this script is loaded directly
 * (Can be disabled by setting window.DISABLE_AUTO_INIT = true before loading script)
 */
if (typeof window !== 'undefined') {
  if (!window.DISABLE_HEADER_HEALTH_PING_AUTO_INIT) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initHeaderHealthPing();
      });
    } else {
      // DOM already loaded
      initHeaderHealthPing();
    }
  }

  // Expose to window for manual control
  window.HeaderHealthPing = HeaderHealthPing;
  window.initHeaderHealthPing = initHeaderHealthPing;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HeaderHealthPing,
    initHeaderHealthPing
  };
}
