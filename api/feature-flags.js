/**
 * 🚦 Feature Flags API - Production Control Plane
 *
 * Purpose: Centralized feature flag management for safe rollouts
 * Policy: White-Hat • Zero Mock • Audit-Ready
 *
 * Endpoint: GET /api/feature-flags
 *
 * @returns {Object} Feature flag state for all system components
 */

module.exports = async (req, res) => {
  try {
    // Feature flag state - Environment-driven with safe defaults
    const flags = {
      // ===== AUTHENTICATION =====
      oauth_google: process.env.GOOGLE_CLIENT_ID ? true : false,
      oauth_microsoft: process.env.MICROSOFT_CLIENT_ID ? true : false,
      oauth_github: process.env.GITHUB_CLIENT_ID ? true : false,
      oauth_apple: process.env.APPLE_CLIENT_ID ? true : false,
      email_password_auth: true, // Always enabled (core feature)

      // ===== PAYMENT & BILLING =====
      stripe_payments: process.env.STRIPE_SECRET_KEY ? true : false,
      stripe_webhooks: process.env.STRIPE_WEBHOOK_SECRET ? true : false,

      // ===== SECURITY & RESILIENCE =====
      rate_limiting: true,        // PHASE 1: Enabled
      idempotency_keys: true,     // PHASE 2: Enabled
      webhook_signature_validation: true, // PHASE 2: Enabled
      csrf_protection: true,      // Already implemented

      // ===== OBSERVABILITY =====
      application_insights: process.env.AZURE_APP_INSIGHTS_KEY ? true : false,
      opentelemetry_tracing: false, // PHASE 5: To be enabled
      slo_guards: false,          // PHASE 5: To be enabled
      synthetic_monitoring: false, // PHASE 5: To be enabled

      // ===== CLOUD PROVIDERS (AI) =====
      azure_openai: process.env.AZURE_OPENAI_API_KEY ? true : false,
      azure_ai_foundry: process.env.AZURE_AI_FOUNDRY_API_KEY ? true : false,
      google_gemini: process.env.GOOGLE_GEMINI_API_KEY ? true : false,
      anthropic_AX9F7E2B: process.env.ANTHROPIC_API_KEY ? true : false,
      openai: process.env.OPENAI_API_KEY ? true : false,
      groq: process.env.GROQ_API_KEY ? true : false,

      // ===== MEDICAL & HEALTH AI =====
      medical_ai_module: true,
      fhir_integration: process.env.AZURE_FHIR_ENDPOINT ? true : false,
      epic_integration: process.env.EPIC_CLIENT_ID ? true : false,
      dicom_imaging: process.env.AZURE_DICOM_ENDPOINT ? true : false,
      rare_disease_assistant: true, // Uses public Orphanet API

      // ===== LEGAL AI =====
      legal_ai_module: true,

      // ===== ENTERPRISE FEATURES =====
      enterprise_api: true,
      rbac_system: true,
      admin_panel: true,

      // ===== CIVIC INTELLIGENCE =====
      civic_modules: true,

      // ===== DEPLOYMENT & ROLLOUT =====
      canary_rollout: false,      // PHASE 7: Canary deployment control
      feature_freeze: true,       // PHASE 0: Change freeze active
      maintenance_mode: false,    // Emergency maintenance toggle

      // ===== EXPERIMENTAL =====
      multimodal_input: false,    // Image/audio analysis (future)
      real_time_streaming: false, // SSE/WebSocket streaming (future)

      // ===== METADATA =====
      _meta: {
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'local',
        git_sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      }
    };

    // Security: Remove sensitive metadata in non-production
    if (process.env.NODE_ENV !== 'production') {
      flags._debug = {
        missing_oauth_providers: [
          !flags.oauth_google && 'lydian-vision',
          !flags.oauth_microsoft && 'Microsoft',
          !flags.oauth_github && 'GitHub',
          !flags.oauth_apple && 'Apple'
        ].filter(Boolean),
        missing_critical_keys: [
          !process.env.JWT_SECRET && 'JWT_SECRET',
          !process.env.STRIPE_SECRET_KEY && 'STRIPE_SECRET_KEY'
        ].filter(Boolean)
      };
    }

    // Audit log
    console.log('[FeatureFlags] Flags requested', {
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']?.substring(0, 100)
    });

    res.status(200).json({
      success: true,
      data: flags,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[FeatureFlags] Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature flags',
      timestamp: new Date().toISOString()
    });
  }
};
