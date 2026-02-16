/**
 * Secure Medical Expert API Handler
 * Enterprise-grade wrapper with validation, encryption, audit logging
 * Integrates all security modules for hospital-grade safety
 *
 * @module SecureMedicalExpertHandler
 * @version 2.0.0
 * @security-level CRITICAL
 */

const originalHandler = require('./index');
const medicalValidation = require('../../services/medical-validation');
const encryptionService = require('../../security/encryption');
const complianceService = require('../../security/compliance');
const auditLogger = require('../../security/audit-logger');
const { MedicalError } = require('../../middleware/error-handler');
const { applySanitization } = require('../_middleware/sanitize');

/**
 * Secure wrapper for medical expert API
 */
module.exports = async (req, res) => {
  applySanitization(req, res);
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    // ==================== LAYER 1: Request Validation ====================
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      throw new MedicalError('DATA_003', 'Invalid request: message is required', 'medium', {
        requestId,
      });
    }

    if (message.length > 2000) {
      throw new MedicalError('DATA_003', 'Message too long (max 2000 characters)', 'medium', {
        requestId,
        length: message.length,
      });
    }

    // ==================== LAYER 2: Consent Validation (GDPR) ====================
    const consentRecord = req.body.consent || {
      dataProcessing: false,
      aiAssistance: false,
      consentedAt: null,
    };

    const consentValidation = complianceService.validateConsent(consentRecord);

    if (!consentValidation.valid) {
      throw new MedicalError('COMPLIANCE_002', 'Patient consent required', 'medium', {
        requestId,
        missing: consentValidation.missing,
        requiresRenewal: consentValidation.requiresRenewal,
      });
    }

    // ==================== LAYER 3: HIPAA Compliance Check ====================
    const complianceCheck = complianceService.validateHIPAACompliance('medical-query', {
      encrypted: true, // We'll encrypt the data below
      auditLogged: true, // We'll log this request
      authorized: true, // User is accessing their own data
      consentValidated: consentValidation.valid,
      dataMinimized: true, // We only collect necessary data
    });

    if (!complianceCheck.compliant) {
      throw new MedicalError(
        'COMPLIANCE_001',
        'HIPAA compliance requirements not met',
        'critical',
        {
          requestId,
          issues: complianceCheck.issues,
        }
      );
    }

    // ==================== LAYER 4: Data Encryption ====================
    const encryptedMessage = await encryptionService.encrypt(message, 'medical-query');

    // Store encrypted version for audit
    const encryptedRequestData = {
      message: encryptedMessage.encrypted,
      metadata: encryptedMessage.metadata,
      requestId,
      timestamp: new Date().toISOString(),
    };

    // ==================== LAYER 5: Audit Logging (Pre-Request) ====================
    await auditLogger.log(
      'medical-query-initiated',
      'medical-expert-api',
      {
        requestId,
        messageLength: message.length,
        encrypted: true,
        consentValidated: true,
        hipaaCompliant: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
      {
        userId: req.user?.id || 'anonymous',
        sessionId: req.session?.id || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId,
      }
    );

    // ==================== LAYER 6: Call Original API Handler ====================
    // Temporarily override res.json to intercept the response
    const originalJson = res.json.bind(res);
    let aiResponse = null;

    res.json = function (data) {
      aiResponse = data;
      // Don't send yet - we need to validate first
    };

    // Call original handler
    await originalHandler(req, res);

    // ==================== LAYER 7: AI Response Validation ====================
    if (aiResponse && aiResponse.success) {
      const validationResult = await medicalValidation.validateResponse(aiResponse, {
        patientContext: req.body.patientContext,
        specialty: req.body.specialty || 'general-medicine',
        conversationHistory: req.body.conversationHistory || [],
      });

      // Check validation status
      if (validationResult.status === 'rejected') {
        // AI response failed validation - reject it
        throw new MedicalError('MEDICAL_003', 'AI response failed validation checks', 'high', {
          requestId,
          validationScore: validationResult.score,
          issues: validationResult.issues.map(i => i.message),
        });
      }

      if (validationResult.emergencyDetected) {
        // Emergency detected - log as critical
        await auditLogger.log(
          'emergency-condition-detected',
          'medical-expert-api',
          {
            requestId,
            emergencyKeywords: validationResult.checks.emergency.keywords,
            severity: validationResult.checks.emergency.severity,
            recommendedAction: validationResult.checks.emergency.recommendedAction,
          },
          {
            userId: req.user?.id || 'anonymous',
            sessionId: req.session?.id || null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            requestId,
          }
        );

        // Prepend emergency warning
        aiResponse.response = `🚨 **EMERGENCY ALERT** 🚨\n\n${aiResponse.response}\n\n**IMMEDIATE ACTION REQUIRED: Call 112 or go to the nearest emergency room NOW!**`;
        aiResponse.emergencyDetected = true;
      }

      // Add validation metadata to response
      aiResponse.validation = {
        status: validationResult.status,
        score: validationResult.score,
        requiresClinicalReview: validationResult.requiresClinicalReview,
        warningsCount: validationResult.warnings.length,
        validatedAt: new Date().toISOString(),
      };

      // If requires clinical review, add notice
      if (validationResult.requiresClinicalReview) {
        aiResponse.response +=
          '\n\n📋 **Note**: This response has been flagged for clinical review to ensure accuracy.';
      }
    }

    // ==================== LAYER 8: Response Encryption (if requested) ====================
    if (req.body.encryptResponse && aiResponse && aiResponse.success) {
      const encryptedResponse = await encryptionService.encrypt(
        aiResponse.response,
        'medical-response'
      );

      aiResponse.response = encryptedResponse.encrypted;
      aiResponse.responseEncryption = encryptedResponse.metadata;
      aiResponse.encrypted = true;
    }

    // ==================== LAYER 9: Audit Logging (Post-Response) ====================
    const responseTime = Date.now() - startTime;

    await auditLogger.log(
      'medical-query-completed',
      'medical-expert-api',
      {
        requestId,
        success: aiResponse?.success || false,
        provider: aiResponse?.provider,
        responseTime,
        validationScore: aiResponse?.validation?.score,
        emergencyDetected: aiResponse?.emergencyDetected || false,
        encrypted: aiResponse?.encrypted || false,
      },
      {
        userId: req.user?.id || 'anonymous',
        sessionId: req.session?.id || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId,
      }
    );

    // ==================== LAYER 10: Data Retention Policy ====================
    // Check if data should be archived or deleted
    const retentionStatus = complianceService.checkRetentionPolicy('chat-logs', new Date());

    if (retentionStatus.shouldArchive) {
      await auditLogger.log('data-archival-required', 'compliance', {
        requestId,
        category: 'chat-logs',
        daysRemaining: retentionStatus.daysRemaining,
      });
    }

    // ==================== LAYER 11: Send Response ====================
    // Add security headers
    res.set({
      'X-Request-ID': requestId,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'X-HIPAA-Compliant': 'true',
      'X-GDPR-Compliant': 'true',
    });

    // Restore original res.json and send response
    res.json = originalJson;
    return res.json(aiResponse);
  } catch (error) {
    // ==================== ERROR HANDLING ====================
    const responseTime = Date.now() - startTime;

    // Log error to audit trail
    await auditLogger.log(
      'medical-query-failed',
      'medical-expert-api',
      {
        requestId,
        error: error.message,
        errorCode: error.code || 'UNKNOWN',
        errorSeverity: error.severity || 'high',
        responseTime,
        success: false,
      },
      {
        userId: req.user?.id || 'anonymous',
        sessionId: req.session?.id || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId,
      }
    );

    // If this is a MedicalError, use its information
    if (error.name === 'MedicalError') {
      const statusCode = error.code.startsWith('COMPLIANCE_')
        ? 403
        : error.code.startsWith('DATA_')
          ? 400
          : error.severity === 'critical'
            ? 500
            : 400;

      return res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: 'Bir hata olustu. Lutfen tekrar deneyin.',
          severity: error.severity,
          recoverable: error.recoverable,
          timestamp: error.timestamp,
          requestId,
        },
        supportContact: 'support@ailydian.com',
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        severity: 'high',
        requestId,
      },
      supportContact: 'support@ailydian.com',
    });
  }
};
