/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LEGAL GATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * White-hat enforcement layer for all connectors
 *
 * Status levels:
 * - disabled: Connector completely disabled (sanctions, legal issues)
 * - sandbox_only: Development/testing only, blocked in production
 * - partner_required: Requires official partnership, blocked until approved
 * - partner_ok: Fully approved, production-ready
 *
 * Rules:
 * - NO scraping/dumping
 * - Only official APIs, partner agreements, or affiliate programs
 * - Residency compliance (RU/BLR = sandbox_only due to sanctions)
 * - KVKK/GDPR/PDPL data minimization
 *
 * @module lib/auth/legal-gate
 */

const fs = require('fs');
const path = require('path');

// Load connector legal status from config
const LEGAL_STATUS_PATH = path.join(
  __dirname,
  '../../config/legal-gate-status.json'
);

let legalStatusCache = null;
let lastLoadTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load legal status with caching
 */
function loadLegalStatus() {
  const now = Date.now();

  // Return cached if fresh
  if (legalStatusCache && (now - lastLoadTime) < CACHE_TTL) {
    return legalStatusCache;
  }

  try {
    const data = fs.readFileSync(LEGAL_STATUS_PATH, 'utf-8');
    legalStatusCache = JSON.parse(data);
    lastLoadTime = now;
    return legalStatusCache;
  } catch (error) {
    console.error('[Legal Gate] Failed to load status:', error);
    // Return default safe state (block everything)
    return { connectors: {}, defaultStatus: 'disabled' };
  }
}

/**
 * Check if connector is allowed to execute
 * @param {string} connector Connector name (e.g., 'trendyol', 'aras')
 * @returns {Promise<Object>} { allowed, status, reasonTR, reasonEN, partnerRequired, applyUrl }
 */
async function checkLegalGate(connector) {
  const config = loadLegalStatus();
  const connectorConfig = config.connectors[connector];

  // If connector not found, use default (deny)
  if (!connectorConfig) {
    return {
      allowed: false,
      status: config.defaultStatus || 'disabled',
      reasonTR: 'Bağlayıcı yapılandırılmamış veya desteklenmiyor',
      reasonEN: 'Connector not configured or unsupported',
      partnerRequired: false,
      applyUrl: null,
    };
  }

  const { status, reasonTR, reasonEN, partnerRequired, applyUrl, region } = connectorConfig;

  // Check environment (sandbox vs production)
  const isProduction = process.env.NODE_ENV === 'production';

  // ═══════════════════════════════════════════════════════════════
  // Status-based decisions
  // ═══════════════════════════════════════════════════════════════

  if (status === 'disabled') {
    return {
      allowed: false,
      status: 'disabled',
      reasonTR: reasonTR || 'Bağlayıcı devre dışı bırakıldı',
      reasonEN: reasonEN || 'Connector is disabled',
      partnerRequired: false,
      applyUrl: null,
    };
  }

  if (status === 'sandbox_only') {
    // Allow in dev/test, block in production
    if (isProduction) {
      return {
        allowed: false,
        status: 'sandbox_only',
        reasonTR: reasonTR || 'Bu bağlayıcı sadece geliştirme ortamında kullanılabilir',
        reasonEN: reasonEN || 'This connector is only available in development environment',
        partnerRequired: false,
        applyUrl: null,
      };
    }
    // Allowed in sandbox
    return {
      allowed: true,
      status: 'sandbox_only',
      reasonTR: null,
      reasonEN: null,
      partnerRequired: false,
      applyUrl: null,
    };
  }

  if (status === 'partner_required') {
    // Block until partnership approved
    return {
      allowed: false,
      status: 'partner_required',
      reasonTR: reasonTR || 'Bu bağlayıcı için resmi ortaklık gereklidir',
      reasonEN: reasonEN || 'Official partnership required for this connector',
      partnerRequired: true,
      applyUrl: applyUrl || 'https://ailydian.com/partnerships',
    };
  }

  if (status === 'partner_ok') {
    // Fully allowed
    return {
      allowed: true,
      status: 'partner_ok',
      reasonTR: null,
      reasonEN: null,
      partnerRequired: false,
      applyUrl: null,
    };
  }

  // Unknown status - deny by default
  return {
    allowed: false,
    status: 'unknown',
    reasonTR: 'Bilinmeyen bağlayıcı durumu',
    reasonEN: 'Unknown connector status',
    partnerRequired: false,
    applyUrl: null,
  };
}

/**
 * Get all connector statuses (for admin dashboard)
 */
async function getAllConnectorStatuses() {
  const config = loadLegalStatus();
  return config.connectors;
}

/**
 * Update connector status (admin only)
 * @param {string} connector Connector name
 * @param {string} newStatus New status (disabled|sandbox_only|partner_required|partner_ok)
 * @param {Object} metadata Additional metadata (reasonTR, reasonEN, applyUrl, etc.)
 */
async function updateConnectorStatus(connector, newStatus, metadata = {}) {
  const config = loadLegalStatus();

  config.connectors[connector] = {
    ...config.connectors[connector],
    status: newStatus,
    ...metadata,
    updatedAt: new Date().toISOString(),
  };

  // Write back to file
  fs.writeFileSync(LEGAL_STATUS_PATH, JSON.stringify(config, null, 2), 'utf-8');

  // Invalidate cache
  legalStatusCache = null;
  lastLoadTime = 0;

  return { success: true, connector, newStatus };
}

module.exports = {
  checkLegalGate,
  getAllConnectorStatuses,
  updateConnectorStatus,
};
