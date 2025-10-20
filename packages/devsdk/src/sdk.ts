/**
 * LYDIAN-IQ DEVSDK — SDK CLIENT
 *
 * Main SDK class for building Lydian-IQ plugins
 */

import {
  PluginManifest,
  PluginContext,
  PluginLifecycle,
  PluginHandler,
  PluginLogger,
  SecretManager,
  PluginStorage,
  PluginManifestSchema,
} from './types';

export class LydianSDK {
  private manifest: PluginManifest;
  private lifecycle: PluginLifecycle;
  private handlers: Map<string, PluginHandler> = new Map();

  constructor(manifest: PluginManifest) {
    // Validate manifest
    const validated = PluginManifestSchema.parse(manifest);
    this.manifest = validated;
    this.lifecycle = {};
  }

  /**
   * Register lifecycle hooks
   */
  onInstall(handler: PluginLifecycle['onInstall']) {
    this.lifecycle.onInstall = handler;
    return this;
  }

  onUninstall(handler: PluginLifecycle['onUninstall']) {
    this.lifecycle.onUninstall = handler;
    return this;
  }

  onEnable(handler: PluginLifecycle['onEnable']) {
    this.lifecycle.onEnable = handler;
    return this;
  }

  onDisable(handler: PluginLifecycle['onDisable']) {
    this.lifecycle.onDisable = handler;
    return this;
  }

  onConfigUpdate(handler: PluginLifecycle['onConfigUpdate']) {
    this.lifecycle.onConfigUpdate = handler;
    return this;
  }

  /**
   * Register API endpoint handlers
   */
  registerHandler<TInput = any, TOutput = any>(
    path: string,
    handler: PluginHandler<TInput, TOutput>
  ) {
    this.handlers.set(path, handler);
    return this;
  }

  /**
   * Get manifest
   */
  getManifest(): PluginManifest {
    return this.manifest;
  }

  /**
   * Get lifecycle hooks
   */
  getLifecycle(): PluginLifecycle {
    return this.lifecycle;
  }

  /**
   * Get handlers
   */
  getHandlers(): Map<string, PluginHandler> {
    return this.handlers;
  }

  /**
   * Execute a handler
   */
  async execute<TInput = any, TOutput = any>(
    path: string,
    input: TInput,
    context: PluginContext
  ): Promise<TOutput> {
    const handler = this.handlers.get(path);
    if (!handler) {
      throw new Error(`Handler not found for path: ${path}`);
    }

    try {
      context.logger.info(`Executing handler: ${path}`, { input });
      const result = await handler(input, context);
      context.logger.info(`Handler executed successfully: ${path}`);
      return result;
    } catch (error: any) {
      context.logger.error(`Handler execution failed: ${path}`, error);
      throw error;
    }
  }
}

/**
 * Create a new plugin
 */
export function createPlugin(manifest: PluginManifest): LydianSDK {
  return new LydianSDK(manifest);
}

/**
 * Default Plugin Logger Implementation
 */
export class DefaultPluginLogger implements PluginLogger {
  constructor(private pluginId: string) {}

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[${this.pluginId}] DEBUG:`, message, meta || '');
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(`[${this.pluginId}] INFO:`, message, meta || '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[${this.pluginId}] WARN:`, message, meta || '');
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    console.error(`[${this.pluginId}] ERROR:`, message, error?.message, meta || '');
  }
}

/**
 * Default Secret Manager Implementation
 */
export class DefaultSecretManager implements SecretManager {
  private secrets: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.secrets.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.secrets.delete(key);
  }
}

/**
 * Default Plugin Storage Implementation
 */
export class DefaultPluginStorage implements PluginStorage {
  private storage: Map<string, any> = new Map();

  async get<T = any>(key: string): Promise<T | null> {
    return this.storage.get(key) || null;
  }

  async set<T = any>(key: string, value: T, ttl_seconds?: number): Promise<void> {
    this.storage.set(key, value);
    // In production, implement TTL with setTimeout or Redis
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.storage.keys()).filter(key => key.startsWith(prefix));
  }
}

/**
 * Create a plugin context
 */
export function createPluginContext(
  plugin_id: string,
  version: string,
  config: Record<string, any> = {}
): PluginContext {
  return {
    plugin_id,
    version,
    config,
    logger: new DefaultPluginLogger(plugin_id),
    secrets: new DefaultSecretManager(),
    storage: new DefaultPluginStorage(),
  };
}
