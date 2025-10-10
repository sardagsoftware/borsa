/**
 * 🔐 RBAC Utilities
 * Helper functions for Role-Based Access Control
 *
 * @module lib/rbac-utils
 * @white-hat Compliant
 */

import type { Scope } from '../components/rbac/ScopeGate';

/**
 * All available scopes in the system
 */
export const ALL_SCOPES: Scope[] = [
  // Medical AI
  'read:medical',
  'write:medical',
  'admin:medical',
  // Legal AI
  'read:legal',
  'write:legal',
  'admin:legal',
  // Connectors
  'read:connectors',
  'write:connectors',
  'admin:connectors',
  // Partner
  'partner:read',
  'partner:write',
  'partner:admin',
  // Enterprise
  'enterprise:read',
  'enterprise:write',
  'enterprise:admin',
];

/**
 * Legal scopes that require legal agreement
 */
export const LEGAL_SCOPES: Scope[] = [
  'read:legal',
  'write:legal',
  'admin:legal',
];

/**
 * Partner scopes
 */
export const PARTNER_SCOPES: Scope[] = [
  'partner:read',
  'partner:write',
  'partner:admin',
];

/**
 * Enterprise scopes
 */
export const ENTERPRISE_SCOPES: Scope[] = [
  'enterprise:read',
  'enterprise:write',
  'enterprise:admin',
];

/**
 * Default scopes for new users
 */
export const DEFAULT_USER_SCOPES: Scope[] = [
  'read:connectors',
  'read:medical',
];

/**
 * Scope hierarchy (admin includes write, write includes read)
 */
export const SCOPE_HIERARCHY: Record<string, Scope[]> = {
  'admin:medical': ['write:medical', 'read:medical'],
  'admin:legal': ['write:legal', 'read:legal'],
  'admin:connectors': ['write:connectors', 'read:connectors'],
  'partner:admin': ['partner:write', 'partner:read'],
  'enterprise:admin': ['enterprise:write', 'enterprise:read'],
  'write:medical': ['read:medical'],
  'write:legal': ['read:legal'],
  'write:connectors': ['read:connectors'],
  'partner:write': ['partner:read'],
  'enterprise:write': ['enterprise:read'],
};

/**
 * Scope categories for grouping
 */
export const SCOPE_CATEGORIES = {
  medical: {
    name: 'Medikal AI',
    icon: '🏥',
    scopes: ['read:medical', 'write:medical', 'admin:medical'] as Scope[],
  },
  legal: {
    name: 'Hukuk AI',
    icon: '⚖️',
    scopes: ['read:legal', 'write:legal', 'admin:legal'] as Scope[],
  },
  connectors: {
    name: 'API Bağlantıları',
    icon: '🔌',
    scopes: ['read:connectors', 'write:connectors', 'admin:connectors'] as Scope[],
  },
  partner: {
    name: 'Partner Programı',
    icon: '🤝',
    scopes: ['partner:read', 'partner:write', 'partner:admin'] as Scope[],
  },
  enterprise: {
    name: 'Kurumsal',
    icon: '🏢',
    scopes: ['enterprise:read', 'enterprise:write', 'enterprise:admin'] as Scope[],
  },
};

/**
 * Check if user has a specific scope (including hierarchy)
 */
