/**
 * 🛡️ HIPAA AUDIT MIDDLEWARE - BEYAZ ŞAPKALI (White-Hat Security)
 *
 * Express middleware that automatically logs all Medical AI API requests
 * to comply with HIPAA Security Rule § 164.312(b) - Audit Controls
 *
 * Features:
 * - Automatic audit logging for all Medical AI endpoints
 * - De-identified user tracking (hashed IDs)
 * - Request/response metadata capture
 * - Error tracking
 * - Rate limit violation tracking
 * - Critical event detection
 *
 * Usage:
 * ```javascript
 * const { hipaaAuditMiddleware } = require('./lib/middleware/hipaa-audit-middleware');
 * app.use('/api/medical', hipaaAuditMiddleware);
 * ```
 *
 * @module lib/middleware/hipaa-audit-middleware
 */

const {
    logAuditEvent,
    AUDIT_EVENT_TYPES,
    AUDIT_SEVERITY
} = require('../security/hipaa-audit-logger');

/**
 * HIPAA Audit Middleware
 * Logs all requests to Medical AI endpoints
 */
function hipaaAuditMiddleware(req, res, next) {
    // Capture request start time
    const startTime = Date.now();

    // Extract user context
    const userId = req.user?.id || req.headers['x-user-id'] || 'ANONYMOUS';
    const sessionId = req.sessionID || req.headers['x-session-id'] || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ipAddress = req.ip || req.connection.remoteAddress || 'UNKNOWN_IP';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN_AGENT';

    // Extract request details
    const endpoint = req.path;
    const httpMethod = req.method;
    const requestBody = req.body || {};

    // Determine if this request involves PHI
    const phiAccessed = isPHIRelatedEndpoint(endpoint);

    // Override res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log audit event after response is sent
        setImmediate(async () => {
            try {
                await logAuditEvent({
                    type: AUDIT_EVENT_TYPES.MEDICAL_AI_QUERY,
                    severity: determineSeverity(res.statusCode, body),
                    userId: userId,
                    sessionId: sessionId,
                    endpoint: endpoint,
                    httpMethod: httpMethod,
                    action: `${httpMethod} ${endpoint}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    errorMessage: body.error || null,
                    phiAccessed: phiAccessed,
                    metadata: {
                        statusCode: res.statusCode,
                        duration: `${duration}ms`,
                        requestSize: JSON.stringify(requestBody).length,
                        responseSize: JSON.stringify(body).length,
                        tokenGovernor: req.tokenGovernor ? {
                            model: req.tokenGovernor.model,
                            priority: req.tokenGovernor.priority,
                            tokensGranted: req.tokenGovernor.granted
                        } : null,
                        // Critical clinical alerts
                        criticalAlert: detectCriticalAlert(endpoint, body)
                    }
                });

                // Log critical clinical events separately
                if (detectCriticalAlert(endpoint, body)) {
                    await logCriticalClinicalEvent(endpoint, body, sessionId);
                }
            } catch (error) {
                console.error('❌ HIPAA audit logging failed in middleware:', error);
            }
        });

        // Send original response
        return originalJson(body);
    };

    // Override res.send to capture non-JSON responses (e.g., SSE streaming)
    const originalSend = res.send.bind(res);
    res.send = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log audit event for SSE/streaming responses
        setImmediate(async () => {
            try {
                // Only log if not already logged via res.json
                if (res.headersSent && res.getHeader('Content-Type')?.includes('text/event-stream')) {
                    await logAuditEvent({
                        type: AUDIT_EVENT_TYPES.MEDICAL_AI_QUERY,
                        severity: AUDIT_SEVERITY.INFO,
                        userId: userId,
                        sessionId: sessionId,
                        endpoint: endpoint,
                        httpMethod: httpMethod,
                        action: `${httpMethod} ${endpoint} (SSE Streaming)`,
                        ipAddress: ipAddress,
                        userAgent: userAgent,
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        phiAccessed: phiAccessed,
                        metadata: {
                            statusCode: res.statusCode,
                            duration: `${duration}ms`,
                            streaming: true,
                            contentType: res.getHeader('Content-Type')
                        }
                    });
                }
            } catch (error) {
                console.error('❌ HIPAA audit logging failed for streaming response:', error);
            }
        });

        return originalSend(body);
    };

    // Log authentication failures
    res.on('finish', async () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
            await logAuditEvent({
                type: res.statusCode === 401 ? AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILURE : AUDIT_EVENT_TYPES.SECURITY_BREACH_ATTEMPT,
                severity: AUDIT_SEVERITY.WARNING,
                userId: userId,
                sessionId: sessionId,
                endpoint: endpoint,
                httpMethod: httpMethod,
                action: `Unauthorized access attempt to ${endpoint}`,
                ipAddress: ipAddress,
                userAgent: userAgent,
                success: false,
                metadata: {
                    statusCode: res.statusCode,
                    reason: res.statusCode === 401 ? 'Unauthenticated' : 'Forbidden'
                }
            });
        }
    });

    // Continue to next middleware
    next();
}

/**
 * Determine if endpoint is PHI-related
 *
 * @param {string} endpoint - API endpoint path
 * @returns {boolean} True if endpoint involves PHI
 */
function isPHIRelatedEndpoint(endpoint) {
    const phiEndpoints = [
        '/api/medical/multimodal-data-fusion',
        '/api/medical/maternal-fetal-health',
        '/api/medical/emergency-triage',
        '/api/medical/mental-health-triage',
        '/api/medical/sepsis-early-warning',
        '/api/medical/rare-disease-assistant'
    ];

    return phiEndpoints.some(phiEndpoint => endpoint.includes(phiEndpoint));
}

/**
 * Determine audit severity based on HTTP status code and response body
 *
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {string} Audit severity level
 */
function determineSeverity(statusCode, body) {
    // Critical errors (5xx)
    if (statusCode >= 500) {
        return AUDIT_SEVERITY.CRITICAL;
    }

    // Client errors (4xx)
    if (statusCode >= 400) {
        return AUDIT_SEVERITY.WARNING;
    }

    // Critical clinical alerts
    if (detectCriticalAlert(null, body)) {
        return AUDIT_SEVERITY.CRITICAL;
    }

    // Success
    return AUDIT_SEVERITY.INFO;
}

/**
 * Detect critical clinical alerts in response
 *
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Response body
 * @returns {string|null} Critical alert type or null
 */
function detectCriticalAlert(endpoint, body) {
    // Sepsis critical alert
    if (body?.sepsisRisk?.riskLevel === 'SEPSIS' || body?.sepsisRisk?.riskLevel === 'SEPTIC SHOCK') {
        return 'SEPSIS_CRITICAL';
    }

    // Suicide risk alert
    if (body?.suicideRisk?.riskLevel === 'HIGH' || body?.suicideRisk?.riskLevel === 'IMMINENT') {
        return 'SUICIDE_RISK_HIGH';
    }

    // Emergency triage ESI Level 1
    if (body?.triageLevel?.esi === 1) {
        return 'ESI_LEVEL_1_RESUSCITATION';
    }

    // Preterm birth very high risk
    if (body?.maternalFetalAssessment?.pretermRisk?.riskLevel === 'VERY HIGH') {
        return 'PRETERM_VERY_HIGH_RISK';
    }

    return null;
}

/**
 * Log critical clinical event separately
 *
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Response body
 * @param {string} sessionId - Session ID
 */
async function logCriticalClinicalEvent(endpoint, body, sessionId) {
    const alertType = detectCriticalAlert(endpoint, body);

    if (!alertType) {
        return;
    }

    const eventTypeMapping = {
        'SEPSIS_CRITICAL': AUDIT_EVENT_TYPES.CLINICAL_ALERT_SEPSIS,
        'SUICIDE_RISK_HIGH': AUDIT_EVENT_TYPES.CLINICAL_ALERT_SUICIDE_RISK,
        'ESI_LEVEL_1_RESUSCITATION': AUDIT_EVENT_TYPES.CLINICAL_ALERT_ESI_LEVEL_1,
        'PRETERM_VERY_HIGH_RISK': AUDIT_EVENT_TYPES.CLINICAL_ALERT_PRETERM_VERY_HIGH
    };

    await logAuditEvent({
        type: eventTypeMapping[alertType],
        severity: AUDIT_SEVERITY.CRITICAL,
        sessionId: sessionId,
        endpoint: endpoint,
        action: `CRITICAL CLINICAL ALERT: ${alertType}`,
        metadata: {
            alertType: alertType,
            clinicalData: {
                // De-identified clinical metadata only
                riskLevel: body?.sepsisRisk?.riskLevel || body?.suicideRisk?.riskLevel || body?.maternalFetalAssessment?.pretermRisk?.riskLevel,
                triageLevel: body?.triageLevel?.esi,
                timestamp: new Date().toISOString()
            }
        }
    });

    // TODO: Send real-time alert to clinical staff
    console.error(`🚨 CRITICAL CLINICAL ALERT: ${alertType}`);
    console.error(`   Session ID: ${sessionId}`);
    console.error(`   Endpoint: ${endpoint}`);
    console.error(`   Timestamp: ${new Date().toISOString()}`);
}

/**
 * Express error handler middleware for HIPAA audit logging
 * Logs all errors that occur in Medical AI endpoints
 */
function hipaaAuditErrorHandler(err, req, res, next) {
    // Log error to HIPAA audit log
    setImmediate(async () => {
        try {
            await logAuditEvent({
                type: AUDIT_EVENT_TYPES.MEDICAL_AI_ERROR,
                severity: AUDIT_SEVERITY.ERROR,
                userId: req.user?.id || 'ANONYMOUS',
                sessionId: req.sessionID || 'NO_SESSION',
                endpoint: req.path,
                httpMethod: req.method,
                action: `Error in ${req.method} ${req.path}`,
                ipAddress: req.ip || 'UNKNOWN_IP',
                userAgent: req.headers['user-agent'] || 'UNKNOWN_AGENT',
                success: false,
                errorMessage: err.message,
                metadata: {
                    errorStack: err.stack,
                    errorCode: err.code,
                    statusCode: err.status || 500
                }
            });
        } catch (auditError) {
            console.error('❌ HIPAA audit logging failed in error handler:', auditError);
        }
    });

    // Continue to next error handler
    next(err);
}

module.exports = {
    hipaaAuditMiddleware,
    hipaaAuditErrorHandler
};
