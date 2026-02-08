/**
 * AI Governance Model Registry API
 *
 * Handles model registration, lifecycle management, and CRUD operations
 * for AI models in the governance system.
 *
 * Lifecycle States:
 * DRAFT → TESTING → ACTIVE → DEPRECATED → ARCHIVED
 *
 * @module api/governance/models
 */

const express = require('express');
const {
  requireAuth,
  requireRole,
  requireModelOwnership,
  requirePermission,
  ROLES,
} = require('../../../middleware/auth-governance');
const { getPrismaClient, safeQuery } = require('../prisma-client');

const router = express.Router();

/**
 * Valid lifecycle state transitions
 */
const VALID_TRANSITIONS = {
  DRAFT: ['TESTING', 'ARCHIVED'],
  TESTING: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  ACTIVE: ['DEPRECATED', 'ARCHIVED'],
  DEPRECATED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [], // Terminal state
};

/**
 * POST /api/governance/models/register
 *
 * Register a new AI model in the governance system
 *
 * Request body:
 * {
 *   name: string (required),
 *   version: string (required),
 *   provider: string (required),
 *   description?: string,
 *   metadata?: object
 * }
 *
 * Response:
 * {
 *   success: true,
 *   model: {
 *     id: string,
 *     name: string,
 *     version: string,
 *     provider: string,
 *     status: 'DRAFT',
 *     createdAt: timestamp
 *   }
 * }
 */
