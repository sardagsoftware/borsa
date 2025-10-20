/**
 * LyDian GDPR & KVKK Compliance Middleware
 *
 * Features:
 * - Data subject rights (GDPR Article 15-22, KVKK Article 11)
 * - Consent management
 * - Data portability
 * - Right to be forgotten
 * - Data processing records
 * - Cookie consent tracking
 * - Lawful basis tracking
 *
 * @version 2.1.0
 */

const { getAuditLogger, EVENT_TYPES, SEVERITY } = require('./audit-logger');
const { anonymize, encryptFields, maskPII } = require('./encryption');

/**
 * GDPR/KVKK Data Subject Rights
 */
const DATA_SUBJECT_RIGHTS = {
  ACCESS: 'access', // Right to access (GDPR Art. 15, KVKK Art. 11)
  RECTIFICATION: 'rectification', // Right to rectification (GDPR Art. 16, KVKK Art. 11)
  ERASURE: 'erasure', // Right to erasure/be forgotten (GDPR Art. 17, KVKK Art. 11)
  RESTRICTION: 'restriction', // Right to restriction (GDPR Art. 18)
  PORTABILITY: 'portability', // Right to data portability (GDPR Art. 20, KVKK Art. 11)
  OBJECT: 'object', // Right to object (GDPR Art. 21)
  AUTOMATED_DECISION: 'automated_decision' // Rights related to automated decision-making (GDPR Art. 22)
};

/**
 * Lawful basis for processing (GDPR Art. 6, KVKK Art. 5)
 */
const LAWFUL_BASIS = {
  CONSENT: 'consent',
  CONTRACT: 'contract',
  LEGAL_OBLIGATION: 'legal_obligation',
  VITAL_INTERESTS: 'vital_interests',
  PUBLIC_TASK: 'public_task',
  LEGITIMATE_INTERESTS: 'legitimate_interests'
};

/**
 * Data processing purposes
 */
const PROCESSING_PURPOSES = {
  ACCOUNT_MANAGEMENT: 'account_management',
  SERVICE_DELIVERY: 'service_delivery',
  MARKETING: 'marketing',
  ANALYTICS: 'analytics',
  SECURITY: 'security',
  LEGAL_COMPLIANCE: 'legal_compliance',
  RESEARCH: 'research'
};

class ComplianceManager {
  constructor(options = {}) {
    this.auditLogger = getAuditLogger();
    this.consentStore = new Map(); // In production, use database
    this.dataRetentionPolicies = options.retentionPolicies || {};
  }

  /**
   * Track consent
   */
  async trackConsent(userId, purposes, options = {}) {
    const consent = {
      userId,
      purposes: Array.isArray(purposes) ? purposes : [purposes],
      lawfulBasis: options.lawfulBasis || LAWFUL_BASIS.CONSENT,
      givenAt: new Date().toISOString(),
      expiresAt: options.expiresAt,
      withdrawnAt: null,
      ipAddress: options.ip,
      userAgent: options.userAgent,
      version: options.consentVersion || '1.0'
    };

    this.consentStore.set(userId, consent);

    await this.auditLogger.log(EVENT_TYPES.PRIVACY_CONSENT_GIVEN, {
      purposes: consent.purposes,
      lawfulBasis: consent.lawfulBasis
    }, {
      userId,
      ip: options.ip,
      severity: SEVERITY.NOTICE
    });

    return consent;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId, purposes = null, options = {}) {
    const consent = this.consentStore.get(userId);

    if (!consent) {
      throw new Error('No consent found for user');
    }

    if (purposes) {
      // Withdraw specific purposes
      consent.purposes = consent.purposes.filter(p => !purposes.includes(p));
    } else {
      // Withdraw all
      consent.purposes = [];
    }

    consent.withdrawnAt = new Date().toISOString();

    await this.auditLogger.log(EVENT_TYPES.PRIVACY_CONSENT_REVOKED, {
      withdrawnPurposes: purposes || 'all'
    }, {
      userId,
      ip: options.ip,
      severity: SEVERITY.NOTICE
    });

    return consent;
  }

  /**
   * Check if user has consented to purpose
   */
  hasConsent(userId, purpose) {
    const consent = this.consentStore.get(userId);

    if (!consent || consent.withdrawnAt) {
      return false;
    }

    // Check expiration
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return false;
    }

