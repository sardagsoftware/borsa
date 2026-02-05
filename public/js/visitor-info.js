/* global window, document, fetch, navigator */
/**
 * AILYDIAN Visitor Info Client
 * Precise Location Display with Browser Geolocation
 * VPN Detection, Device Detection, Security
 *
 * @version 3.0.0 - Enhanced with browser geolocation for neighborhood-level accuracy
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/visitor/info',
    containerSelector: '#visitor-city',
    retryAttempts: 2,
    retryDelay: 1000,
    geolocationTimeout: 10000, // 10 seconds
    reverseGeocodingAPI: 'https://nominatim.openstreetmap.org/reverse',
  };

  let visitorData = null;
  let preciseLocation = null;

  /**
   * Fetch visitor info from API (IP-based fallback)
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
   * Request browser geolocation permission and get precise location
   * With permission policy check to avoid console errors
   */
  async function requestPreciseLocation() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('[VisitorInfo] Geolocation not supported');
      return null;
    }

    // Check if geolocation permission is allowed by permissions policy
    // This prevents the "Permissions policy violation" console error
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permissionStatus.state === 'denied') {
          console.log('[VisitorInfo] Geolocation permission denied');
          return null;
        }
      }
    } catch (_e) {
      // Permissions API not supported or permission query failed
      // This can happen when permissions policy blocks geolocation entirely
      console.log('[VisitorInfo] Geolocation permission check not available');
    }

    // Double check: test if we can even ask for geolocation
    // by checking if document allows the feature
    if (typeof document !== 'undefined' && document.featurePolicy) {
      try {
        if (!document.featurePolicy.allowsFeature('geolocation')) {
          console.log('[VisitorInfo] Geolocation blocked by feature policy');
          return null;
        }
      } catch (_e) {
        // Feature policy API not supported
      }
    }

    return new Promise(resolve => {
      try {
        navigator.geolocation.getCurrentPosition(
          async position => {
            try {
              const { latitude, longitude } = position.coords;
              console.log('[VisitorInfo] Got coordinates:', { latitude, longitude });

              // Reverse geocode to get neighborhood name
              const location = await reverseGeocode(latitude, longitude);
              resolve(location);
            } catch (error) {
              console.log('[VisitorInfo] Reverse geocoding failed:', error.message);
              resolve(null);
            }
          },
          error => {
            // Handle geolocation errors gracefully - no custom modal needed
            // The browser's native permission prompt handles everything
            const errorMessages = {
              1: 'Permission denied by user',
              2: 'Position unavailable',
              3: 'Request timeout',
            };
            console.log('[VisitorInfo] Geolocation:', errorMessages[error.code] || error.message);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: CONFIG.geolocationTimeout,
            maximumAge: 300000, // 5 minutes cache
          }
        );
      } catch (error) {
        // Catch any sync errors (like policy violations)
        console.log('[VisitorInfo] Geolocation request blocked:', error.message);
        resolve(null);
      }
    });
  }

  /**
   * Reverse geocode coordinates to get detailed location
   */
  async function reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `${CONFIG.reverseGeocodingAPI}?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=tr`,
        {
          headers: {
            'User-Agent': 'AILYDIAN-Web/3.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const address = data.address || {};

      // Get most specific location (priority: neighbourhood > suburb > district > city)
      const neighbourhood = address.neighbourhood || address.quarter || address.hamlet;
      const suburb = address.suburb || address.village;
      const district = address.county || address.district || address.town;
      const city = address.city || address.state;
      const country = address.country;

      // Determine the most specific name to display
      let displayName = neighbourhood || suburb || district || city || 'Unknown';

      // Clean up Turkish characters for display
      displayName = displayName.replace(/Mahallesi$/i, '').trim();
      displayName = displayName.replace(/\s+Mah\.?$/i, '').trim();

      console.log('[VisitorInfo] Reverse geocoded:', {
        displayName,
        neighbourhood,
        suburb,
        district,
        city,
        country,
      });

      return {
        displayName,
        neighbourhood,
        suburb,
        district,
        city,
        country,
        coordinates: { lat, lon },
      };
    } catch (error) {
      console.error('[VisitorInfo] Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get device icon based on device type
   */
  function getDeviceIcon(deviceType) {
    const icons = {
      mobile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>`,
      tablet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>`,
      desktop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>`,
      'smart-tv': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
        <polyline points="17 2 12 7 7 2"/>
      </svg>`,
      'game-console': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="6" y1="12" x2="10" y2="12"/>
        <line x1="8" y1="10" x2="8" y2="14"/>
        <circle cx="15" cy="11" r="1"/>
        <circle cx="18" cy="13" r="1"/>
        <rect x="2" y="6" width="20" height="12" rx="2"/>
      </svg>`,
    };
    return icons[deviceType] || icons.desktop;
  }

  /**
   * Create city badge element
   */
  function createCityBadge(data, precise) {
    const badge = document.createElement('button');
    badge.className = 'visitor-city-badge';

    const deviceType = data.device?.type || 'desktop';
    const deviceLabel =
      {
        mobile: 'Mobil',
        tablet: 'Tablet',
        desktop: 'Masaustu',
        'smart-tv': 'Smart TV',
        'game-console': 'Oyun Konsolu',
      }[deviceType] || 'Cihaz';

    // Use precise location if available, otherwise fall back to IP-based
    let displayLocation;
    let fullLocation;

    if (precise && precise.displayName && precise.displayName !== 'Unknown') {
      // Show only the most specific location (neighborhood/district)
      displayLocation = precise.displayName;
      fullLocation = [
        precise.neighbourhood,
        precise.suburb,
        precise.district,
        precise.city,
        precise.country,
      ]
        .filter(Boolean)
        .join(', ');
    } else {
      // Fallback to IP-based city
      displayLocation = data.city || 'Unknown';
      fullLocation =
        data.countryName && data.countryName !== 'Unknown'
          ? `${data.city}, ${data.countryName}`
          : data.city;
    }

    badge.setAttribute(
      'aria-label',
      `Konum: ${fullLocation}. Cihaz: ${deviceLabel}. Tiklayin bilgi icin.`
    );
    badge.setAttribute(
      'title',
      `${fullLocation} | ${deviceLabel} (${data.device?.os || 'Unknown'}) - Tiklayarak Google'da arayin`
    );

    badge.innerHTML = `
      <span class="visitor-device-icon">${getDeviceIcon(deviceType)}</span>
      <svg class="visitor-city-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span class="visitor-city-text">${displayLocation}</span>
    `;

    // Click handler - search city on Google
    badge.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      searchLocation(fullLocation);
    });

    return badge;
  }

  /**
   * Open Google search for location
   */
  function searchLocation(query) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Show block modal based on reason
   */
  function showBlockModal(blockReason) {
    const messages = {
      vpn_detected: {
        title: 'VPN/Proxy Algilandi',
        message: 'Guvenlik nedeniyle VPN veya proxy uzerinden erisim engellenmistir.',
        instruction: "Lutfen VPN'inizi kapatip sayfayi yenileyin.",
      },
      bot_detected: {
        title: 'Bot Trafigi Algilandi',
        message: 'Otomatik bot trafigi tespit edildi.',
        instruction: 'Normal bir tarayici kullanarak tekrar deneyin.',
      },
      suspicious_activity: {
        title: 'Suphe Uyandirici Aktivite',
        message: 'Guvenlik sistemi suphe uyandirici bir aktivite tespit etti.',
        instruction: 'Sayfayi normal sekilde yenilemeyi deneyin.',
      },
    };

    const content = messages[blockReason] || messages.vpn_detected;

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
        <h2 class="vpn-block-title">${content.title}</h2>
        <p class="vpn-block-message">${content.message}</p>
        <p class="vpn-block-instruction">${content.instruction}</p>
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
      .visitor-device-icon {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
      }
      .visitor-device-icon svg {
        width: 100%;
        height: 100%;
        stroke: currentColor;
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
        max-width: 200px;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .visitor-city-badge {
          padding: 6px 10px;
          font-size: 11px;
          min-height: 36px;
          gap: 4px;
        }
        .visitor-city-icon {
          width: 12px;
          height: 12px;
        }
        .visitor-device-icon {
          width: 12px;
          height: 12px;
        }
        .visitor-city-text {
          max-width: 100px;
        }
      }

      @media (max-width: 480px) {
        .visitor-city-badge {
          padding: 4px 8px;
          font-size: 10px;
          gap: 3px;
          min-height: 32px;
        }
        .visitor-city-icon {
          width: 10px;
          height: 10px;
        }
        .visitor-device-icon {
          display: none; /* Hide device icon on small screens */
        }
        .visitor-city-text {
          max-width: 70px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Render city badge in container
   */
  function renderCityBadge(data, precise) {
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
    const badge = createCityBadge(data, precise);
    container.appendChild(badge);
  }

  /**
   * Initialize visitor info
   */
  async function init() {
    try {
      // Fetch IP-based visitor data first (fast)
      visitorData = await fetchVisitorInfo();

      if (!visitorData) {
        console.warn('[VisitorInfo] Could not fetch visitor data');
        return;
      }

      // Check if blocked
      if (visitorData.isBlocked) {
        console.warn('[VisitorInfo] Access blocked:', visitorData.blockReason);
        showBlockModal(visitorData.blockReason);
        return;
      }

      // Try to get precise location with browser geolocation
      preciseLocation = await requestPreciseLocation();

      // Render city badge with best available location
      const locationToShow = preciseLocation?.displayName || visitorData.city;
      if (locationToShow && locationToShow !== 'Unknown') {
        renderCityBadge(visitorData, preciseLocation);
      }

      // Log success with device info
      console.log('[VisitorInfo] Initialized:', {
        city: visitorData.city,
        preciseLocation: preciseLocation?.displayName,
        country: visitorData.country,
        device: visitorData.device,
        securityScore: visitorData.securityScore,
      });
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

  /**
   * Get precise location data
   */
  function getPreciseLocation() {
    return preciseLocation;
  }

  // Export to global
  window.VisitorInfo = {
    init,
    getData,
    getPreciseLocation,
    searchCity: function () {
      const location = preciseLocation
        ? [preciseLocation.displayName, preciseLocation.city, preciseLocation.country]
            .filter(Boolean)
            .join(', ')
        : `${visitorData?.city}, ${visitorData?.countryName}`;
      if (location) searchLocation(location);
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
