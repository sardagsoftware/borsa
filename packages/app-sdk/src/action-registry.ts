// ========================================
// ACTION REGISTRY - ACTION ROUTING SYSTEM
// Maps actions to connector implementations
// White-Hat: Validation + Authorization + Audit Trail
// ========================================

import type { ActionContext, ActionResult, ActionRegistryEntry, IConnector } from './types';
import { capabilityRegistry } from './capability-manifest';

/**
 * Action execution error
 */
export class ActionExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ActionExecutionError';
  }
}

/**
 * Action Registry
 * Routes action requests to appropriate connector handlers
 */
export class ActionRegistry {
  private connectors: Map<string, IConnector> = new Map();
  private handlers: Map<string, ActionRegistryEntry> = new Map();

  /**
   * Register a connector instance
   */
  async registerConnector(connector: IConnector): Promise<void> {
    const manifest = connector.getManifest();

    // Check Legal Gate
    if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `[Legal Gate] Cannot register connector "${manifest.id}" without partner approval`
        );
      }
      console.warn(`[Legal Gate] Connector "${manifest.id}" registered in sandbox mode`);
    }

    // Register manifest
    capabilityRegistry.register(manifest);

    // Store connector instance
    this.connectors.set(manifest.id, connector);

    // Register action handlers
    for (const capability of manifest.capabilities) {
      const actionId = capability.id;

      if (this.handlers.has(actionId)) {
        throw new Error(`Action "${actionId}" already registered by another connector`);
      }

      this.handlers.set(actionId, {
        connectorId: manifest.id,
        capability,
        handler: (context: ActionContext) => connector.executeAction(context),
      });

      console.log(`  ✅ Registered action: ${actionId} (${capability.name})`);
    }

    console.log(`🎯 Connector "${manifest.id}" registered with ${manifest.capabilities.length} actions`);
  }

  /**
   * Execute an action
   * Main entry point for all action executions
   */
  async executeAction(context: ActionContext): Promise<ActionResult> {
    const startTime = Date.now();
    const { action, payload, requestId } = context;

    console.log(`[ActionRegistry] Executing action: ${action} (request: ${requestId})`);

    // 1. Find action handler
    const entry = this.handlers.get(action);
    if (!entry) {
      return {
        success: false,
        error: {
          code: 'ACTION_NOT_FOUND',
          message: `Action "${action}" not found`,
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      };
    }

    const { connectorId, capability, handler } = entry;

    // 2. Check Legal Gate
    if (capability.requiresPartner) {
      const manifest = capabilityRegistry.get(connectorId);
      if (manifest?.status !== 'partner_ok' && process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: {
            code: 'PARTNER_APPROVAL_REQUIRED',
            message: `Action "${action}" requires partner approval`,
          },
          metadata: {
            requestId,
            responseTime: Date.now() - startTime,
          },
        };
      }
    }

    // 3. Validate input payload
    try {
      capability.inputSchema.parse(payload);
    } catch (validationError: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input payload',
          details: validationError.errors || validationError.message,
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      };
    }

    // 4. Check required scopes
    const missingScopes = capability.requiredScopes.filter(
      (scope) => !context.scopes.includes(scope)
    );
    if (missingScopes.length > 0) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPES',
          message: 'Missing required scopes',
          details: { required: capability.requiredScopes, missing: missingScopes },
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      };
    }

    // 5. Execute action handler
    try {
      const result = await handler(context);

      // Add response time metadata
      result.metadata = {
        ...result.metadata,
        requestId,
        responseTime: Date.now() - startTime,
      };

      console.log(
        `[ActionRegistry] ✅ Action "${action}" completed in ${result.metadata.responseTime}ms`
      );

      return result;
    } catch (error: any) {
      console.error(`[ActionRegistry] ❌ Action "${action}" failed:`, error);

      return {
        success: false,
        error: {
          code: error.code || 'EXECUTION_ERROR',
          message: error.message || 'Action execution failed',
          details: error.details,
        },
        metadata: {
          requestId,
          responseTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get all registered actions
   */
  getActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get action metadata
   */
  getActionMetadata(actionId: string): ActionRegistryEntry | undefined {
    return this.handlers.get(actionId);
  }

  /**
   * Check if action exists
   */
  hasAction(actionId: string): boolean {
    return this.handlers.has(actionId);
  }

  /**
   * Get connector instance
   */
  getConnector(connectorId: string): IConnector | undefined {
    return this.connectors.get(connectorId);
  }

  /**
   * Health check: Test all connectors
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    connectors: Array<{
      id: string;
      healthy: boolean;
      message?: string;
    }>;
  }> {
    const results: Array<{ id: string; healthy: boolean; message?: string }> = [];

    for (const [connectorId, connector] of this.connectors.entries()) {
      try {
        const health = await connector.healthCheck();
        results.push({
          id: connectorId,
          ...health,
        });
      } catch (error: any) {
        results.push({
          id: connectorId,
          healthy: false,
          message: error.message,
        });
      }
    }

    const allHealthy = results.every((r) => r.healthy);

    return {
      healthy: allHealthy,
      connectors: results,
    };
  }

  /**
   * Graceful shutdown: Close all connectors
   */
  async shutdown(): Promise<void> {
    console.log('[ActionRegistry] Shutting down...');

    for (const [connectorId, connector] of this.connectors.entries()) {
      try {
        await connector.shutdown();
        console.log(`  ✅ Shut down connector: ${connectorId}`);
      } catch (error: any) {
        console.error(`  ❌ Error shutting down connector "${connectorId}":`, error);
      }
    }

    this.connectors.clear();
    this.handlers.clear();
  }
}

// Singleton instance
export const actionRegistry = new ActionRegistry();
