/**
 * 🎯 Scope Request Flow
 * Component for requesting missing scopes from admin
 *
 * @module components/rbac/ScopeRequestFlow
 * @white-hat Compliant - Official RBAC API only
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../../store';
import { apiFetch } from '../../lib/api-client';
import { trackAction } from '../../lib/telemetry';
import { cn } from '../../lib/theme-utils';
import type { Scope } from './ScopeGate';

export interface ScopeRequest {
  id: string;
  userId: string;
  scopes: Scope[];
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface ScopeRequestFlowProps {
  /**
   * Scopes to request
   */
  scopes: Scope[];

  /**
   * Success callback
   */
  onSuccess?: () => void;

  /**
   * Cancel callback
   */
  onCancel?: () => void;
}

/**
 * ScopeRequestFlow Component
 */
export default function ScopeRequestFlow({
  scopes,
  onSuccess,
  onCancel,
}: ScopeRequestFlowProps) {
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRequests, setExistingRequests] = useState<ScopeRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const { userId } = useUser();

  // Load existing requests
  useEffect(() => {
    loadExistingRequests();
  }, [userId]);

  const loadExistingRequests = async () => {
    setIsLoadingRequests(true);

    try {
      const result = await apiFetch<{ requests: ScopeRequest[] }>(
        `/api/user/scope-requests?userId=${userId}`,
        { scopes: ['read:connectors'] }
      );

      if (result.success && result.data) {
        // Filter requests for the current scopes
        const relevant = result.data.requests.filter(req =>
          req.scopes.some(s => scopes.includes(s))
        );
        setExistingRequests(relevant);
      }
    } catch (err) {
      console.error('Failed to load scope requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Check if there's a pending request for these scopes
  const hasPendingRequest = existingRequests.some(
    req => req.status === 'pending' && req.scopes.some(s => scopes.includes(s))
  );

  // Submit request
  const handleSubmit = async () => {
    if (justification.trim().length < 50) {
      setError('Gerekçe en az 50 karakter olmalıdır');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiFetch('/api/user/scope-requests', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          scopes,
          justification: justification.trim(),
          requestedAt: new Date().toISOString(),
        }),
      });

      if (result.success) {
        // Track telemetry
        trackAction('scope_request_submitted', {
          scopes: scopes.join(','),
        });

        // Reload requests
        await loadExistingRequests();

        // Success callback
        onSuccess?.();

        // Clear form
        setJustification('');
      } else {
        setError(result.error || 'Talep gönderilemedi');
      }
    } catch (err) {
      console.error('Scope request error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="scope-request-flow">
      {/* Header */}
      <div className="flow-header">
        <h2 className="flow-title">🎯 Yetki Talebi</h2>
        <p className="flow-description">
          Aşağıdaki yetkilere erişim için talepte bulunabilirsiniz.
          Yöneticiniz talebinizi inceleyecek ve onaylayacaktır.
        </p>
      </div>

      {/* Requested Scopes */}
      <div className="requested-scopes">
        <h3 className="section-title">Talep Edilen Yetkiler:</h3>
        <ul className="scopes-list">
          {scopes.map(scope => (
            <li key={scope} className="scope-item">
              <span className="scope-badge">{formatScope(scope)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Existing Requests */}
      {!isLoadingRequests && existingRequests.length > 0 && (
        <div className="existing-requests">
          <h3 className="section-title">Mevcut Talepler:</h3>
          {existingRequests.map(request => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* New Request Form */}
      {!hasPendingRequest && (
        <div className="request-form">
          <h3 className="section-title">Yeni Talep Oluştur:</h3>

          <div className="form-field">
            <label htmlFor="justification">
              Gerekçe * <span className="text-secondary">(Min. 50 karakter)</span>
            </label>
            <textarea
              id="justification"
              className="input"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Bu yetkilere neden ihtiyacınız olduğunu detaylı bir şekilde açıklayın..."
              rows={6}
              maxLength={1000}
            />
            <div className="char-count">
              {justification.length} / 1000 karakter
            </div>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="info-box">
            <strong>📋 İpucu:</strong> Gerekçenizi ne kadar detaylı açıklarsanız,
            talebinizin onaylanma olasılığı o kadar artar. Hangi projelerde kullanacağınızı,
            ne tür verilere erişmeniz gerektiğini belirtin.
          </div>

          <div className="form-actions">
            {onCancel && (
              <button className="btn btn-secondary" onClick={onCancel}>
                İptal
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || justification.trim().length < 50}
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Talebi Gönder 📨'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Request Warning */}
      {hasPendingRequest && (
        <div className="pending-warning">
          <h3>⏳ Bekleyen Talep Var</h3>
          <p>
            Bu yetkiler için zaten beklemede bir talebiniz bulunuyor.
            Yöneticinizin incelemesini bekleyin veya mevcut talebi iptal edip yeni bir talep oluşturun.
          </p>
        </div>
      )}

      <style jsx>{`
        .scope-request-flow {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          max-width: 700px;
        }

        .flow-header {
          margin-bottom: var(--spacing-2xl);
        }

        .flow-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-sm);
        }

        .flow-description {
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .section-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-md);
          color: var(--color-text);
        }

        .requested-scopes {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .scopes-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .scope-item {
          display: inline-block;
        }

        .scope-badge {
          display: inline-block;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--gradient-primary);
          color: #000;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-mono);
        }

        .existing-requests {
          margin-bottom: var(--spacing-2xl);
        }

        .request-form {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
        }

        .form-field {
          margin-bottom: var(--spacing-lg);
        }

        .form-field label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--spacing-sm);
        }

        .char-count {
          text-align: right;
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--spacing-xs);
        }

        .error-message {
          background: var(--color-error-bg);
          border: 1px solid var(--color-error-border);
          color: var(--color-error);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }

        .info-box {
          background: var(--color-info-bg);
          border: 1px solid var(--color-info-border);
          border-left: 4px solid var(--color-info);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
          font-size: var(--font-size-sm);
          color: var(--color-info);
          line-height: var(--line-height-relaxed);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        .pending-warning {
          background: var(--color-warning-bg);
          border: 2px solid var(--color-warning);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          text-align: center;
        }

        .pending-warning h3 {
          font-size: var(--font-size-xl);
          color: var(--color-warning);
          margin-bottom: var(--spacing-md);
        }

        .pending-warning p {
          color: var(--color-warning);
          line-height: var(--line-height-relaxed);
        }
      `}</style>
    </div>
  );
}

/**
 * Request Card Component
 */
function RequestCard({ request }: { request: ScopeRequest }) {
  const statusConfig = {
    pending: {
      label: 'Beklemede',
      icon: '⏳',
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
    },
    approved: {
      label: 'Onaylandı',
      icon: '✅',
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
    },
    rejected: {
      label: 'Reddedildi',
      icon: '❌',
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
    },
  };

  const config = statusConfig[request.status];

  return (
    <div className="request-card">
      <div className="request-header">
        <div className="request-scopes">
          {request.scopes.map(scope => (
            <span key={scope} className="request-scope">
              {formatScope(scope)}
            </span>
          ))}
        </div>
        <div className="request-status" style={{ background: config.bg, color: config.color }}>
          {config.icon} {config.label}
        </div>
      </div>

      <div className="request-justification">
        <strong>Gerekçe:</strong> {request.justification}
      </div>

      <div className="request-meta">
        <span>
          📅 Talep: {new Date(request.requestedAt).toLocaleDateString('tr-TR')}
        </span>
        {request.reviewedAt && (
          <span>
            📋 İnceleme: {new Date(request.reviewedAt).toLocaleDateString('tr-TR')}
          </span>
        )}
      </div>

      {request.reviewNotes && (
        <div className="request-notes">
          <strong>Yönetici Notu:</strong> {request.reviewNotes}
        </div>
      )}

      <style jsx>{`
        .request-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-md);
        }

        .request-card:last-child {
          margin-bottom: 0;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
          gap: var(--spacing-md);
        }

        .request-scopes {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          flex: 1;
        }

        .request-scope {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          font-family: var(--font-mono);
        }

        .request-status {
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
        }

        .request-justification {
          padding: var(--spacing-md);
          background: var(--color-background);
          border-left: 2px solid var(--color-primary);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
        }

        .request-meta {
          display: flex;
          gap: var(--spacing-lg);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        .request-notes {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-info-bg);
          border: 1px solid var(--color-info-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          color: var(--color-info);
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

  return `${actionMap[action] || action}:${resourceMap[resource] || resource}`;
}

console.log('✅ ScopeRequestFlow component initialized');
