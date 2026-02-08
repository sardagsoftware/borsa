/**
 * 🚩 Feature Flags API
 * Control feature availability and A/B testing
 */

/**
 * Feature flags configuration
 */
const FEATURE_FLAGS = {
  'intent-ui': {
    enabled: true,
    description: 'Intent-First Natural Language UI',
    rollout: 100, // percentage
  },
  'voice-input': {
    enabled: false,
    description: 'Voice Input Support',
    rollout: 0,
  },
  'real-time-collaboration': {
    enabled: false,
    description: 'Real-time Collaboration',
    rollout: 0,
  },
  'advanced-analytics': {
    enabled: true,
    description: 'Advanced Analytics Dashboard',
    rollout: 100,
  },
  'multi-modal-ai': {
    enabled: true,
    description: 'Multi-modal AI (Vision, Audio, Text)',
    rollout: 100,
  },
  'premium-connectors': {
    enabled: true,
    description: 'Premium Connector Integrations',
    rollout: 100,
  },
  'batch-processing': {
    enabled: false,
    description: 'Batch Processing',
    rollout: 0,
  },
};

/**
 * Get all feature flags
 */
async function getFeatureFlags(req, res) {
  try {
    const userId = req.query.userId || 'anonymous';

    // Return all flags with their status
    const flags = Object.entries(FEATURE_FLAGS).map(([key, config]) => ({
      key,
      enabled: config.enabled,
      description: config.description,
      rollout: config.rollout,
    }));

    res.json({
      success: true,
      userId,
      flags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Feature flags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags',
      message: 'Özellik bayrakları hatası',
    });
  }
}

/**
 * Check if a specific feature is enabled
 */
async function checkFeature(req, res) {
  try {
    const { featureKey } = req.params;
    const userId = req.query.userId || 'anonymous';

    const feature = FEATURE_FLAGS[featureKey];

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found',
        featureKey,
      });
    }

    // Simple rollout logic (in production, use user ID hash)
    const isEnabled = feature.enabled && Math.random() * 100 < feature.rollout;

    res.json({
      success: true,
      featureKey,
      enabled: isEnabled,
      description: feature.description,
      rollout: feature.rollout,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Feature check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature',
      message: 'Özellik bayrakları hatası',
    });
  }
}

/**
 * Update feature flag (admin only - add auth later)
 */
async function updateFeatureFlag(req, res) {
  try {
    const { featureKey } = req.params;
    const { enabled, rollout } = req.body;

    if (!FEATURE_FLAGS[featureKey]) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found',
        featureKey,
      });
    }

    // Update flag
    if (typeof enabled === 'boolean') {
      FEATURE_FLAGS[featureKey].enabled = enabled;
    }
    if (typeof rollout === 'number' && rollout >= 0 && rollout <= 100) {
      FEATURE_FLAGS[featureKey].rollout = rollout;
    }

    res.json({
      success: true,
      featureKey,
      updated: FEATURE_FLAGS[featureKey],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Feature update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag',
      message: 'Özellik bayrakları hatası',
    });
  }
}

module.exports = {
  getFeatureFlags,
  checkFeature,
  updateFeatureFlag,
};
