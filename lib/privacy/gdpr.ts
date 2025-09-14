/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔐 AILYDIAN GDPR & PRIVACY COMPLIANCE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies
 * All Rights Reserved.
 * 
 * This module handles GDPR, KVKK, and other data protection compliance
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface GDPRConsent {
  id: string;
  userId?: string;
  sessionId: string;
  consents: {
    necessary: boolean;        // Always true - required for functionality
    analytics: boolean;        // Google Analytics, usage tracking
    marketing: boolean;        // Marketing emails, personalized ads
    performance: boolean;      // Performance monitoring, crash reports
    preferences: boolean;      // UI preferences, language settings
  };
  consentDate: Date;
  ipAddress: string;
  userAgent: string;
  version: string;           // Privacy policy version
  expires: Date;
}

export interface DataProcessingPurpose {
  purpose: 'authentication' | 'trading' | 'analytics' | 'security' | 'compliance';
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
  dataTypes: string[];
  retentionPeriod: string;
  description: string;
}

export const DATA_PROCESSING_PURPOSES: DataProcessingPurpose[] = [
  {
    purpose: 'authentication',
    legalBasis: 'contract',
    dataTypes: ['email', 'password_hash', 'profile_data'],
    retentionPeriod: 'Account lifetime + 2 years',
    description: 'User authentication and account management'
  },
  {
    purpose: 'trading',
    legalBasis: 'contract',
    dataTypes: ['trading_data', 'portfolio_data', 'transaction_history'],
    retentionPeriod: '7 years (regulatory requirement)',
    description: 'Trading operations and portfolio management'
  },
  {
    purpose: 'security',
    legalBasis: 'legitimate_interest',
    dataTypes: ['ip_address', 'device_fingerprint', 'access_logs'],
    retentionPeriod: '12 months',
    description: 'Security monitoring and fraud prevention'
  },
  {
    purpose: 'analytics',
    legalBasis: 'consent',
    dataTypes: ['usage_statistics', 'performance_metrics'],
    retentionPeriod: '26 months',
    description: 'Service improvement and analytics'
  },
  {
    purpose: 'compliance',
    legalBasis: 'legal_obligation',
    dataTypes: ['kyc_data', 'transaction_records', 'audit_logs'],
    retentionPeriod: '10 years',
    description: 'Regulatory compliance and reporting'
  }
];

export class GDPRCompliance {
  /**
   * Record user consent for GDPR compliance
   */
  static async recordConsent(consent: Omit<GDPRConsent, 'id' | 'consentDate' | 'expires' | 'version'>): Promise<GDPRConsent> {
    const consentRecord: GDPRConsent = {
      ...consent,
      id: crypto.randomUUID(),
      consentDate: new Date(),
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      version: '1.0.0'
    };

    // In production, save to database
    if (typeof window !== 'undefined') {
      localStorage.setItem('gdpr_consent', JSON.stringify(consentRecord));
    }

    console.log('📋 GDPR Consent recorded:', consentRecord);
    return consentRecord;
  }

  /**
   * Check if user has valid consent
   */
  static getConsentStatus(): GDPRConsent | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('gdpr_consent');
    if (!stored) return null;

    const consent = JSON.parse(stored) as GDPRConsent;
    
    // Check if consent has expired
    if (new Date() > new Date(consent.expires)) {
      this.clearConsent();
      return null;
    }

    return consent;
  }

  /**
   * Clear stored consent (user withdrawal)
   */
  static clearConsent(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gdpr_consent');
      
      // Clear analytics cookies if consent withdrawn
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  }

  /**
   * Data portability - export user data
   */
  static async exportUserData(userId: string): Promise<any> {
    // In production, gather all user data from various sources
    const userData = {
      personal: {
        // Personal information
      },
      trading: {
        // Trading history, portfolio data
      },
      preferences: {
        // UI preferences, settings
      },
      consent: this.getConsentStatus(),
      exportDate: new Date().toISOString(),
      copyright: '© 2025 Emrah Şardağ - AILYDIAN Trading Technologies'
    };

    return userData;
  }

  /**
   * Right to erasure - delete user data
   */
  static async deleteUserData(userId: string, reason: string): Promise<boolean> {
    console.log(`🗑️ GDPR Data deletion request for user ${userId}: ${reason}`);
    
    // In production, implement comprehensive data deletion
    // including:
    // - Database records
    // - File storage
    // - Backup systems
    // - Third-party services
    // - Analytics data
    
    this.clearConsent();
    return true;
  }

  /**
   * Generate privacy report
   */
  static generatePrivacyReport(): any {
    return {
      dataController: {
        name: 'Emrah Şardağ',
        company: 'AILYDIAN Trading Technologies',
        email: 'emrahsardag@yandex.com',
        address: 'Turkey'
      },
      dataProtectionOfficer: {
        email: 'dpo@ailydian.com',
        phone: '+90 XXX XXX XX XX'
      },
      dataProcessing: DATA_PROCESSING_PURPOSES,
      rights: [
        'Right to be informed',
        'Right of access',
        'Right to rectification', 
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
        'Rights in relation to automated decision making and profiling'
      ],
      technicalMeasures: [
        'AES-256 encryption at rest',
        'TLS 1.3 encryption in transit',
        'Multi-factor authentication',
        'Access logging and monitoring',
        'Regular security audits',
        'Data pseudonymization',
        'Automated backup systems'
      ],
      organizationalMeasures: [
        'Staff training on data protection',
        'Privacy by design implementation',
        'Regular privacy impact assessments',
        'Data breach response procedures',
        'Third-party data processing agreements',
        'Regular compliance audits'
      ],
      lastUpdated: new Date().toISOString()
    };
  }
}

export default GDPRCompliance;
