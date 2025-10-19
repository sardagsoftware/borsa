// 🔍 CLIENT-SIDE SEARCH SYSTEM
// Provides instant search with keyboard shortcuts (⌘K / Ctrl+K)

class SearchManager {
  constructor() {
    this.isOpen = false;
    this.searchInput = null;
    this.resultsContainer = null;
    this.overlay = null;
    this.debounceTimer = null;
    this.currentQuery = '';
    this.currentResults = [];
    this.selectedIndex = -1;

    this.init();
  }

  /**
   * Initialize search system
   */
  init() {
    // Build UI
    this.buildUI();

    // Bind keyboard shortcuts
    this.bindKeyboardShortcuts();

    // Bind search input
    this.bindSearchInput();
  }

  /**
   * Build search UI
   */
  buildUI() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'search-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 11, 13, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      animation: fadeIn 0.2s ease;
    `;

    // Create search container
    const container = document.createElement('div');
    container.className = 'search-container';
    container.style.cssText = `
      width: 90%;
      max-width: 640px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      overflow: hidden;
      animation: slideDown 0.3s ease;
    `;

    // Search input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    `;

    // Search icon
    const icon = document.createElement('span');
    icon.textContent = '🔍';
    icon.style.fontSize = '20px';

    // Search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = window.i18n ? window.i18n.t('search.placeholder') : 'Search... (⌘K)';
    this.searchInput.style.cssText = `
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #F7F8FA;
      font-size: 18px;
      font-family: inherit;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'ESC';
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 4px 8px;
      color: #B9C0CC;
      font-size: 12px;
      cursor: pointer;
      transition: 0.2s;
    `;
    closeBtn.onclick = () => this.close();

    inputWrapper.appendChild(icon);
    inputWrapper.appendChild(this.searchInput);
    inputWrapper.appendChild(closeBtn);

    // Results container
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'search-results';
    this.resultsContainer.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      padding: 8px;
    `;

    container.appendChild(inputWrapper);
    container.appendChild(this.resultsContainer);
    this.overlay.appendChild(container);
    document.body.appendChild(this.overlay);

    // Click overlay to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  /**
   * Bind keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ⌘K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }

      // ESC to close
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }

      // Arrow navigation
      if (this.isOpen && this.currentResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectPrevious();
        } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
          e.preventDefault();
          this.navigateToSelected();
        }
      }
    });
  }

  /**
   * Bind search input
   */
  bindSearchInput() {
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Clear previous timer
      clearTimeout(this.debounceTimer);

      // Show loading state
      if (query.length >= 2) {
        this.showLoading();

        // Debounce search
        this.debounceTimer = setTimeout(() => {
          this.performSearch(query);
        }, 300);
      } else {
        this.clearResults();
      }
    });
  }

  /**
   * Perform search via API
   */
  async performSearch(query) {
    try {
      const lang = window.i18n ? window.i18n.getLang() : 'en';
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${lang}&limit=8`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentQuery = query;
        this.currentResults = result.results;
        this.renderResults(result.results);
      } else {
        this.showError(result.error);
      }

    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed');
    }
  }

  /**
   * Render search results
   */
  renderResults(results) {
    this.resultsContainer.innerHTML = '';
    this.selectedIndex = -1;

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.cssText = 'padding: 40px 20px; text-align: center; color: #B9C0CC;';
      noResults.textContent = window.i18n ? window.i18n.t('search.noResults') : 'No results found';
      this.resultsContainer.appendChild(noResults);
      return;
    }

    results.forEach((result, index) => {
      const item = this.createResultItem(result, index);
      this.resultsContainer.appendChild(item);
    });
  }

  /**
   * Create result item
   */
  createResultItem(result, index) {
    const item = document.createElement('a');
    item.href = result.href;
    item.className = 'search-result-item';
    item.dataset.index = index;
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      text-decoration: none;
      color: inherit;
      transition: 0.2s;
      cursor: pointer;
    `;

    // Icon
    if (result.icon) {
      const icon = document.createElement('span');
      icon.textContent = result.icon;
      icon.style.cssText = 'font-size: 24px; flex-shrink: 0;';
      item.appendChild(icon);
    }

    // Content
    const content = document.createElement('div');
    content.style.flex = '1';

    const title = document.createElement('div');
    title.textContent = result.title;
    title.style.cssText = 'color: #F7F8FA; font-weight: 600; margin-bottom: 2px;';

    const description = document.createElement('div');
    description.textContent = result.description;
    description.style.cssText = 'color: #B9C0CC; font-size: 14px;';

    content.appendChild(title);
    content.appendChild(description);
    item.appendChild(content);

    // Badge
    if (result.badge) {
      const badge = document.createElement('span');
      badge.textContent = result.badge;
      badge.style.cssText = `
        padding: 4px 8px;
        background: rgba(0, 224, 174, 0.15);
        color: #00E0AE;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      `;
      item.appendChild(badge);
    }

    // Hover effect
    item.addEventListener('mouseenter', () => {
      this.selectItem(index);
    });

    item.addEventListener('click', (e) => {
      this.close();
    });

    return item;
  }

  /**
   * Select item by index
   */
  selectItem(index) {
    // Remove previous selection
    const previousSelected = this.resultsContainer.querySelector('.search-result-item[data-selected="true"]');
    if (previousSelected) {
      previousSelected.removeAttribute('data-selected');
      previousSelected.style.background = 'transparent';
    }

    // Select new item
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    if (items[index]) {
      items[index].setAttribute('data-selected', 'true');
      items[index].style.background = 'rgba(255,255,255,0.08)';
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      this.selectedIndex = index;
    }
  }

  /**
   * Select next item
   */
  selectNext() {
    const nextIndex = Math.min(this.selectedIndex + 1, this.currentResults.length - 1);
    this.selectItem(nextIndex);
  }

  /**
   * Select previous item
   */
  selectPrevious() {
    const prevIndex = Math.max(this.selectedIndex - 1, 0);
    this.selectItem(prevIndex);
  }

  /**
   * Navigate to selected item
   */
  navigateToSelected() {
    if (this.selectedIndex >= 0 && this.currentResults[this.selectedIndex]) {
      window.location.href = this.currentResults[this.selectedIndex].href;
      this.close();
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.resultsContainer.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #B9C0CC;">
        ${window.i18n ? window.i18n.t('search.searching') : 'Searching...'}
      </div>
    `;
  }

  /**
   * Show error
   */
  showError(message) {
    this.resultsContainer.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #FF6B6B;">
        ${message}
      </div>
    `;
  }

  /**
   * Clear results
   */
  clearResults() {
    this.resultsContainer.innerHTML = '';
    this.currentResults = [];
    this.selectedIndex = -1;
  }

  /**
   * Open search
   */
  open() {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  /**
   * Close search
   */
  close() {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.searchInput.value = '';
    this.clearResults();
  }
}

// Initialize search manager
const searchManager = new SearchManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = searchManager;
}
