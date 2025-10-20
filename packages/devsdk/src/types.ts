/**
 * LYDIAN-IQ DEVSDK — TYPE DEFINITIONS
 *
 * Core types for building Lydian-IQ plugins and connectors
 */

import { z } from 'zod';

// Plugin Manifest Schema
export const PluginManifestSchema = z.object({
  name: z.string().min(3).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
    organization: z.string().optional(),
  }),
  license: z.enum(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'PROPRIETARY']),
  capabilities: z.array(z.enum([
    'pricing',
    'inventory',
    'logistics',
    'finance',
    'analytics',
    'compliance',
    'notification',
    'data_transform',
  ])),
  apis: z.object({
    version: z.literal('1.0'),
    endpoints: z.array(z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      path: z.string(),
      description: z.string(),
      auth_required: z.boolean().default(true),
    })),
  }),
  permissions: z.object({
    data_access: z.array(z.enum(['read', 'write', 'delete'])),
    scopes: z.array(z.string()),
  }),
  security: z.object({
    sandbox: z.boolean().default(true),
    network_access: z.boolean().default(false),
    filesystem_access: z.boolean().default(false),
  }),
  dependencies: z.record(z.string()).optional(),
  marketplace: z.object({
    category: z.enum(['commerce', 'logistics', 'finance', 'analytics', 'utilities']),
    pricing: z.enum(['free', 'freemium', 'paid']),
    support_url: z.string().url().optional(),
    documentation_url: z.string().url().optional(),
  }),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// Plugin Context
export interface PluginContext {
  plugin_id: string;
  version: string;
  config: Record<string, any>;
  logger: PluginLogger;
  secrets: SecretManager;
  storage: PluginStorage;
}

// Plugin Logger
export interface PluginLogger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}

// Secret Manager
export interface SecretManager {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// Plugin Storage
export interface PluginStorage {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl_seconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// Plugin Lifecycle Hooks
export interface PluginLifecycle {
  onInstall?(context: PluginContext): Promise<void>;
  onUninstall?(context: PluginContext): Promise<void>;
  onEnable?(context: PluginContext): Promise<void>;
  onDisable?(context: PluginContext): Promise<void>;
  onConfigUpdate?(context: PluginContext, newConfig: Record<string, any>): Promise<void>;
}

// Plugin Handler
export type PluginHandler<TInput = any, TOutput = any> = (
  input: TInput,
  context: PluginContext
) => Promise<TOutput>;

// Security Scan Results
export interface SecurityScanResult {
  scan_id: string;
  timestamp: string;
  plugin_name: string;
  plugin_version: string;
  passed: boolean;
  vulnerabilities: Vulnerability[];
  license_compliance: LicenseCheck;
  code_quality: CodeQualityMetrics;
}

export interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cve_id?: string;
  package_name: string;
  package_version: string;
  description: string;
  fix_available: boolean;
  fix_version?: string;
}

export interface LicenseCheck {
  compliant: boolean;
  declared_license: string;
  detected_licenses: string[];
  conflicts: string[];
}

export interface CodeQualityMetrics {
  score: number; // 0-100
  lines_of_code: number;
  complexity: number;
  maintainability_index: number;
  test_coverage?: number;
}

// Marketplace Listing
export interface MarketplaceListing {
  plugin_id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    organization?: string;
    verified: boolean;
  };
  category: string;
  pricing: 'free' | 'freemium' | 'paid';
  rating: number; // 0-5
  installs_count: number;
  verified: boolean;
  security_score: number; // 0-100
  last_updated: string;
  screenshots?: string[];
  tags: string[];
}

// Revenue Sharing
export interface RevenueShare {
  plugin_id: string;
  period: string; // YYYY-MM
  total_revenue_usd: number;
  platform_fee_percent: number;
  developer_share_usd: number;
  transactions_count: number;
  active_users: number;
}
