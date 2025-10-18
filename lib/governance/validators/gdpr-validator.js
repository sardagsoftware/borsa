/**
 * GDPR Compliance Validator (Real Implementation)
 *
 * BEYAZ ŞAPKALI (White-Hat) - Defensive Security Only
 *
 * Validates AI models against GDPR (General Data Protection Regulation)
 * requirements for ethical and compliant AI systems.
 *
 * GDPR Principles:
 * 1. Lawfulness, fairness, and transparency
 * 2. Purpose limitation
 * 3. Data minimization
 * 4. Accuracy
 * 5. Storage limitation
 * 6. Integrity and confidentiality
 * 7. Accountability
 *
 * @module lib/governance/validators/gdpr-validator
 */

/**
 * GDPR Compliance Criteria
 */
const GDPR_CRITERIA = {
  // Article 5: Principles relating to processing of personal data
  lawfulness: {
    weight: 0.15,
    checks: [
      'legal_basis_documented',
      'data_subject_consent',
      'legitimate_interest_assessment',
    ],
  },

  // Transparency and fairness
  transparency: {
    weight: 0.15,
    checks: [
      'privacy_policy_available',
      'data_processing_disclosure',
      'automated_decision_disclosure',
      'data_usage_explanation',
    ],
  },

  // Purpose limitation
  purposeLimitation: {
    weight: 0.10,
    checks: [
      'processing_purpose_defined',
      'purpose_documented',
      'no_incompatible_processing',
    ],
  },

  // Data minimization
  dataMinimization: {
    weight: 0.10,
    checks: [
      'only_necessary_data_collected',
      'data_retention_policy',
      'automatic_deletion_implemented',
    ],
  },

  // Accuracy
  accuracy: {
    weight: 0.10,
    checks: [
      'data_quality_controls',
      'error_correction_process',
      'regular_data_updates',
    ],
  },

  // Storage limitation
  storageLimitation: {
    weight: 0.10,
    checks: [
      'retention_period_defined',
      'automatic_deletion',
      'archival_process',
    ],
  },

  // Integrity and confidentiality (Security)
  security: {
    weight: 0.15,
    checks: [
      'encryption_at_rest',
      'encryption_in_transit',
      'access_controls',
      'audit_logging',
      'breach_detection',
    ],
  },

  // Data subject rights (Articles 15-22)
  dataSubjectRights: {
    weight: 0.15,
    checks: [
      'right_to_access',
      'right_to_rectification',
      'right_to_erasure',
      'right_to_portability',
      'right_to_object',
      'automated_decision_safeguards',
    ],
  },
};

/**
 * Validate AI model against GDPR requirements
 *
 * @param {Object} model - Model configuration and metadata
 * @param {Object} model.metadata - Model metadata
 * @param {Object} model.metadata.gdpr - GDPR-specific configuration
 * @returns {Object} Validation results
 */
function validateGDPR(model) {
  const results = {
    framework: 'GDPR',
    compliant: false,
    score: 0,
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    criteriaResults: {},
    timestamp: new Date().toISOString(),
  };

  const gdprConfig = model.metadata?.gdpr || {};
  const dataProcessing = model.metadata?.dataProcessing || {};
  const security = model.metadata?.security || {};

  let totalScore = 0;
  let totalWeight = 0;

  // Validate each GDPR criteria
  for (const [criteriaName, criteria] of Object.entries(GDPR_CRITERIA)) {
    const criteriaResult = validateCriteria(
      criteriaName,
      criteria,
      gdprConfig,
      dataProcessing,
      security
    );

    results.criteriaResults[criteriaName] = criteriaResult;
    totalScore += criteriaResult.score * criteria.weight;
    totalWeight += criteria.weight;

    // Collect issues
    results.criticalIssues.push(...criteriaResult.criticalIssues);
    results.warnings.push(...criteriaResult.warnings);
    results.recommendations.push(...criteriaResult.recommendations);
  }

  // Calculate overall score
  results.score = totalWeight > 0 ? totalScore / totalWeight : 0;
  results.compliant = results.score >= 0.85 && results.criticalIssues.length === 0;

  return results;
}

