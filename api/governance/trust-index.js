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
const {
  calculateTrustIndex,
  determineTier,
  TRUST_TIERS,
} = require('../../lib/governance/calculators/trust-index-calculator');

// Trust tier badges for display
const TRUST_TIER_BADGES = {
  PLATINUM: '🏆',
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
  UNVERIFIED: '⚠️',
};

// In-memory trust index storage (fallback when database unavailable)
const trustIndexCache = new Map();

/**
 * POST /api/governance/trust-index/calculate
 * Calculate Global Trust Index for a model
 * NOW USES REAL CALCULATOR WITH DATABASE INTEGRATION
 */
router.post('/calculate', async (req, res) => {
  try {
    const { modelId } = req.body;

    // Validation
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: modelId',
      });
    }

    // Fetch model and compliance checks from database, or use mock mode
    const result = await safeQuery(
      async (prisma) => {
        // Fetch model with owner info
        const model = await prisma.governanceModel.findUnique({
          where: { id: modelId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!model) {
          return {
            success: false,
            error: 'model_not_found',
          };
        }

        // Fetch recent compliance checks (last 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const complianceChecks = await prisma.complianceCheck.findMany({
          where: {
            modelId: model.id,
            createdAt: {
              gte: ninetyDaysAgo,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 checks
        });

        // Calculate trust index using real calculator
        const trustIndexResult = calculateTrustIndex(model, complianceChecks);

        // Save to database (create TrustIndex record)
        const trustIndex = await prisma.trustIndex.create({
          data: {
            modelId: model.id,
            globalScore: trustIndexResult.globalScore,
            tier: trustIndexResult.tier,
            dimensions: trustIndexResult.dimensions,
            strengths: trustIndexResult.strengths,
            weaknesses: trustIndexResult.weaknesses,
            recommendations: trustIndexResult.recommendations,
            complianceInfluence: trustIndexResult.complianceInfluence,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
          select: {
            id: true,
            modelId: true,
            globalScore: true,
            tier: true,
            dimensions: true,
            strengths: true,
            weaknesses: true,
            recommendations: true,
            complianceInfluence: true,
            createdAt: true,
            expiresAt: true,
          },
        });

        return {
          success: true,
          data: {
            id: trustIndex.id,
            modelId: model.id,
            modelName: model.name,
            modelVersion: model.version,
            globalScore: Math.round(trustIndex.globalScore * 100) / 100,
            scorePercentage: Math.round(trustIndex.globalScore * 100),
            tier: trustIndex.tier,
            badge: TRUST_TIER_BADGES[trustIndex.tier],
            tierDescription: TRUST_TIERS[trustIndex.tier].description,
            dimensions: trustIndex.dimensions,
            strengths: trustIndex.strengths,
            weaknesses: trustIndex.weaknesses,
            recommendations: trustIndex.recommendations,
            complianceInfluence: trustIndex.complianceInfluence,
            calculatedAt: trustIndex.createdAt.toISOString(),
            expiresAt: trustIndex.expiresAt.toISOString(),
          },
        };
      },
      // Mock mode fallback (when database not available)
      () => {
        const mockModel = {
          id: modelId,
          name: 'Mock Model',
          version: '1.0.0',
          metadata: {
            transparency: {
              explainableAI: true,
              documentationQuality: 0.8,
              openSourceComponents: 3,
              algorithmDisclosure: 'partial',
            },
            accountability: {
              ownershipDocumented: true,
              incidentResponsePlan: true,
              governanceFramework: 'ISO 27001',
            },
            fairness: {
              biasTesting: 'comprehensive',
              demographicParity: 0.85,
              equalOpportunity: 0.88,
              fairnessAudits: [{ score: 0.90 }],
            },
            security: {
              encryptionAtRest: true,
              encryptionInTransit: true,
              accessControls: true,
              roleBasedAccess: true,
              auditLogging: true,
              auditReview: true,
            },
            robustness: {
              errorHandling: 'comprehensive',
              monitoring: true,
              alerting: true,
              testCoverage: 85,
            },
          },
        };

        // Mock compliance checks
        const mockComplianceChecks = [
          { framework: 'GDPR', score: 0.88, compliant: true },
          { framework: 'HIPAA', score: 0.92, compliant: true },
        ];

        // Calculate with mock data
        const trustIndexResult = calculateTrustIndex(mockModel, mockComplianceChecks);

        const trustIndexData = {
          id: `ti-mock-${Date.now()}`,
          modelId,
          globalScore: trustIndexResult.globalScore,
          scorePercentage: Math.round(trustIndexResult.globalScore * 100),
          tier: trustIndexResult.tier,
          badge: TRUST_TIER_BADGES[trustIndexResult.tier],
          tierDescription: TRUST_TIERS[trustIndexResult.tier].description,
          dimensions: trustIndexResult.dimensions,
          strengths: trustIndexResult.strengths,
          weaknesses: trustIndexResult.weaknesses,
          recommendations: trustIndexResult.recommendations,
          complianceInfluence: trustIndexResult.complianceInfluence,
          calculatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Store in cache
        trustIndexCache.set(modelId, trustIndexData);

        return {
          success: true,
          data: {
            ...trustIndexData,
            mockMode: true,
            warning: 'Using mock data (database not available)',
          },
        };
      }
    );

    if (!result.success) {
      if (result.error === 'model_not_found') {
        return res.status(404).json({
          success: false,
          error: 'Model not found',
          message: `Model with ID ${modelId} does not exist`,
        });
      }
      throw new Error(result.error);
    }

    res.status(200).json(result);
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
 * NOW FETCHES FROM DATABASE FIRST
 */
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    // Fetch from database, or use cache fallback
    const result = await safeQuery(
      async (prisma) => {
        // Fetch most recent trust index for this model
        const trustIndex = await prisma.trustIndex.findFirst({
          where: { modelId },
          orderBy: { createdAt: 'desc' },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                version: true,
              },
            },
          },
        });

        if (!trustIndex) {
          return {
            success: false,
            error: 'not_found',
          };
        }

        // Check if expired
        if (new Date(trustIndex.expiresAt) < new Date()) {
          return {
            success: false,
            error: 'expired',
            expiredAt: trustIndex.expiresAt,
          };
        }

        return {
          success: true,
          data: {
            id: trustIndex.id,
            modelId: trustIndex.model.id,
            modelName: trustIndex.model.name,
            modelVersion: trustIndex.model.version,
            globalScore: Math.round(trustIndex.globalScore * 100) / 100,
            scorePercentage: Math.round(trustIndex.globalScore * 100),
            tier: trustIndex.tier,
            badge: TRUST_TIER_BADGES[trustIndex.tier],
            tierDescription: TRUST_TIERS[trustIndex.tier].description,
            dimensions: trustIndex.dimensions,
            strengths: trustIndex.strengths,
            weaknesses: trustIndex.weaknesses,
            recommendations: trustIndex.recommendations,
            complianceInfluence: trustIndex.complianceInfluence,
            calculatedAt: trustIndex.createdAt.toISOString(),
            expiresAt: trustIndex.expiresAt.toISOString(),
          },
        };
      },
      // Cache fallback (when database not available)
      () => {
        const trustIndex = trustIndexCache.get(modelId);

        if (!trustIndex) {
          return {
            success: false,
            error: 'not_found',
          };
        }

        // Check if expired
        const expiryDate = new Date(trustIndex.expiresAt);
        if (expiryDate < new Date()) {
          return {
            success: false,
            error: 'expired',
            expiredAt: trustIndex.expiresAt,
          };
        }

        return {
          success: true,
          data: {
            ...trustIndex,
            mockMode: true,
            warning: 'Using cached data (database not available)',
          },
        };
      }
    );

    if (!result.success) {
      if (result.error === 'not_found') {
        return res.status(404).json({
          success: false,
          error: 'Trust index not found for this model',
          message: 'Calculate trust index first using POST /calculate',
        });
      }
      if (result.error === 'expired') {
        return res.status(410).json({
          success: false,
          error: 'Trust index has expired',
          message: 'Recalculate trust index',
          expiredAt: result.expiredAt,
        });
      }
      throw new Error(result.error);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Get trust index error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
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