router.post('/register', requireAuth, requirePermission('register_model'), async (req, res) => {
  try {
    const { name, version, provider, description, metadata } = req.body;

    // Validation
    if (!name || !version || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name, version, and provider are required',
      });
    }

    // Name validation (alphanumeric, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model name',
        message: 'Model name can only contain letters, numbers, spaces, hyphens, and underscores',
      });
    }

    // Version validation (semver format)
    // eslint-disable-next-line security/detect-unsafe-regex
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(version)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version format',
        message: 'Version must follow semantic versioning (e.g., 1.0.0, 2.1.3-beta)',
      });
    }

    // Register model
    const result = await safeQuery(
      async prisma => {
        // Check if model already exists
        const existing = await prisma.governanceModel.findFirst({
          where: {
            name,
            version,
            provider,
            ownerId: req.user.id,
          },
        });

        if (existing) {
          return {
            success: false,
            error: 'model_exists',
            message: `Model ${name} v${version} from ${provider} already registered`,
          };
        }

        // Create model
        const model = await prisma.governanceModel.create({
          data: {
            name,
            version,
            provider,
            description: description || null,
            metadata: metadata || {},
            status: 'DRAFT',
            ownerId: req.user.id,
          },
          select: {
            id: true,
            name: true,
            version: true,
            provider: true,
            description: true,
            status: true,
            metadata: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Audit log
        await prisma.governanceAuditLog
          .create({
            data: {
              userId: req.user.id,
              modelId: model.id,
              action: 'MODEL_REGISTERED',
              resource: 'model',
              details: {
                name: model.name,
                version: model.version,
                provider: model.provider,
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => {
            // Ignore audit log errors
          });

        return {
          success: true,
          model,
        };
      },
      // Mock mode fallback
      () => {
        const mockModel = {
          id: 'mock-model-' + Date.now(),
          name,
          version,
          provider,
          description,
          status: 'DRAFT',
          metadata: metadata || {},
          createdAt: new Date(),
          owner: {
            id: req.user.id,
            name: 'Test User',
            email: req.user.email,
          },
        };

        return {
          success: true,
          model: mockModel,
          warning: 'Using mock mode (database not available)',
        };
      }
    );

    if (!result.success) {
      return res.status(409).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Model registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An error occurred during model registration',
    });
  }
});

/**
 * GET /api/governance/models
 *
 * List all models with filtering and pagination
 *
 * Query params:
 * - status?: string (filter by status)
 * - provider?: string (filter by provider)
 * - owner?: string (filter by owner ID)
 * - search?: string (search in name/description)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: string (default: 'createdAt')
 * - sortOrder?: 'asc' | 'desc' (default: 'desc')
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      status,
      provider,
      owner,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Pagination validation
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    if (owner) {
      where.ownerId = owner;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is not ADMIN or COMPLIANCE_OFFICER, only show their models
    if (![ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER].includes(req.user.role)) {
      where.ownerId = req.user.id;
    }

    // Fetch models
    const result = await safeQuery(
      async prisma => {
        const [models, total] = await Promise.all([
          prisma.governanceModel.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
              [sortBy]: sortOrder,
            },
            select: {
              id: true,
              name: true,
              version: true,
              provider: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  complianceChecks: true,
                  trustIndexes: true,
                  killSwitches: true,
                },
              },
            },
          }),
          prisma.governanceModel.count({ where }),
        ]);

        return {
          success: true,
          models,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      },
      // Mock mode fallback
      () => {
        const mockModels = [
          {
            id: 'mock-1',
            name: 'OX5C9E2B Vision',
            version: '1.0.0',
            provider: 'lydian-labs',
            description: 'Multimodal AI model',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            owner: {
              id: req.user.id,
              name: 'Test User',
              email: req.user.email,
            },
            _count: {
              complianceChecks: 3,
              trustIndexes: 1,
              killSwitches: 0,
            },
          },
        ];

        return {
          success: true,
          models: mockModels,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          warning: 'Using mock mode (database not available)',
        };
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Model list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * GET /api/governance/models/:modelId
 *
 * Get detailed information about a specific model
 */
router.get('/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;

    const result = await safeQuery(
      async prisma => {
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
            complianceChecks: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                framework: true,
                score: true,
                compliant: true,
                createdAt: true,
              },
            },
            trustIndexes: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                globalScore: true,
                tier: true,
                transparency: true,
                accountability: true,
                fairness: true,
                privacy: true,
                robustness: true,
                calculatedAt: true,
              },
            },
            killSwitches: {
              where: { status: 'ACTIVE' },
              orderBy: { triggeredAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                reason: true,
                triggeredAt: true,
              },
            },
            circuitBreakers: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                state: true,
                failureCount: true,
                threshold: true,
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

        // Check access permission
        if (![ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER].includes(req.user.role)) {
          if (model.ownerId !== req.user.id) {
            return {
              success: false,
              error: 'access_denied',
            };
          }
        }

        return {
          success: true,
          model,
        };
      },
      // Mock mode fallback
      () => ({
        success: true,
        model: {
          id: modelId,
          name: 'OX5C9E2B Vision',
          version: '1.0.0',
          provider: 'lydian-labs',
          description: 'Multimodal AI model',
          status: 'ACTIVE',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: req.user.id,
            name: 'Test User',
            email: req.user.email,
          },
          complianceChecks: [],
          trustIndexes: [],
          killSwitches: [],
          circuitBreakers: [],
        },
        warning: 'Using mock mode (database not available)',
      })
    );

    if (!result.success) {
      if (result.error === 'model_not_found') {
        return res.status(404).json({
          success: false,
          error: 'Model not found',
          message: `Model with ID ${modelId} does not exist`,
        });
      }
      if (result.error === 'access_denied') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to view this model',
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Model details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model details',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * PUT /api/governance/models/:modelId
 *
 * Update model information
 * (Only owner or ADMIN can update)
 */
router.put('/:modelId', requireAuth, requireModelOwnership, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { description, metadata } = req.body;

    const result = await safeQuery(
      async prisma => {
        const updateData = {};

        if (description !== undefined) {
          updateData.description = description;
        }

        if (metadata !== undefined) {
          updateData.metadata = metadata;
        }

        const model = await prisma.governanceModel.update({
          where: { id: modelId },
          data: updateData,
          select: {
            id: true,
            name: true,
            version: true,
            provider: true,
            description: true,
            status: true,
            metadata: true,
            updatedAt: true,
          },
        });

        // Audit log
        await prisma.governanceAuditLog
          .create({
            data: {
              userId: req.user.id,
              modelId: model.id,
              action: 'MODEL_UPDATED',
              resource: 'model',
              details: {
                updated: Object.keys(updateData),
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => {});

        return {
          success: true,
          model,
        };
      },
      // Mock mode fallback
      () => ({
        success: true,
        model: {
          id: modelId,
          description,
          metadata,
          updatedAt: new Date(),
        },
        warning: 'Using mock mode (database not available)',
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Model update error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * DELETE /api/governance/models/:modelId
 *
 * Delete a model (soft delete by setting status to ARCHIVED)
 * (Only owner or ADMIN can delete)
 */
router.delete('/:modelId', requireAuth, requireModelOwnership, async (req, res) => {
  try {
    const { modelId } = req.params;

    const result = await safeQuery(
      async prisma => {
        // Soft delete: Set status to ARCHIVED
        const model = await prisma.governanceModel.update({
          where: { id: modelId },
          data: {
            status: 'ARCHIVED',
          },
          select: {
            id: true,
            name: true,
            version: true,
            status: true,
          },
        });

        // Audit log
        await prisma.governanceAuditLog
          .create({
            data: {
              userId: req.user.id,
              modelId: model.id,
              action: 'MODEL_DELETED',
              resource: 'model',
              details: {
                name: model.name,
                version: model.version,
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => {});

        return {
          success: true,
          message: 'Model archived successfully',
          model,
        };
      },
      // Mock mode fallback
      () => ({
        success: true,
        message: 'Model archived successfully (mock mode)',
        warning: 'Using mock mode (database not available)',
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Model delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/governance/models/:modelId/status
 *
 * Update model lifecycle status
 *
 * Request body:
 * {
 *   status: 'DRAFT' | 'TESTING' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED'
 * }
 */
router.post('/:modelId/status', requireAuth, requireModelOwnership, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing status',
        message: 'Status field is required',
      });
    }

    const validStatuses = ['DRAFT', 'TESTING', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await safeQuery(
      async prisma => {
        // Get current model
        const currentModel = await prisma.governanceModel.findUnique({
          where: { id: modelId },
          select: { id: true, name: true, status: true },
        });

        if (!currentModel) {
          return {
            success: false,
            error: 'model_not_found',
          };
        }

        // Validate transition
        const currentStatus = currentModel.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus];

        if (!allowedTransitions.includes(status)) {
          return {
            success: false,
            error: 'invalid_transition',
            message: `Cannot transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
            currentStatus,
            requestedStatus: status,
            allowedTransitions,
          };
        }

        // Update status
        const model = await prisma.governanceModel.update({
          where: { id: modelId },
          data: { status },
          select: {
            id: true,
            name: true,
            version: true,
            status: true,
            updatedAt: true,
          },
        });

        // Audit log
        await prisma.governanceAuditLog
          .create({
            data: {
              userId: req.user.id,
              modelId: model.id,
              action: 'MODEL_STATUS_CHANGED',
              resource: 'model',
              details: {
                from: currentStatus,
                to: status,
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(() => {});

        return {
          success: true,
          model,
          message: `Model status changed from ${currentStatus} to ${status}`,
        };
      },
      // Mock mode fallback
      () => ({
        success: true,
        model: {
          id: modelId,
          status,
          updatedAt: new Date(),
        },
        message: `Model status changed to ${status} (mock mode)`,
        warning: 'Using mock mode (database not available)',
      })
    );

    if (!result.success) {
      if (result.error === 'model_not_found') {
        return res.status(404).json({
          success: false,
          error: 'Model not found',
          message: `Model with ID ${modelId} does not exist`,
        });
      }
      if (result.error === 'invalid_transition') {
        return res.status(400).json(result);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Status update failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * GET /api/governance/models/stats/summary
 *
 * Get model statistics summary
 */
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const result = await safeQuery(
      async prisma => {
        const where = {};

        // Filter by owner for non-admin users
        if (![ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER].includes(req.user.role)) {
          where.ownerId = req.user.id;
        }

        const [total, byStatus, byProvider, recentModels] = await Promise.all([
          prisma.governanceModel.count({ where }),
          prisma.governanceModel.groupBy({
            by: ['status'],
            where,
            _count: true,
          }),
          prisma.governanceModel.groupBy({
            by: ['provider'],
            where,
            _count: true,
          }),
          prisma.governanceModel.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              name: true,
              version: true,
              provider: true,
              status: true,
              createdAt: true,
            },
          }),
        ]);

        const stats = {
          total,
          byStatus: byStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {}),
          byProvider: byProvider.reduce((acc, item) => {
            acc[item.provider] = item._count;
            return acc;
          }, {}),
          recentModels,
        };

        return {
          success: true,
          stats,
        };
      },
      // Mock mode fallback
      () => ({
        success: true,
        stats: {
          total: 1,
          byStatus: {
            ACTIVE: 1,
          },
          byProvider: {
            OpenAI: 1,
          },
          recentModels: [],
        },
        warning: 'Using mock mode (database not available)',
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

module.exports = router;
