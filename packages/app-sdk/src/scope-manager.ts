// ========================================
// SCOPE MANAGER - PERMISSION CONTROL
// RBAC/ABAC enforcement for actions
// White-Hat: Principle of least privilege
// ========================================

import type { ScopeDefinition, ActionCategory } from './types';

/**
 * Scope Manager
 * Manages OAuth scopes and permissions across connectors
 */
export class ScopeManager {
  private scopes: Map<string, ScopeDefinition> = new Map();

  /**
   * Register a scope definition
   */
  registerScope(scope: ScopeDefinition): void {
    if (this.scopes.has(scope.scope)) {
      console.warn(`Scope "${scope.scope}" already registered - overwriting`);
    }

    this.scopes.set(scope.scope, scope);
  }

  /**
   * Register multiple scopes
   */
  registerScopes(scopes: ScopeDefinition[]): void {
    for (const scope of scopes) {
      this.registerScope(scope);
    }
  }

  /**
   * Check if a scope exists
   */
  hasScope(scope: string): boolean {
    return this.scopes.has(scope);
  }

  /**
   * Get scope definition
   */
  getScope(scope: string): ScopeDefinition | undefined {
    return this.scopes.get(scope);
  }

  /**
   * Get all scopes for a category
   */
  getScopesByCategory(category: ActionCategory): ScopeDefinition[] {
    return Array.from(this.scopes.values()).filter((s) => s.category === category);
  }

  /**
   * Get all dangerous scopes (require explicit consent)
   */
  getDangerousScopes(): ScopeDefinition[] {
    return Array.from(this.scopes.values()).filter((s) => s.dangerous);
  }

  /**
   * Validate granted scopes against required scopes
   * Returns missing scopes
   */
  validateScopes(grantedScopes: string[], requiredScopes: string[]): string[] {
    return requiredScopes.filter((required) => !grantedScopes.includes(required));
  }

  /**
   * Check if user has all required scopes
   */
  hasAllScopes(grantedScopes: string[], requiredScopes: string[]): boolean {
    return this.validateScopes(grantedScopes, requiredScopes).length === 0;
  }

  /**
   * Expand wildcard scopes
   * e.g., "trendyol:*" → ["trendyol:catalog:read", "trendyol:catalog:write", ...]
   */
  expandWildcardScopes(scopes: string[]): string[] {
    const expanded = new Set<string>();

    for (const scope of scopes) {
      if (scope.includes('*')) {
        // Match pattern
        const pattern = scope.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);

        for (const registeredScope of this.scopes.keys()) {
          if (regex.test(registeredScope)) {
            expanded.add(registeredScope);
          }
        }
      } else {
        // Exact scope
        if (this.hasScope(scope)) {
          expanded.add(scope);
        }
      }
    }

    return Array.from(expanded);
  }

  /**
   * Generate scope hierarchy
   * e.g., "trendyol:catalog:write" → ["trendyol:*", "trendyol:catalog:*", "trendyol:catalog:write"]
   */
  getScopeHierarchy(scope: string): string[] {
    const parts = scope.split(':');
    const hierarchy: string[] = [];

    for (let i = 1; i <= parts.length; i++) {
      const partial = parts.slice(0, i).join(':');
      hierarchy.push(i === parts.length ? partial : `${partial}:*`);
    }

    return hierarchy;
  }

  /**
   * Check if scope A implies scope B (hierarchy check)
   * e.g., "trendyol:*" implies "trendyol:catalog:read"
   */
  scopeImplies(scopeA: string, scopeB: string): boolean {
    // Exact match
    if (scopeA === scopeB) {
      return true;
    }

    // Wildcard check
    if (scopeA.includes('*')) {
      const pattern = scopeA.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(scopeB);
    }

    return false;
  }

  /**
   * Get all registered scopes
   */
  getAllScopes(): ScopeDefinition[] {
    return Array.from(this.scopes.values());
  }

  /**
   * Clear all scopes (for testing)
   */
  clear(): void {
    this.scopes.clear();
  }
}

// Singleton instance
export const scopeManager = new ScopeManager();

/**
 * Common scope patterns for vendors
 */
export const COMMON_SCOPES: Record<string, ScopeDefinition[]> = {
  commerce: [
    {
      scope: 'catalog:read',
      description: 'View product catalog',
      category: 'commerce',
      dangerous: false,
    },
    {
      scope: 'catalog:write',
      description: 'Create/update products',
      category: 'commerce',
      dangerous: true,
    },
    {
      scope: 'orders:read',
      description: 'View orders',
      category: 'commerce',
      dangerous: false,
    },
    {
      scope: 'orders:write',
      description: 'Update order status',
      category: 'commerce',
      dangerous: true,
    },
    {
      scope: 'inventory:read',
      description: 'View stock levels',
      category: 'commerce',
      dangerous: false,
    },
    {
      scope: 'inventory:write',
      description: 'Update stock/price',
      category: 'commerce',
      dangerous: true,
    },
  ],
  delivery: [
    {
      scope: 'menu:read',
      description: 'View menu items',
      category: 'delivery',
      dangerous: false,
    },
    {
      scope: 'menu:write',
      description: 'Update menu items',
      category: 'delivery',
      dangerous: true,
    },
    {
      scope: 'orders:read',
      description: 'View delivery orders',
      category: 'delivery',
      dangerous: false,
    },
    {
      scope: 'orders:write',
      description: 'Update order status',
      category: 'delivery',
      dangerous: true,
    },
  ],
  travel: [
    {
      scope: 'search:read',
      description: 'Search travel offers',
      category: 'travel',
      dangerous: false,
    },
    {
      scope: 'booking:write',
      description: 'Create bookings',
      category: 'travel',
      dangerous: true,
    },
  ],
  finance: [
    {
      scope: 'offers:read',
      description: 'View loan offers',
      category: 'finance',
      dangerous: false,
    },
    {
      scope: 'application:write',
      description: 'Submit loan applications',
      category: 'finance',
      dangerous: true,
    },
  ],
};
