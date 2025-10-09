// ========================================
// LYDIAN APPLICATION SDK
// Entry point - exports all SDK components
// ========================================

// Types
export * from './types';

// Core Components
export { CapabilityManifestManager, capabilityRegistry } from './capability-manifest';
export { ActionRegistry, actionRegistry, ActionExecutionError } from './action-registry';
export { OAuth2Client, OAuth2Broker, oauth2Broker } from './oauth-broker';
export { ScopeManager, scopeManager, COMMON_SCOPES } from './scope-manager';

// Re-export for convenience
export type {
  ConnectorManifest,
  Capability,
  ActionContext,
  ActionResult,
  IConnector,
  OAuth2Config,
  RateLimitConfig,
  ScopeDefinition,
} from './types';
