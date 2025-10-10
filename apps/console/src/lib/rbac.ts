/**
 * 🔐 RBAC Utilities
 * Role-Based Access Control helpers for scope validation
 * 
 * @module lib/rbac
 * @white-hat Compliant
 */

export type Scope = string;

export interface ScopeRequirement {
  required: Scope[];
  optional?: Scope[];
}

/**
 * Check if user has all required scopes
 */
export function hasScopes(userScopes: Scope[], requiredScopes: Scope[]): boolean {
  if (!requiredScopes || requiredScopes.length === 0) return true;
  return requiredScopes.every(scope => userScopes.includes(scope));
}

/**
 * Check if user has any of the scopes
 */
export function hasAnyScope(userScopes: Scope[], scopes: Scope[]): boolean {
  if (!scopes || scopes.length === 0) return true;
  return scopes.some(scope => userScopes.includes(scope));
}

/**
 * Get missing scopes from required list
 */
export function getMissingScopes(userScopes: Scope[], requiredScopes: Scope[]): Scope[] {
  return requiredScopes.filter(scope => !userScopes.includes(scope));
}

/**
 * Check if user has scope with pattern matching
 * Example: hasPattern(['read:*'], 'read:connectors') => true
 */
export function hasScopePattern(userScopes: Scope[], pattern: string): boolean {
  return userScopes.some(scope => {
    if (scope === pattern) return true;
    if (scope.endsWith(':*')) {
      const prefix = scope.slice(0, -1);
      return pattern.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Standard scopes for Lydian-IQ
 */
export const SCOPES = {
  // Read scopes
  READ_CONNECTORS: 'read:connectors',
  READ_INSIGHTS: 'read:insights',
  READ_SHIPMENTS: 'read:shipments',
  READ_PRODUCTS: 'read:products',
  READ_INVENTORY: 'read:inventory',
  READ_PRICES: 'read:prices',
  READ_ANALYTICS: 'read:analytics',

  // Write scopes
  WRITE_CONNECTORS: 'write:connectors',
  WRITE_INVENTORY: 'write:inventory',
  WRITE_PRICES: 'write:prices',
  WRITE_SHIPMENTS: 'write:shipments',
  
  // Admin scopes
  ADMIN_USERS: 'admin:users',
  ADMIN_SYSTEM: 'admin:system',
  ADMIN_PARTNERS: 'admin:partners',

  // Wildcard
  ADMIN_ALL: 'admin:*',
} as const;

/**
 * Scope groups for convenience
 */
export const SCOPE_GROUPS = {
  BASIC: [SCOPES.READ_CONNECTORS, SCOPES.READ_INSIGHTS],
  COMMERCE: [SCOPES.READ_PRODUCTS, SCOPES.READ_INVENTORY, SCOPES.READ_PRICES],
  LOGISTICS: [SCOPES.READ_SHIPMENTS],
  ANALYTICS: [SCOPES.READ_ANALYTICS],
  ADMIN: [SCOPES.ADMIN_ALL],
} as const;

/**
 * Get human-readable scope description (TR)
 */
export function getScopeDescription(scope: Scope): string {
  const descriptions: Record<string, string> = {
    'read:connectors': 'Bağlayıcıları görüntüleme',
    'read:insights': 'İçgörüleri görüntüleme',
    'read:shipments': 'Gönderi takibi',
    'read:products': 'Ürün bilgilerine erişim',
    'read:inventory': 'Stok bilgilerine erişim',
    'read:prices': 'Fiyat bilgilerine erişim',
    'read:analytics': 'Analitiğe erişim',
    'write:connectors': 'Bağlayıcı yönetimi',
    'write:inventory': 'Stok güncelleme',
    'write:prices': 'Fiyat güncelleme',
    'write:shipments': 'Gönderi yönetimi',
    'admin:users': 'Kullanıcı yönetimi',
    'admin:system': 'Sistem yönetimi',
    'admin:partners': 'Partner yönetimi',
    'admin:*': 'Tam yetki',
  };

  return descriptions[scope] || scope;
}

/**
 * Format missing scopes error message (TR)
 */
export function formatMissingScopesError(missingScopes: Scope[]): string {
  if (missingScopes.length === 0) return '';
  
  const scopeList = missingScopes
    .map(scope => `• ${getScopeDescription(scope)} (${scope})`)
    .join('\n');

  return `Bu işlem için aşağıdaki yetkiler gereklidir:\n\n${scopeList}`;
}

console.log('✅ RBAC utilities initialized');
