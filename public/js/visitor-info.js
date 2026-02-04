/* global window, document, fetch */
/**
 * AILYDIAN Visitor Info Client
 * Location Display, VPN Detection, City Search
 *
 * @version 1.0.0
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/visitor/info',
    containerSelector: '#visitor-city',
    retryAttempts: 2,
    retryDelay: 1000,
  };

  let visitorData = null;

  /**
   * Fetch visitor info from API
   */
  async function fetchVisitorInfo(attempt = 1) {
    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch visitor info');
      }

      return result.data;
    } catch (error) {
      console.warn(`[VisitorInfo] Attempt ${attempt} failed:`, error.message);

      if (attempt < CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        return fetchVisitorInfo(attempt + 1);
      }

      return null;
    }
  }

  /**
   * Create city badge element
   */
  function createCityBadge(data) {
    const badge = document.createElement('button');
    badge.className = 'visitor-city-badge';
    badge.setAttribute(
      'aria-label',
      `Konum: ${data.city}, ${data.countryName}. Tiklayin bilgi icin.`
    );
    badge.setAttribute('title', `${data.city}, ${data.countryName} - Tiklayarak Google'da arayin`);

    badge.innerHTML = `
      <svg class="visitor-city-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span class="visitor-city-text">${data.city}</span>
    `;

    // Click handler - search city on Google
    badge.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      searchCity(data);
    });

    return badge;
  }

  /**
   * Open Google search for city
   */
  function searchCity(data) {
    const query = `${data.city}, ${data.countryName}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Show VPN block modal
   */
  function showVPNBlockModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vpn-block-overlay';
    overlay.innerHTML = `
      <div class="vpn-block-modal">
        <div class="vpn-block-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h2 class="vpn-block-title">VPN/Proxy Algilandi</h2>
        <p class="vpn-block-message">
          Guvenlik nedeniyle VPN veya proxy uzerinden erisim engellenmistir.
        </p>
        <p class="vpn-block-instruction">
          Lutfen VPN'inizi kapatip sayfayi yenileyin.
        </p>
        <button class="vpn-block-refresh" onclick="window.location.reload()">
          Sayfayi Yenile
        </button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .vpn-block-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 1rem;
      }
      .vpn-block-modal {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 16px;
        padding: 2.5rem;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .vpn-block-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        color: #ef4444;
      }
      .vpn-block-icon svg {
        width: 100%;
        height: 100%;
      }
      .vpn-block-title {
        color: #ef4444;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1rem;
      }
      .vpn-block-message {
        color: #ffffff;
        font-size: 1rem;
        line-height: 1.6;
        margin: 0 0 0.75rem;
      }
      .vpn-block-instruction {
        color: #a0a0a0;
        font-size: 0.9rem;
        margin: 0 0 1.5rem;
      }
      .vpn-block-refresh {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        padding: 12px 32px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .vpn-block-refresh:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
      }
      .vpn-block-refresh:active {
        transform: translateY(0);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Add city badge styles
   */
  function addBadgeStyles() {
    if (document.getElementById('visitor-city-styles')) return;

    const style = document.createElement('style');
    style.id = 'visitor-city-styles';
    style.textContent = `
      .visitor-city-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 44px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .visitor-city-badge:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(16, 163, 127, 0.5);
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .visitor-city-badge:active {
        transform: translateY(0) scale(0.98);
      }
      .visitor-city-icon {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        flex-shrink: 0;
      }
      .visitor-city-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .visitor-city-badge {
          padding: 6px 12px;
          font-size: 12px;
          min-height: 40px;
        }
        .visitor-city-icon {
          width: 14px;
          height: 14px;
        }
        .visitor-city-text {
          max-width: 80px;
        }
      }

      @media (max-width: 480px) {
        .visitor-city-badge {
          padding: 5px 10px;
          font-size: 11px;
          gap: 4px;
        }
        .visitor-city-text {
          max-width: 60px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Render city badge in container
   */
  function renderCityBadge(data) {
    const container = document.querySelector(CONFIG.containerSelector);
    if (!container) {
      console.warn('[VisitorInfo] Container not found:', CONFIG.containerSelector);
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add styles
    addBadgeStyles();

    // Create and append badge
    const badge = createCityBadge(data);
    container.appendChild(badge);
  }

  /**
   * Initialize visitor info
   */
  async function init() {
    try {
      // Fetch visitor data
      visitorData = await fetchVisitorInfo();

      if (!visitorData) {
        console.warn('[VisitorInfo] Could not fetch visitor data');
        return;
      }

      // Check if blocked
      if (visitorData.isBlocked) {
        console.warn('[VisitorInfo] VPN detected, access blocked');
        showVPNBlockModal();
        return;
      }

      // Render city badge
      if (visitorData.city && visitorData.city !== 'Unknown') {
        renderCityBadge(visitorData);
      }

      // Log success
      console.log('[VisitorInfo] Initialized:', visitorData.city, visitorData.country);
    } catch (error) {
      console.error('[VisitorInfo] Init error:', error);
    }
  }

  /**
   * Get visitor data (for external use)
   */
  function getData() {
    return visitorData;
  }

  // Export to global
  window.VisitorInfo = {
    init,
    getData,
    searchCity: function () {
      if (visitorData) searchCity(visitorData);
    },
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    setTimeout(init, 100);
  }
})();
