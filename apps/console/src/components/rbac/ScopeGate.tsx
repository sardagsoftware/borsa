/**
 * 🔐 ScopeGate Component
 * Wrapper component for scope-based access control
 *
 * @module components/rbac/ScopeGate
 * @white-hat Compliant - Only uses official RBAC API
 */

'use client';

import React, { ReactNode } from 'react';
import { useUser } from '../../store';
import { cn } from '../../lib/theme-utils';

export type Scope =
  // Medical AI scopes
  | 'read:medical'
  | 'write:medical'
  | 'admin:medical'
  // Legal AI scopes (requires legal agreement)
  | 'read:legal'
  | 'write:legal'
  | 'admin:legal'
  // Connector scopes
  | 'read:connectors'
  | 'write:connectors'
  | 'admin:connectors'
  // Partner scopes
  | 'partner:read'
  | 'partner:write'
  | 'partner:admin'
  // Enterprise scopes
  | 'enterprise:read'
  | 'enterprise:write'
  | 'enterprise:admin';

export interface ScopeGateProps {
  /**
   * Required scopes (user must have at least one)
   */
  scopes: Scope[];

  /**
   * Logic mode
   * - 'or': User needs ANY of the scopes (default)
   * - 'and': User needs ALL of the scopes
   */
  mode?: 'or' | 'and';

  /**
   * Children to render if access granted
   */
  children: ReactNode;

  /**
   * Custom fallback UI when access denied
   */
  fallback?: ReactNode;

  /**
   * Show default fallback UI
   */
  showFallback?: boolean;

  /**
   * Callback when access denied
   */
  onAccessDenied?: (missingScopes: Scope[]) => void;

  /**
   * For legal scopes, trigger legal gate modal
   */
  requireLegalAgreement?: boolean;
}

/**
 * Check if user has required scopes
 */
function hasScopes(
  userScopes: string[],
  requiredScopes: Scope[],
  mode: 'or' | 'and'
): boolean {
  if (requiredScopes.length === 0) return true;

  if (mode === 'or') {
    // User needs ANY of the required scopes
    return requiredScopes.some(scope => userScopes.includes(scope));
  } else {
    // User needs ALL of the required scopes
    return requiredScopes.every(scope => userScopes.includes(scope));
  }
}

/**
 * Get missing scopes
 */
function getMissingScopes(
  userScopes: string[],
  requiredScopes: Scope[]
): Scope[] {
  return requiredScopes.filter(scope => !userScopes.includes(scope));
}

/**
 * ScopeGate Component
 */
export default function ScopeGate({
  scopes,
  mode = 'or',
  children,
  fallback,
  showFallback = true,
  onAccessDenied,
  requireLegalAgreement = false,
}: ScopeGateProps) {
  const { scopes: userScopes = [], legalAgreements = [] } = useUser();

  // Check if user has required scopes
  const hasAccess = hasScopes(userScopes, scopes, mode);

  // If access granted, render children
  if (hasAccess) {
    // For legal scopes, check legal agreement
    if (requireLegalAgreement) {
      const legalScopes = scopes.filter(s => s.includes('legal'));
      const hasLegalAgreement = legalScopes.every(scope =>
        legalAgreements.includes(scope)
      );

      // If no legal agreement, show legal gate modal
      if (!hasLegalAgreement) {
        return (
          <div className="scope-gate scope-gate-legal">
            <LegalGateRequired
              scopes={legalScopes}
              onAgree={() => {
                // After agreement, re-render
                window.location.reload();
              }}
            />
          </div>
        );
      }
    }

    return <>{children}</>;
  }

  // Access denied - calculate missing scopes
  const missingScopes = getMissingScopes(userScopes, scopes);

  // Trigger callback
  if (onAccessDenied) {
    onAccessDenied(missingScopes);
  }

  // Render custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render default fallback
  if (showFallback) {
    return (
      <AccessDenied
        requiredScopes={scopes}
        missingScopes={missingScopes}
        mode={mode}
      />
    );
  }

  // No fallback - render nothing
  return null;
}

/**
 * Default Access Denied UI
 */