/**
 * Validate a specific GDPR criteria
 */
function validateCriteria(criteriaName, criteria, gdprConfig, dataProcessing, security) {
  const result = {
    score: 0,
    passed: 0,
    failed: 0,
    checks: {},
    criticalIssues: [],
    warnings: [],
    recommendations: [],
  };

  // Validate based on criteria type
  switch (criteriaName) {
    case 'lawfulness':
      validateLawfulness(result, gdprConfig, dataProcessing);
      break;
    case 'transparency':
      validateTransparency(result, gdprConfig, dataProcessing);
      break;
    case 'purposeLimitation':
      validatePurposeLimitation(result, dataProcessing);
      break;
    case 'dataMinimization':
      validateDataMinimization(result, dataProcessing);
      break;
    case 'accuracy':
      validateAccuracy(result, dataProcessing);
      break;
    case 'storageLimitation':
      validateStorageLimitation(result, dataProcessing);
      break;
    case 'security':
      validateSecurity(result, security);
      break;
    case 'dataSubjectRights':
      validateDataSubjectRights(result, gdprConfig);
      break;
  }

  // Calculate score for this criteria
  const totalChecks = result.passed + result.failed;
  result.score = totalChecks > 0 ? result.passed / totalChecks : 0;

  return result;
}

/**
 * Validate lawfulness (Article 6)
 */
function validateLawfulness(result, gdprConfig, dataProcessing) {
  // Legal basis documented
  if (gdprConfig.legalBasis) {
    result.checks.legal_basis_documented = true;
    result.passed++;
  } else {
    result.checks.legal_basis_documented = false;
    result.failed++;
    result.criticalIssues.push('Legal basis for data processing not documented (GDPR Article 6)');
  }

  // Consent mechanism
  if (gdprConfig.consentMechanism === 'explicit' || gdprConfig.consentMechanism === 'opt-in') {
    result.checks.data_subject_consent = true;
    result.passed++;
  } else {
    result.checks.data_subject_consent = false;
    result.failed++;
    result.warnings.push('Explicit consent mechanism not implemented');
  }

  // Legitimate interest assessment (if applicable)
  if (gdprConfig.legalBasis === 'legitimate_interest') {
    if (gdprConfig.legitimateInterestAssessment) {
      result.checks.legitimate_interest_assessment = true;
      result.passed++;
    } else {
      result.checks.legitimate_interest_assessment = false;
      result.failed++;
      result.criticalIssues.push('Legitimate Interest Assessment (LIA) required but not provided');
    }
  } else {
    result.checks.legitimate_interest_assessment = true;
    result.passed++;
  }
}

/**
 * Validate transparency (Article 12-14)
 */
function validateTransparency(result, gdprConfig, dataProcessing) {
  // Privacy policy
  if (gdprConfig.privacyPolicyUrl) {
    result.checks.privacy_policy_available = true;
    result.passed++;
  } else {
    result.checks.privacy_policy_available = false;
    result.failed++;
    result.criticalIssues.push('Privacy policy not available (GDPR Article 13)');
  }

  // Data processing disclosure
  if (dataProcessing.disclosed === true) {
    result.checks.data_processing_disclosure = true;
    result.passed++;
  } else {
    result.checks.data_processing_disclosure = false;
    result.failed++;
    result.criticalIssues.push('Data processing activities must be disclosed to data subjects');
  }

  // Automated decision disclosure
  if (gdprConfig.automatedDecisionMaking === true) {
    if (gdprConfig.automatedDecisionDisclosure === true) {
      result.checks.automated_decision_disclosure = true;
      result.passed++;
    } else {
      result.checks.automated_decision_disclosure = false;
      result.failed++;
      result.criticalIssues.push('Automated decision-making must be disclosed (GDPR Article 22)');
    }
  } else {
    result.checks.automated_decision_disclosure = true;
    result.passed++;
  }

  // Data usage explanation
  if (gdprConfig.explainableAI === true) {
    result.checks.data_usage_explanation = true;
    result.passed++;
  } else {
    result.checks.data_usage_explanation = false;
    result.failed++;
    result.warnings.push('AI model decisions should be explainable to data subjects');
  }
}

