/**
 * AI Governance - Trust Index API
 * Calculate and monitor AI system trustworthiness
 * Integrated into AILydian Ultra Pro
 *
 * NOW WITH REAL CALCULATOR - BEYAZ ŞAPKALI (White-Hat)
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient, safeQuery } = require('./prisma-client');
const { calculateTrustIndex } = require('../../lib/governance/calculators/trust-index-calculator');

// Trust tier thresholds
const TRUST_TIERS = {
  PLATINUM: { min: 90, badge: '🏆' },
  GOLD: { min: 80, badge: '🥇' },
  SILVER: { min: 70, badge: '🥈' },
  BRONZE: { min: 60, badge: '🥉' },
  UNVERIFIED: { min: 0, badge: '⚠️' },
};

// In-memory trust index storage (will be moved to database)
const trustIndexCache = new Map();

/**
 * Calculate Trust Index from component scores
 */
function calculateTrustIndex(scores) {
  const weights = {
    transparency: 0.25,
    accountability: 0.20,
    fairness: 0.20,
    privacy: 0.20,
    robustness: 0.15,
  };

  const globalScore =
    scores.transparency * weights.transparency +
    scores.accountability * weights.accountability +
    scores.fairness * weights.fairness +
    scores.privacy * weights.privacy +
    scores.robustness * weights.robustness;

  return Math.round(globalScore * 100) / 100;
}

/**
 * Determine trust tier based on score
 */
function determineTier(score) {
  if (score >= TRUST_TIERS.PLATINUM.min) return 'PLATINUM';
  if (score >= TRUST_TIERS.GOLD.min) return 'GOLD';
  if (score >= TRUST_TIERS.SILVER.min) return 'SILVER';
  if (score >= TRUST_TIERS.BRONZE.min) return 'BRONZE';
  return 'UNVERIFIED';
}

/**
 * POST /api/governance/trust-index/calculate
 * Calculate Global Trust Index for a model
 */
router.post('/calculate', async (req, res) => {
  try {
    const { modelId, transparency, accountability, fairness, privacy, robustness } = req.body;

    // Validation
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: modelId',
      });
    }

    const scores = {
      transparency: transparency || 0,
      accountability: accountability || 0,
      fairness: fairness || 0,
      privacy: privacy || 0,
      robustness: robustness || 0,
    };

    // Validate score ranges
    for (const [key, value] of Object.entries(scores)) {
      if (value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          error: `${key} score must be between 0-100`,
        });
      }
    }

    // Calculate trust index
    const globalTrustScore = calculateTrustIndex(scores);
    const tier = determineTier(globalTrustScore);
    const badge = TRUST_TIERS[tier].badge;

    const trustIndex = {
      id: `ti-${Date.now()}`,
      modelId,
      globalTrustScore,
      tier,
      badge,
      scores,
      calculatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };

    // Store in cache
    trustIndexCache.set(modelId, trustIndex);

    res.status(200).json({
      success: true,
      data: trustIndex,
    });
  } catch (error) {
    console.error('Calculate trust index error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/governance/trust-index/:modelId
 * Get current Global Trust Index for a model
 */
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const trustIndex = trustIndexCache.get(modelId);

    if (!trustIndex) {
      return res.status(404).json({
        success: false,
        error: 'Trust index not found for this model',
        message: 'Calculate trust index first using POST /calculate',
      });
    }

    // Check if expired
    const expiryDate = new Date(trustIndex.expiresAt);
    if (expiryDate < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Trust index has expired',
        message: 'Recalculate trust index',
        expiredAt: trustIndex.expiresAt,
      });
    }

    res.status(200).json({
      success: true,
      data: trustIndex,
    });
  } catch (error) {
    console.error('Get trust index error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/trust-index/leaderboard
 * Get trust leaderboard (top models by trust score)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, tier } = req.query;

    // Get all trust indices
    let allTrustIndices = Array.from(trustIndexCache.values());

    // Filter by tier if specified
    if (tier) {
      allTrustIndices = allTrustIndices.filter((ti) => ti.tier === tier.toUpperCase());
    }

    // Filter out expired
    const now = new Date();
    allTrustIndices = allTrustIndices.filter((ti) => new Date(ti.expiresAt) > now);

    // Sort by score (descending)
    allTrustIndices.sort((a, b) => b.globalTrustScore - a.globalTrustScore);

    // Limit results
    const leaderboard = allTrustIndices.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        count: leaderboard.length,
        tier: tier?.toUpperCase() || 'ALL',
        models: leaderboard.map((ti, index) => ({
          rank: index + 1,
          modelId: ti.modelId,
          score: ti.globalTrustScore,
          tier: ti.tier,
          badge: ti.badge,
          calculatedAt: ti.calculatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/trust-index/stats
 * Get global trust statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const allTrustIndices = Array.from(trustIndexCache.values());
    const now = new Date();
    const activeTrustIndices = allTrustIndices.filter((ti) => new Date(ti.expiresAt) > now);

    const totalModels = activeTrustIndices.length;
    const averageScore =
      totalModels > 0
        ? activeTrustIndices.reduce((sum, ti) => sum + ti.globalTrustScore, 0) / totalModels
        : 0;

    const tierDistribution = {
      PLATINUM: activeTrustIndices.filter((ti) => ti.tier === 'PLATINUM').length,
      GOLD: activeTrustIndices.filter((ti) => ti.tier === 'GOLD').length,
      SILVER: activeTrustIndices.filter((ti) => ti.tier === 'SILVER').length,
      BRONZE: activeTrustIndices.filter((ti) => ti.tier === 'BRONZE').length,
      UNVERIFIED: activeTrustIndices.filter((ti) => ti.tier === 'UNVERIFIED').length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalModels,
        averageScore: Math.round(averageScore * 100) / 100,
        tierDistribution,
        lastCalculated: activeTrustIndices.length > 0
          ? activeTrustIndices[activeTrustIndices.length - 1].calculatedAt
          : null,
      },
    });
  } catch (error) {
    console.error('Get trust stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/trust-index/:modelId/trend
 * Get trust trend analysis for a model (mock data for now)
 */
router.get('/:modelId/trend', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { days = 90 } = req.query;

    const current = trustIndexCache.get(modelId);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: 'No trust index found for this model',
      });
    }

    // Generate mock trend data
    const trendData = [];
    for (let i = parseInt(days); i >= 0; i -= 7) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const variance = (Math.random() - 0.5) * 10; // ±5 points variance
      const score = Math.max(0, Math.min(100, current.globalTrustScore + variance));

      trendData.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score * 100) / 100,
        tier: determineTier(score),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        modelId,
        period: `${days} days`,
        currentScore: current.globalTrustScore,
        trend: trendData,
      },
    });
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