function AccessDenied({
  requiredScopes,
  missingScopes,
  mode,
}: {
  requiredScopes: Scope[];
  missingScopes: Scope[];
  mode: 'or' | 'and';
}) {
  return (
    <div className="scope-gate-denied">
      <div className="denied-icon">🔒</div>
      <h3 className="denied-title">Erişim Yetkiniz Yok</h3>
      <p className="denied-description">
        Bu özelliği kullanmak için{' '}
        {mode === 'or' ? 'aşağıdaki yetkilerden en az birine' : 'tüm aşağıdaki yetkilere'}{' '}
        sahip olmanız gerekiyor.
      </p>

      <div className="denied-scopes">
        <h4>Gerekli Yetkiler:</h4>
        <ul>
          {requiredScopes.map(scope => (
            <li
              key={scope}
              className={cn(
                'scope-item',
                missingScopes.includes(scope) && 'scope-missing'
              )}
            >
              {missingScopes.includes(scope) ? '❌' : '✅'} {formatScope(scope)}
            </li>
          ))}
        </ul>
      </div>

      <div className="denied-actions">
        <p className="text-secondary">
          Erişim için lütfen yöneticinizle iletişime geçin veya{' '}
          <a href="/settings#scopes" className="text-primary">
            ayarlardan
          </a>{' '}
          yetki talep edin.
        </p>
      </div>

      <style jsx>{`
        .scope-gate-denied {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-3xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          text-align: center;
          min-height: 300px;
        }

        .denied-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
          opacity: 0.7;
        }

        .denied-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text);
          margin-bottom: var(--spacing-md);
        }

        .denied-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
          max-width: 500px;
        }

        .denied-scopes {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          width: 100%;
          max-width: 400px;
        }

        .denied-scopes h4 {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .denied-scopes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .scope-item {
          padding: var(--spacing-sm) var(--spacing-md);
          margin-bottom: var(--spacing-xs);
          background: var(--color-surface);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-family: var(--font-mono);
          text-align: left;
        }

        .scope-item.scope-missing {
          color: var(--color-error);
          border-left: 2px solid var(--color-error);
        }

        .denied-actions {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .denied-actions a {
          color: var(--color-primary);
          text-decoration: none;
          transition: opacity var(--transition-base);
        }

        .denied-actions a:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

/**
 * Legal Gate Required UI
 */
function LegalGateRequired({
  scopes,
  onAgree,
}: {
  scopes: Scope[];
  onAgree: () => void;
}) {
  return (
    <div className="legal-gate-required">
      <div className="legal-icon">⚖️</div>
      <h3 className="legal-title">Yasal Onay Gerekli</h3>
      <p className="legal-description">
        Hukuk AI özelliklerini kullanmak için öncelikle kullanım koşullarını kabul etmeniz gerekiyor.
      </p>

      <div className="legal-warning">
        <p>
          <strong>⚠️ Önemli Uyarı:</strong> Bu sistem sadece bilgilendirme amaçlıdır.
          Hukuki danışmanlık yerine geçmez. Resmi hukuki işlemler için bir avukat ile çalışın.
        </p>
      </div>

      <button className="btn btn-primary" onClick={onAgree}>
        Yasal Sözleşmeyi Görüntüle ve Kabul Et
      </button>

      <style jsx>{`
        .legal-gate-required {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-3xl);
          background: var(--color-surface);
          border: 2px solid var(--color-warning);
          border-radius: var(--radius-xl);
          text-align: center;
        }

        .legal-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .legal-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-md);
        }

        .legal-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
          max-width: 500px;
        }

        .legal-warning {
          background: var(--color-warning-bg);
          border: 1px solid var(--color-warning-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          max-width: 600px;
        }

        .legal-warning p {
          color: var(--color-warning);
          font-size: var(--font-size-sm);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * Format scope for display
 */
function formatScope(scope: Scope): string {
  const parts = scope.split(':');
  const action = parts[0];
  const resource = parts[1];

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

  return `${actionMap[action] || action} - ${resourceMap[resource] || resource}`;
}

/**
 * Hook to check scopes programmatically
 */
export function useHasScopes(
  scopes: Scope[],
  mode: 'or' | 'and' = 'or'
): boolean {
  const { scopes: userScopes = [] } = useUser();
  return hasScopes(userScopes, scopes, mode);
}

/**
 * Hook to get missing scopes
 */
export function useMissingScopes(scopes: Scope[]): Scope[] {
  const { scopes: userScopes = [] } = useUser();
  return getMissingScopes(userScopes, scopes);
}

console.log('✅ ScopeGate component initialized');
