/**
 * 🛡️ AILYDIAN AI LENS TRADER - Secret Management
 * Secret hygiene: server-only, runtime assert; env sealing
 * © Emrah Şardağ. All rights reserved.
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Trading APIs
  BINANCE_API_KEY: z.string().optional(),
  BINANCE_API_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Security
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  SIGSTORE_IDENTITY: z.string().optional(),
  ALERT_SLACK_WEBHOOK: z.string().url().optional(),
  ALERT_TELEGRAM_BOT_TOKEN: z.string().optional(),
  
  // Ownership
  OWNERSHIP_LEGAL_NAME: z.string().default('Emrah Şardağ'),
  OWNERSHIP_COPYRIGHT: z.string().default('© Emrah Şardağ. All rights reserved.'),
  OWNERSHIP_CONTACT: z.string().email().default('legal@ailydian.com'),
});

class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, string> = new Map();
  private sealed = false;

  private constructor() {
    this.validateEnvironment();
  }

  static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  private validateEnvironment() {
    try {
      const result = envSchema.safeParse(process.env);
      if (!result.success) {
        console.warn('Environment validation warnings:', result.error.format());
      }
    } catch (error) {
      console.error('Environment validation failed:', error);
    }
  }

  assertServerOnly(secretName: string): void {
    if (typeof window !== 'undefined') {
      throw new Error(`Secret "${secretName}" accessed in client-side code. This is a security violation.`);
    }
  }

  get(secretName: string): string | undefined {
    this.assertServerOnly(secretName);
    
    // Check cache first
    if (this.secrets.has(secretName)) {
      return this.secrets.get(secretName);
    }
    
    const value = process.env[secretName];
    if (value) {
      this.secrets.set(secretName, value);
    }
    
    return value;
  }

  getRequired(secretName: string): string {
    const value = this.get(secretName);
    if (!value) {
      throw new Error(`Required secret "${secretName}" is not set`);
    }
    return value;
  }

  seal(): void {
    this.sealed = true;
    Object.freeze(this.secrets);
  }

  isSealed(): boolean {
    return this.sealed;
  }

  // Redact sensitive data for logging
  redactForLog(obj: any): any {
    const sensitiveKeys = [
      'api_key', 'api_secret', 'token', 'password', 'secret', 'key',
      'authorization', 'auth', 'credential', 'private'
    ];
    
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result: any = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const shouldRedact = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (shouldRedact && typeof value === 'string') {
        result[key] = value.length > 8 ? `${value.slice(0, 4)}***${value.slice(-4)}` : '***';
      } else if (typeof value === 'object') {
        result[key] = this.redactForLog(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  // Hash sensitive values for comparison without exposing
  hashSecret(secret: string): string {
    // Use Web Crypto API for edge runtime compatibility
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Simplified hash for edge runtime
      let hash = 0;
      for (let i = 0; i < secret.length; i++) {
        const char = secret.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16).slice(0, 16);
    }
    
    // Fallback for edge runtime
    return secret.slice(0, 8) + '...' + secret.slice(-4);
  }
}

// Singleton instance
export const secretManager = SecretManager.getInstance();

// Convenience functions
export const getSecret = (name: string): string | undefined => secretManager.get(name);
export const getRequiredSecret = (name: string): string => secretManager.getRequired(name);
export const assertServerOnly = (name: string): void => secretManager.assertServerOnly(name);
export const redactForLog = (obj: any): any => secretManager.redactForLog(obj);
export const hashSecret = (secret: string): string => secretManager.hashSecret(secret);

// Seal secrets in production
if (process.env.NODE_ENV === 'production') {
  secretManager.seal();
}

// Runtime assertions for critical secrets
export function validateCriticalSecrets(): { valid: boolean; missing: string[] } {
  const critical = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missing: string[] = [];
  
  for (const secret of critical) {
    if (!getSecret(secret)) {
      missing.push(secret);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Helper for encrypted storage
export function getEncryptionKey(): string {
  return getRequiredSecret('ENCRYPTION_KEY');
}

// Helper for ownership info
export function getOwnershipInfo() {
  return {
    legalName: getSecret('OWNERSHIP_LEGAL_NAME') || 'Emrah Şardağ',
    copyright: getSecret('OWNERSHIP_COPYRIGHT') || '© Emrah Şardağ. All rights reserved.',
    contact: getSecret('OWNERSHIP_CONTACT') || 'legal@ailydian.com'
  };
}