export function hasScope(userScopes: string[], requiredScope: Scope): boolean {
  // Direct match
  if (userScopes.includes(requiredScope)) {
    return true;
  }

  // Check hierarchy (e.g., admin:medical includes write:medical and read:medical)
  for (const userScope of userScopes) {
    const impliedScopes = SCOPE_HIERARCHY[userScope as Scope];
    if (impliedScopes && impliedScopes.includes(requiredScope)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has all required scopes
 */
export function hasAllScopes(userScopes: string[], requiredScopes: Scope[]): boolean {
  return requiredScopes.every(scope => hasScope(userScopes, scope));
}

/**
 * Check if user has any of the required scopes
 */
export function hasAnyScope(userScopes: string[], requiredScopes: Scope[]): boolean {
  return requiredScopes.some(scope => hasScope(userScopes, scope));
}

/**
 * Get all effective scopes (including hierarchy)
 */
export function getEffectiveScopes(userScopes: string[]): Scope[] {
  const effective = new Set<Scope>(userScopes as Scope[]);

  // Add implied scopes from hierarchy
  for (const scope of userScopes) {
    const impliedScopes = SCOPE_HIERARCHY[scope as Scope];
    if (impliedScopes) {
      impliedScopes.forEach(implied => effective.add(implied));
    }
  }

  return Array.from(effective);
}

/**
 * Get missing scopes
 */
export function getMissingScopes(
  userScopes: string[],
  requiredScopes: Scope[]
): Scope[] {
  return requiredScopes.filter(scope => !hasScope(userScopes, scope));
}

/**
 * Check if scope requires legal agreement
 */
export function requiresLegalAgreement(scope: Scope): boolean {
  return LEGAL_SCOPES.includes(scope);
}

/**
 * Check if scope is a partner scope
 */
export function isPartnerScope(scope: Scope): boolean {
  return PARTNER_SCOPES.includes(scope);
}

/**
 * Check if scope is an enterprise scope
 */
export function isEnterpriseScope(scope: Scope): boolean {
  return ENTERPRISE_SCOPES.includes(scope);
}

/**
 * Format scope for display
 */
export function formatScopeDisplay(scope: Scope): {
  action: string;
  resource: string;
  formatted: string;
} {
  const [action, resource] = scope.split(':');

  const actionMap: Record<string, string> = {
    read: 'Okuma',
    write: 'Yazma',
    admin: 'Yönetim',
    partner: 'Partner',
    enterprise: 'Kurumsal',
  };

  const resourceMap: Record<string, string> = {
    medical: 'Medikal AI',
    legal: 'Hukuk AI',
    connectors: 'Bağlantılar',
    read: 'Okuma',
    write: 'Yazma',
    admin: 'Yönetim',
  };

  return {
    action: actionMap[action] || action,
    resource: resourceMap[resource] || resource,
    formatted: `${actionMap[action] || action} - ${resourceMap[resource] || resource}`,
  };
}

/**
 * Get scope category
 */
export function getScopeCategory(scope: Scope): keyof typeof SCOPE_CATEGORIES | null {
  for (const [category, config] of Object.entries(SCOPE_CATEGORIES)) {
    if (config.scopes.includes(scope)) {
      return category as keyof typeof SCOPE_CATEGORIES;
    }
  }
  return null;
}

/**
 * Validate scope string
 */
export function isValidScope(scope: string): scope is Scope {
  return ALL_SCOPES.includes(scope as Scope);
}

/**
 * Get scopes by category
 */
export function getScopesByCategory(
  category: keyof typeof SCOPE_CATEGORIES
): Scope[] {
  return SCOPE_CATEGORIES[category]?.scopes || [];
}

/**
 * Get admin scope for a resource
 */
export function getAdminScope(resource: string): Scope | null {
  const adminScope = `admin:${resource}` as Scope;
  return ALL_SCOPES.includes(adminScope) ? adminScope : null;
}

/**
 * Get write scope for a resource
 */
export function getWriteScope(resource: string): Scope | null {
  const writeScope = `write:${resource}` as Scope;
  return ALL_SCOPES.includes(writeScope) ? writeScope : null;
}

/**
 * Get read scope for a resource
 */
export function getReadScope(resource: string): Scope | null {
  const readScope = `read:${resource}` as Scope;
  return ALL_SCOPES.includes(readScope) ? readScope : null;
}

/**
 * Check if user is admin (has any admin scope)
 */
export function isAdmin(userScopes: string[]): boolean {
  return userScopes.some(scope => scope.includes('admin'));
}

/**
 * Check if user is partner
 */
export function isPartner(userScopes: string[]): boolean {
  return hasAnyScope(userScopes, PARTNER_SCOPES);
}

/**
 * Check if user is enterprise
 */
export function isEnterprise(userScopes: string[]): boolean {
  return hasAnyScope(userScopes, ENTERPRISE_SCOPES);
}

/**
 * Get scope level (read = 1, write = 2, admin = 3)
 */
export function getScopeLevel(scope: Scope): number {
  const action = scope.split(':')[0];

  const levelMap: Record<string, number> = {
    read: 1,
    write: 2,
    admin: 3,
    partner: 2,
    enterprise: 3,
  };

  return levelMap[action] || 0;
}

/**
 * Compare scopes by level
 */
export function compareScopeLevel(scope1: Scope, scope2: Scope): number {
  return getScopeLevel(scope1) - getScopeLevel(scope2);
}

/**
 * Sort scopes by level (ascending)
 */
export function sortScopesByLevel(scopes: Scope[]): Scope[] {
  return [...scopes].sort(compareScopeLevel);
}

/**
 * Get highest scope for a resource
 */
export function getHighestScope(
  userScopes: string[],
  resource: string
): Scope | null {
  const resourceScopes = userScopes.filter(scope =>
    scope.endsWith(`:${resource}`)
  ) as Scope[];

  if (resourceScopes.length === 0) return null;

  return resourceScopes.reduce((highest, current) =>
    getScopeLevel(current) > getScopeLevel(highest) ? current : highest
  );
}

/**
 * Check if user can grant scope (must have admin for that resource)
 */
export function canGrantScope(
  granterScopes: string[],
  scopeToGrant: Scope
): boolean {
  const [, resource] = scopeToGrant.split(':');
  const adminScope = getAdminScope(resource);

  if (!adminScope) return false;

  return hasScope(granterScopes, adminScope);
}

/**
 * RBAC validation error messages
 */
export const RBAC_ERRORS = {
  NO_SCOPES: 'Kullanıcı yetkisi bulunamadı',
  MISSING_SCOPE: 'Gerekli yetki eksik',
  LEGAL_AGREEMENT_REQUIRED: 'Yasal sözleşme onayı gerekli',
  PARTNER_ONLY: 'Bu özellik sadece partnerler için kullanılabilir',
  ENTERPRISE_ONLY: 'Bu özellik sadece kurumsal hesaplar için kullanılabilir',
  ADMIN_ONLY: 'Bu işlem için yönetici yetkisi gerekli',
  INVALID_SCOPE: 'Geçersiz yetki',
} as const;

/**
 * Get RBAC error message
 */
export function getRBACError(
  errorType: keyof typeof RBAC_ERRORS
): string {
  return RBAC_ERRORS[errorType];
}

console.log('✅ RBAC utilities initialized');