/**
 * Validate purpose limitation (Article 5.1.b)
 */
function validatePurposeLimitation(result, dataProcessing) {
  // Processing purpose defined
  if (dataProcessing.purposes && dataProcessing.purposes.length > 0) {
    result.checks.processing_purpose_defined = true;
    result.passed++;
  } else {
    result.checks.processing_purpose_defined = false;
    result.failed++;
    result.criticalIssues.push('Data processing purposes must be defined');
  }

  // Purpose documented
  if (dataProcessing.purposeDocumentation) {
    result.checks.purpose_documented = true;
    result.passed++;
  } else {
    result.checks.purpose_documented = false;
    result.failed++;
    result.warnings.push('Processing purposes should be documented');
  }

  // No incompatible processing
  if (dataProcessing.compatibilityAssessment === true) {
    result.checks.no_incompatible_processing = true;
    result.passed++;
  } else {
    result.checks.no_incompatible_processing = false;
    result.failed++;
    result.recommendations.push('Conduct compatibility assessment for secondary processing');
  }
}

/**
 * Validate data minimization (Article 5.1.c)
 */
function validateDataMinimization(result, dataProcessing) {
  // Only necessary data collected
  if (dataProcessing.dataMinimization === true) {
    result.checks.only_necessary_data_collected = true;
    result.passed++;
  } else {
    result.checks.only_necessary_data_collected = false;
    result.failed++;
    result.warnings.push('Only necessary data should be collected (data minimization principle)');
  }

  // Data retention policy
  if (dataProcessing.retentionPolicy) {
    result.checks.data_retention_policy = true;
    result.passed++;
  } else {
    result.checks.data_retention_policy = false;
    result.failed++;
    result.criticalIssues.push('Data retention policy required');
  }

  // Automatic deletion
  if (dataProcessing.automaticDeletion === true) {
    result.checks.automatic_deletion_implemented = true;
    result.passed++;
  } else {
    result.checks.automatic_deletion_implemented = false;
    result.failed++;
    result.warnings.push('Automatic deletion of expired data recommended');
  }
}

/**
 * Validate accuracy (Article 5.1.d)
 */
function validateAccuracy(result, dataProcessing) {
  // Data quality controls
  if (dataProcessing.dataQualityControls === true) {
    result.checks.data_quality_controls = true;
    result.passed++;
  } else {
    result.checks.data_quality_controls = false;
    result.failed++;
    result.warnings.push('Data quality controls should be implemented');
  }

  // Error correction process
  if (dataProcessing.errorCorrectionProcess === true) {
    result.checks.error_correction_process = true;
    result.passed++;
  } else {
    result.checks.error_correction_process = false;
    result.failed++;
    result.warnings.push('Error correction process should be implemented');
  }

  // Regular data updates
  if (dataProcessing.regularUpdates === true) {
    result.checks.regular_data_updates = true;
    result.passed++;
  } else {
    result.checks.regular_data_updates = false;
    result.failed++;
    result.recommendations.push('Implement regular data quality updates');
  }
}

/**
 * Validate storage limitation (Article 5.1.e)
 */
function validateStorageLimitation(result, dataProcessing) {
  // Retention period defined
  if (dataProcessing.retentionPeriod) {
    result.checks.retention_period_defined = true;
    result.passed++;
  } else {
    result.checks.retention_period_defined = false;
    result.failed++;
    result.criticalIssues.push('Data retention period must be defined');
  }

  // Automatic deletion
  if (dataProcessing.automaticDeletion === true) {
    result.checks.automatic_deletion = true;
    result.passed++;
  } else {
    result.checks.automatic_deletion = false;
    result.failed++;
    result.warnings.push('Automatic deletion after retention period recommended');
  }

  // Archival process
  if (dataProcessing.archivalProcess === true) {
    result.checks.archival_process = true;
    result.passed++;
  } else {
    result.checks.archival_process = false;
    result.failed++;
    result.recommendations.push('Implement archival process for historical data');
  }
}

