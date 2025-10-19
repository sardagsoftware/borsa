// 📍 SUBBAR COMPONENT - Context-Aware Breadcrumbs
// Provides navigation breadcrumbs and page context

class SubBar {
  constructor() {
    this.container = null;
    this.breadcrumbs = [];
    this.init();
  }

  /**
   * Initialize SubBar
   */
  init() {
    // Build UI
    this.buildUI();

    // Auto-detect current page
    this.detectPage();

    // Listen for i18n changes
    if (window.i18n) {
      window.i18n.onChange(() => {
        this.render();
      });
    }
  }

  /**
   * Build SubBar UI
   */
  buildUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'subbar';
    this.container.style.cssText = `
      position: fixed;
      top: 76px;
      left: 0;
      right: 0;
      height: 48px;
      background: rgba(16, 19, 26, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      z-index: 90;
      display: none;
      align-items: center;
      padding: 0 24px;
      transition: transform 0.3s ease;
    `;

    // Insert after header (or at beginning of body)
    const header = document.querySelector('header');
    if (header && header.nextSibling) {
      document.body.insertBefore(this.container, header.nextSibling);
    } else {
      document.body.insertBefore(this.container, document.body.firstChild);
    }
  }

  /**
   * Detect current page and set breadcrumbs
   */
  detectPage() {
    const path = window.location.pathname;

    // Map paths to breadcrumbs
    const pathMap = {
      '/': null, // No breadcrumbs on home
      '/lydian-iq.html': ['Products', 'LyDian IQ'],
      '/medical-expert.html': ['Products', 'Medical Expert AI'],
      '/lydian-legal-search.html': ['Products', 'Legal AI'],
      '/chat.html': ['Products', 'AI Chat'],
      '/ai-cultural-advisor.html': ['Products', 'AI Advisor Hub', 'Cultural Advisor'],
      '/ai-decision-matrix.html': ['Products', 'AI Advisor Hub', 'Decision Matrix'],
      '/ai-life-coach.html': ['Products', 'AI Advisor Hub', 'Life Coach'],
      '/ai-learning-path.html': ['Products', 'AI Advisor Hub', 'Learning Path'],
      '/ai-startup-accelerator.html': ['Products', 'AI Advisor Hub', 'Startup Accelerator'],
      '/ai-meeting-insights.html': ['Products', 'AI Advisor Hub', 'Meeting Insights'],
      '/medical-ai.html': ['Solutions', 'Healthcare & Medicine'],
      '/legal-expert.html': ['Solutions', 'Legal & Justice'],
      '/education.html': ['Solutions', 'Education'],
      '/enterprise.html': ['Solutions', 'Enterprise AI'],
      '/dashboard.html': ['Solutions', 'AI Ops Dashboard'],
      '/azure-dashboard.html': ['Solutions', 'Azure AI Foundry'],
      '/civic-intelligence-grid.html': ['Solutions', 'Civic Intelligence Grid'],
      '/analytics.html': ['Solutions', 'Analytics Hub'],
      '/api-reference.html': ['Developers', 'API Reference'],
      '/developers.html': ['Developers', 'SDKs'],
      '/docs.html': ['Developers', 'Documentation'],
      '/console.html': ['Developers', 'Console'],
      '/tokens.html': ['Developers', 'API Keys'],
      '/models.html': ['Developers', 'Model Explorer'],
      '/about.html': ['Company', 'About Us'],
      '/blog.html': ['Company', 'Blog'],
      '/careers.html': ['Company', 'Careers'],
      '/help.html': ['Company', 'Help Center'],
      '/contact.html': ['Company', 'Contact'],
      '/status.html': ['Company', 'System Status']
    };

    const breadcrumbs = pathMap[path];

    if (breadcrumbs) {
      this.setBreadcrumbs(breadcrumbs);
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Set breadcrumbs
   */
  setBreadcrumbs(items) {
    this.breadcrumbs = items;
    this.render();
  }

  /**
   * Render breadcrumbs
   */
  render() {
    if (this.breadcrumbs.length === 0) {
      this.hide();
      return;
    }

    const homeLabel = window.i18n ? window.i18n.t('subbar.home') : 'Home';

    // Build breadcrumb HTML
    const items = [
      `<a href="/" style="color: #B9C0CC; text-decoration: none; transition: 0.2s; display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 16px;">🏠</span>
        <span>${homeLabel}</span>
      </a>`
    ];

    this.breadcrumbs.forEach((crumb, index) => {
      const isLast = index === this.breadcrumbs.length - 1;

      items.push(`
        <span style="color: rgba(255,255,255,0.3); margin: 0 8px;">/</span>
        <span style="color: ${isLast ? '#F7F8FA' : '#B9C0CC'}; font-weight: ${isLast ? '600' : '400'};">
          ${crumb}
        </span>
      `);
    });

    this.container.innerHTML = `
      <nav aria-label="Breadcrumb" style="display: flex; align-items: center; font-size: 14px;">
        ${items.join('')}
      </nav>
    `;
  }

  /**
   * Show SubBar
   */
  show() {
    this.container.style.display = 'flex';
  }

  /**
   * Hide SubBar
   */
  hide() {
    this.container.style.display = 'none';
  }

  /**
   * Hide SubBar when header hides
   */
  hideWithHeader() {
    this.container.style.transform = 'translateY(-100%)';
  }

  /**
   * Show SubBar when header shows
   */
  showWithHeader() {
    this.container.style.transform = 'translateY(0)';
  }
}

// Initialize SubBar
const subbar = new SubBar();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = subbar;
}