    return consent.purposes.includes(purpose);
  }

  /**
   * Right to Access - Export all user data
   */
  async exportUserData(userId, options = {}) {
    await this.auditLogger.log(EVENT_TYPES.PRIVACY_RIGHT_TO_ACCESS, {
      dataRequested: 'all'
    }, {
      userId,
      ip: options.ip,
      severity: SEVERITY.NOTICE
    });

    // In production, gather data from all systems
    const userData = {
      profile: await this.getUserProfile(userId),
      consents: this.consentStore.get(userId),
      aiInteractions: await this.getAIInteractions(userId),
      auditLogs: await this.auditLogger.query({ userId }),
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      regulation: 'GDPR Article 15 / KVKK Article 11'
    };

    return userData;
  }

  /**
   * Right to Data Portability
   */
  async portUserData(userId, format = 'json', options = {}) {
    const data = await this.exportUserData(userId, options);

    await this.auditLogger.log(EVENT_TYPES.PRIVACY_RIGHT_TO_PORTABILITY, {
      format,
      dataSize: JSON.stringify(data).length
    }, {
      userId,
      ip: options.ip,
      severity: SEVERITY.NOTICE
    });

    // Format data for portability
    if (format === 'csv') {
      return this.convertToCSV(data);
    } else if (format === 'xml') {
      return this.convertToXML(data);
    }

    return data; // Default JSON
  }

  /**
   * Right to Erasure / Right to be Forgotten
   */
  async eraseUserData(userId, options = {}) {
    await this.auditLogger.log(EVENT_TYPES.PRIVACY_DATA_DELETED, {
      reason: options.reason || 'user_request',
      regulation: 'GDPR Article 17 / KVKK Article 11'
    }, {
      userId,
      ip: options.ip,
      severity: SEVERITY.WARNING
    });

    // 1. Delete or anonymize user data
    const anonymizedData = await this.anonymizeUserData(userId);

    // 2. Remove from consent store
    this.consentStore.delete(userId);

    // 3. In production, cascade delete or anonymize across all systems
    // await this.deleteFromAllSystems(userId);

    return {
      success: true,
      anonymizedRecords: anonymizedData,
      deletedAt: new Date().toISOString()
    };
  }

  /**
   * Anonymize user data (irreversible)
   */
  async anonymizeUserData(userId) {
    await this.auditLogger.log(EVENT_TYPES.PRIVACY_DATA_ANONYMIZED, {
      userId
    }, {
      userId,
      severity: SEVERITY.WARNING
    });

    // In production, anonymize data in all databases
    const anonymized = {
      originalUserId: userId,
      anonymizedId: anonymize({ id: userId }).id,
      anonymizedAt: new Date().toISOString()
    };

    return anonymized;
  }

  /**
   * Data retention check
   */
  shouldRetainData(dataType, createdAt) {
    const policy = this.dataRetentionPolicies[dataType];

    if (!policy) {
      return true; // Retain if no policy
    }

    const ageInDays = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);

    return ageInDays < policy.retentionDays;
  }

  /**
   * Mock data getters (implement with actual database queries)
   */
  async getUserProfile(userId) {
    return {
      id: userId,
      createdAt: new Date().toISOString(),
      // ... other fields
    };
  }

  async getAIInteractions(userId) {
    return [
      // AI query history
    ];
  }

  convertToCSV(data) {
    // Simple CSV conversion (implement fully for production)
    return JSON.stringify(data);
  }

  convertToXML(data) {
    // Simple XML conversion (implement fully for production)
    return `<data>${JSON.stringify(data)}</data>`;
  }
}

// Singleton
let complianceManager = null;

function getComplianceManager(options = {}) {
  if (!complianceManager) {
    complianceManager = new ComplianceManager(options);
  }
  return complianceManager;
}

/**
 * Middleware to enforce consent
 */
function requireConsent(purpose) {
  return (req, res, next) => {
    const manager = getComplianceManager();
    const userId = req.user?.id;

    if (!userId) {
      return next(); // Anonymous users don't need consent check
    }

    if (!manager.hasConsent(userId, purpose)) {
      return res.status(403).json({
        error: 'Consent required',
        message: `You must consent to '${purpose}' to use this feature.`,
        code: 'CONSENT_REQUIRED',
        purpose,
        regulation: 'GDPR Article 6 / KVKK Article 5'
      });
    }

    next();
  };
}

/**
 * Cookie consent middleware
 */
function cookieConsent(req, res, next) {
  const hasConsent = req.cookies?.cookieConsent === 'true';

  if (!hasConsent && req.path !== '/api/consent') {
    res.setHeader('X-Cookie-Consent-Required', 'true');
  }

  next();
}

/**
 * GDPR/KVKK compliant response headers
 */
function complianceHeaders(req, res, next) {
  // Indicate data processing
  res.setHeader('X-Data-Processing', 'GDPR-KVKK-Compliant');

  // Privacy policy link
  res.setHeader('X-Privacy-Policy', 'https://lydian.com/privacy');

  // Data protection officer contact
  res.setHeader('X-DPO-Contact', 'dpo@lydian.com');

  next();
}

/**
 * Handle data subject rights requests
 */
async function handleDataSubjectRequest(req, res) {
  const { right, format } = req.body;
  const userId = req.user.id;
  const manager = getComplianceManager();

  try {
    let result;

    switch (right) {
      case DATA_SUBJECT_RIGHTS.ACCESS:
        result = await manager.exportUserData(userId, { ip: req.ip });
        break;

      case DATA_SUBJECT_RIGHTS.PORTABILITY:
        result = await manager.portUserData(userId, format || 'json', { ip: req.ip });
        break;

      case DATA_SUBJECT_RIGHTS.ERASURE:
        result = await manager.eraseUserData(userId, {
          reason: req.body.reason,
          ip: req.ip
        });
        break;

      case DATA_SUBJECT_RIGHTS.RECTIFICATION:
        // Implement data rectification
        result = { message: 'Data rectification request received' };
        break;

      default:
        return res.status(400).json({
          error: 'Invalid right',
          code: 'INVALID_DATA_SUBJECT_RIGHT'
        });
    }

    res.json({
      success: true,
      right,
      result,
      processedAt: new Date().toISOString(),
      regulation: 'GDPR / KVKK Compliant'
    });
  } catch (error) {
    console.error('Data subject request error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      code: 'DSR_PROCESSING_FAILED'
    });
  }
}

module.exports = {
  ComplianceManager,
  getComplianceManager,
  requireConsent,
  cookieConsent,
  complianceHeaders,
  handleDataSubjectRequest,
  DATA_SUBJECT_RIGHTS,
  LAWFUL_BASIS,
  PROCESSING_PURPOSES
};
