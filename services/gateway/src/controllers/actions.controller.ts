// ========================================
// ACTIONS CONTROLLER
// Main entry point for action execution
// White-Hat: Validation, audit logging, error handling
// ========================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { actionRegistry } from '@lydian/app-sdk';
import type { ActionContext } from '@lydian/app-sdk';
import { ActionExecutionRequestSchema } from '../types';
import crypto from 'crypto';

/**
 * Execute Action Handler
 * POST /api/actions
 */
export async function executeActionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Log incoming request
  request.log.info({ requestId, body: request.body }, 'Action execution request');

  try {
    // 1. Validate request body
    const validationResult = ActionExecutionRequestSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.errors,
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      });
    }

    const { action, payload, scopes, metadata } = validationResult.data;

    // 2. Check if action exists
    if (!actionRegistry.hasAction(action)) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ACTION_NOT_FOUND',
          message: `Action "${action}" not found`,
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      });
    }

    // 3. Build action context
    const context: ActionContext = {
      action,
      payload,
      scopes: scopes || [],
      credentials: getCredentialsFromEnv(),
      requestId,
      userId: extractUserId(request),
      metadata,
    };

    // 4. Execute action
    request.log.info({ action, requestId }, 'Executing action');
    const result = await actionRegistry.executeAction(context);

    // 5. Audit log
    request.log.info(
      {
        requestId,
        action,
        success: result.success,
        responseTime: Date.now() - startTime,
      },
      'Action execution completed'
    );

    // 6. Send response
    const statusCode = result.success ? 200 : result.error?.code === 'RATE_LIMITED' ? 429 : 500;

    return reply.status(statusCode).send({
      ...result,
      metadata: {
        ...result.metadata,
        requestId,
        responseTime: Date.now() - startTime,
      },
    });

  } catch (error: any) {
    // Unexpected error
    request.log.error({ requestId, error }, 'Unexpected error in action execution');

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sunucu hatası oluştu',
      },
      metadata: {
        requestId,
        responseTime: Date.now() - startTime,
      },
    });
  }
}

/**
 * List Actions Handler
 * GET /api/actions
 */
export async function listActionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const actions = actionRegistry.getActions();

    const actionsWithMetadata = actions.map(actionId => {
      const metadata = actionRegistry.getActionMetadata(actionId);
      return {
        id: actionId,
        name: metadata?.capability.name,
        description: metadata?.capability.description,
        category: metadata?.capability.category,
        requiresPartner: metadata?.capability.requiresPartner,
        requiredScopes: metadata?.capability.requiredScopes,
      };
    });

    return reply.send({
      success: true,
      data: {
        actions: actionsWithMetadata,
        total: actions.length,
      },
    });
  } catch (error: any) {
    request.log.error({ error }, 'Error listing actions');

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list actions',
      },
    });
  }
}

/**
 * Health Check Handler
 * GET /api/health
 */
export async function healthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const healthResult = await actionRegistry.healthCheck();

    const status = healthResult.healthy
      ? 'healthy'
      : healthResult.connectors.some(c => c.healthy)
      ? 'degraded'
      : 'unhealthy';

    return reply.send({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      connectors: healthResult.connectors,
    });
  } catch (error: any) {
    request.log.error({ error }, 'Health check failed');

    return reply.status(503).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message,
    });
  }
}

// ========== Helpers ==========

function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString('hex')}`;
}

function getCredentialsFromEnv(): Record<string, any> {
  return {
    // Trendyol (Commerce)
    TRENDYOL_API_KEY: process.env.TRENDYOL_API_KEY,
    TRENDYOL_API_SECRET: process.env.TRENDYOL_API_SECRET,
    TRENDYOL_SUPPLIER_ID: process.env.TRENDYOL_SUPPLIER_ID,

    // Hepsiburada (Commerce)
    HEPSIBURADA_API_KEY: process.env.HEPSIBURADA_API_KEY,
    HEPSIBURADA_API_SECRET: process.env.HEPSIBURADA_API_SECRET,
    HEPSIBURADA_MERCHANT_ID: process.env.HEPSIBURADA_MERCHANT_ID,

    // Getir (Delivery)
    GETIR_API_KEY: process.env.GETIR_API_KEY,
    GETIR_PARTNER_ID: process.env.GETIR_PARTNER_ID,

    // Yemeksepeti (Delivery)
    YEMEKSEPETI_API_KEY: process.env.YEMEKSEPETI_API_KEY,
    YEMEKSEPETI_RESTAURANT_KEY: process.env.YEMEKSEPETI_RESTAURANT_KEY,

    // Trendyol Yemek (Delivery)
    TRENDYOL_YEMEK_PARTNER_KEY: process.env.TRENDYOL_YEMEK_PARTNER_KEY,
    TRENDYOL_YEMEK_RESTAURANT_ID: process.env.TRENDYOL_YEMEK_RESTAURANT_ID,

    // Add more as needed
  };
}

function extractUserId(request: FastifyRequest): string | undefined {
  // TODO: Extract from JWT token when auth is implemented
  return request.headers['x-user-id'] as string | undefined;
}