/**
 * Validate security (Article 32)
 */
function validateSecurity(result, security) {
  // Encryption at rest
  if (security.encryptionAtRest === true) {
    result.checks.encryption_at_rest = true;
    result.passed++;
  } else {
    result.checks.encryption_at_rest = false;
    result.failed++;
    result.criticalIssues.push('Data must be encrypted at rest (GDPR Article 32)');
  }

  // Encryption in transit
  if (security.encryptionInTransit === true) {
    result.checks.encryption_in_transit = true;
    result.passed++;
  } else {
    result.checks.encryption_in_transit = false;
    result.failed++;
    result.criticalIssues.push('Data must be encrypted in transit (GDPR Article 32)');
  }

  // Access controls
  if (security.accessControls === true) {
    result.checks.access_controls = true;
    result.passed++;
  } else {
    result.checks.access_controls = false;
    result.failed++;
    result.criticalIssues.push('Access controls required (GDPR Article 32)');
  }

  // Audit logging
  if (security.auditLogging === true) {
    result.checks.audit_logging = true;
    result.passed++;
  } else {
    result.checks.audit_logging = false;
    result.failed++;
    result.warnings.push('Audit logging recommended for compliance tracking');
  }

  // Breach detection
  if (security.breachDetection === true) {
    result.checks.breach_detection = true;
    result.passed++;
  } else {
    result.checks.breach_detection = false;
    result.failed++;
    result.warnings.push('Breach detection system recommended (GDPR Article 33)');
  }
}

/**
 * Validate data subject rights (Articles 15-22)
 */
function validateDataSubjectRights(result, gdprConfig) {
  const rights = gdprConfig.dataSubjectRights || {};

  // Right to access (Article 15)
  if (rights.access === true) {
    result.checks.right_to_access = true;
    result.passed++;
  } else {
    result.checks.right_to_access = false;
    result.failed++;
    result.criticalIssues.push('Right to access must be implemented (GDPR Article 15)');
  }

  // Right to rectification (Article 16)
  if (rights.rectification === true) {
    result.checks.right_to_rectification = true;
    result.passed++;
  } else {
    result.checks.right_to_rectification = false;
    result.failed++;
    result.criticalIssues.push('Right to rectification must be implemented (GDPR Article 16)');
  }

  // Right to erasure (Article 17)
  if (rights.erasure === true) {
    result.checks.right_to_erasure = true;
    result.passed++;
  } else {
    result.checks.right_to_erasure = false;
    result.failed++;
    result.criticalIssues.push('Right to erasure (right to be forgotten) must be implemented (GDPR Article 17)');
  }

  // Right to data portability (Article 20)
  if (rights.portability === true) {
    result.checks.right_to_portability = true;
    result.passed++;
  } else {
    result.checks.right_to_portability = false;
    result.failed++;
    result.warnings.push('Right to data portability should be implemented (GDPR Article 20)');
  }

  // Right to object (Article 21)
  if (rights.object === true) {
    result.checks.right_to_object = true;
    result.passed++;
  } else {
    result.checks.right_to_object = false;
    result.failed++;
    result.warnings.push('Right to object should be implemented (GDPR Article 21)');
  }

  // Automated decision safeguards (Article 22)
  if (gdprConfig.automatedDecisionMaking === true) {
    if (rights.humanReview === true) {
      result.checks.automated_decision_safeguards = true;
      result.passed++;
    } else {
      result.checks.automated_decision_safeguards = false;
      result.failed++;
      result.criticalIssues.push('Human review required for automated decisions (GDPR Article 22)');
    }
  } else {
    result.checks.automated_decision_safeguards = true;
    result.passed++;
  }
}

/**
 * Get GDPR compliance score interpretation
 */
function getComplianceLevel(score) {
  if (score >= 0.95) return 'Excellent';
  if (score >= 0.85) return 'Compliant';
  if (score >= 0.70) return 'Needs Improvement';
  if (score >= 0.50) return 'Poor';
  return 'Non-Compliant';
}

module.exports = {
  validateGDPR,
  GDPR_CRITERIA,
  getComplianceLevel,
};
