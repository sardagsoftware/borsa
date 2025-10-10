/**
 * ⚖️ Legal Gate Modal
 * Modal for legal agreement before accessing legal AI features
 *
 * @module components/rbac/LegalGateModal
 * @white-hat Compliant - KVKK/GDPR compliant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../store';
import { apiFetch } from '../../lib/api-client';
import { trackAction } from '../../lib/telemetry';
import { cn } from '../../lib/theme-utils';
import type { Scope } from './ScopeGate';

export interface LegalGateModalProps {
  /**
   * Modal visibility
   */
  isOpen: boolean;

  /**
   * Close callback
   */
  onClose: () => void;

  /**
   * Success callback after agreement
   */
  onAgree: () => void;

  /**
   * Scopes requiring legal agreement
   */
  scopes: Scope[];
}

/**
 * LegalGateModal Component
 */
export default function LegalGateModal({
  isOpen,
  onClose,
  onAgree,
  scopes,
}: LegalGateModalProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, setUser } = useUser();

  const modalRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasRead(false);
      setHasAccepted(false);
      setError(null);
    }
  }, [isOpen]);

  // Check if user scrolled to bottom of agreement
  const handleScroll = () => {
    if (!agreementRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = agreementRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (scrolledToBottom && !hasRead) {
      setHasRead(true);
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', trapFocus);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  // Handle agreement submission
  const handleAgree = async () => {
    if (!hasAccepted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call API to save legal agreement
      const result = await apiFetch('/api/user/legal-agreement', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          scopes,
          acceptedAt: new Date().toISOString(),
          ipAddress: '0.0.0.0', // Backend will capture real IP
          userAgent: navigator.userAgent,
        }),
      });

      if (result.success) {
        // Update user store with new legal agreements
        setUser({
          legalAgreements: [...(result.data?.legalAgreements || []), ...scopes],
        });

        // Track telemetry
        trackAction('legal_agreement_accepted', {
          scopes: scopes.join(','),
        });

        // Success callback
        onAgree();
        onClose();
      } else {
        setError(result.error || 'Yasal sözleşme kaydedilemedi');
      }
    } catch (err) {
      console.error('Legal agreement error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="legal-gate-modal-overlay" onClick={onClose}>
      <div
        className="legal-gate-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="legal-modal-title" className="modal-title">
            ⚖️ Lydian Hukuk AI Kullanım Sözleşmesi
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Kapat"
            tabIndex={0}
          >
            ✕
          </button>
        </div>

        {/* Warning Banner */}
        <div className="warning-banner">
          <strong>⚠️ Önemli Uyarı:</strong> Bu sistem sadece bilgilendirme amaçlıdır.
          Hukuki danışmanlık yerine geçmez. Resmi hukuki işlemler için bir avukat ile çalışın.
        </div>

        {/* Agreement Content */}
        <div
          className="modal-content"
          ref={agreementRef}
          onScroll={handleScroll}
        >
          <section className="agreement-section">
            <h3>1. Hizmet Kapsamı</h3>
            <p>
              Lydian Hukuk AI, yapay zeka destekli hukuki bilgi sağlama hizmetidir.
              Bu hizmet:
            </p>
            <ul>
              <li>Hukuki konularda genel bilgilendirme yapar</li>
              <li>Mevzuat ve içtihat araması sağlar</li>
              <li>Taslak dökümanlar oluşturabilir</li>
              <li>Hukuki kavramları açıklar</li>
            </ul>
            <p>
              <strong>Ancak:</strong>
            </p>
            <ul>
              <li>Avukatlık hizmeti sunmaz</li>
              <li>Mahkemede temsil yetkisi vermez</li>
              <li>Hukuki danışmanlık yerine geçmez</li>
              <li>Kişiye özel hukuki tavsiye niteliği taşımaz</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>2. Sorumluluk Reddi</h3>
            <p>
              Lydian AI, sağlanan bilgilerin doğruluğu, güncelliği veya
              eksiksizliği konusunda garanti vermez. Kullanıcı:
            </p>
            <ul>
              <li>AI'dan alınan bilgileri kendi sorumluluğunda kullanır</li>
              <li>Önemli hukuki konularda profesyonel danışmanlık alır</li>
              <li>AI tarafından üretilen dökümanları avukata kontrol ettirir</li>
              <li>Mahkeme süreçlerinde avukat görevlendirir</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>3. KVKK ve Gizlilik</h3>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında:
            </p>
            <ul>
              <li>Hukuki sorularınız şifrelenmiş olarak saklanır</li>
              <li>Kişisel verileriniz anonimleştirilir</li>
              <li>Hassas bilgiler 3. taraflarla paylaşılmaz</li>
              <li>Verileriniz yalnızca hizmet iyileştirme için kullanılır</li>
              <li>İstediğiniz zaman verilerinizi silebilirsiniz</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>4. Kullanım Kısıtlamaları</h3>
            <p>Lydian Hukuk AI'ı şu amaçlarla KULLANAMAZSINIZ:</p>
            <ul>
              <li>Mahkeme süreçlerinde avukat yerine geçirme</li>
              <li>Resmi hukuki işlemler için yetkili belge oluşturma</li>
              <li>Yasa dışı faaliyetler için bilgi toplama</li>
              <li>Mevzuatı manipüle etme veya kötüye kullanma</li>
              <li>Toplu hukuki işlem otomasyonu (spam)</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>5. Veri Güvenliği</h3>
            <p>Güvenlik önlemlerimiz:</p>
            <ul>
              <li>TLS 1.3 şifreleme (tüm iletişim)</li>
              <li>AES-256 veri şifreleme (depolama)</li>
              <li>Rate limiting (kötüye kullanım önleme)</li>
              <li>Audit logging (denetim kaydı)</li>
              <li>Düzenli güvenlik testleri</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>6. Fesih ve İptal</h3>
            <p>
              Bu sözleşmeyi istediğiniz zaman feshedebilirsiniz.
              Fesih durumunda:
            </p>
            <ul>
              <li>Hukuk AI özelliklerine erişiminiz sonlanır</li>
              <li>Mevcut verileriniz silinir (30 gün içinde)</li>
              <li>Yeni sorgulama yapamazsınız</li>
              <li>Geçmiş kayıtlara erişim kalkar</li>
            </ul>
          </section>

          <section className="agreement-section">
            <h3>7. Değişiklik Hakkı</h3>
            <p>
              Lydian AI, bu sözleşmeyi değiştirme hakkını saklı tutar.
              Değişiklikler e-posta ile bildirilir ve 15 gün sonra yürürlüğe girer.
            </p>
          </section>

          <div className="agreement-footer">
            <p className="text-secondary">
              <strong>Son Güncelleme:</strong> 2025-10-10
            </p>
            <p className="text-secondary">
              <strong>Versiyon:</strong> 1.0.0
            </p>
          </div>
        </div>

        {/* Scroll Hint */}
        {!hasRead && (
          <div className="scroll-hint">
            <p>⬇️ Devam etmek için sözleşmeyi sonuna kadar okuyun</p>
          </div>
        )}

        {/* Acceptance Checkbox */}
        <div className={cn('modal-footer', !hasRead && 'footer-disabled')}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              disabled={!hasRead}
              aria-label="Sözleşmeyi kabul ediyorum"
            />
            <span>
              Yukarıdaki kullanım sözleşmesini okudum, anladım ve kabul ediyorum.
              Bu hizmetin hukuki danışmanlık yerine geçmediğini biliyorum.
            </span>
          </label>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAgree}
              disabled={!hasAccepted || isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kabul Et ve Devam Et'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .legal-gate-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          padding: var(--spacing-lg);
          overflow-y: auto;
        }

        .legal-gate-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-xl);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--spacing-sm);
          color: var(--color-text-secondary);
          transition: all var(--transition-base);
          border-radius: var(--radius-md);
        }

        .modal-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }

        .warning-banner {
          background: var(--color-warning-bg);
          border: 1px solid var(--color-warning-border);
          border-left: 4px solid var(--color-warning);
          padding: var(--spacing-lg);
          margin: var(--spacing-lg);
          border-radius: var(--radius-md);
          color: var(--color-warning);
          font-size: var(--font-size-sm);
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .agreement-section {
          margin-bottom: var(--spacing-2xl);
        }

        .agreement-section h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
          margin-bottom: var(--spacing-md);
        }

        .agreement-section p {
          margin-bottom: var(--spacing-md);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
        }

        .agreement-section ul {
          margin-left: var(--spacing-xl);
          margin-bottom: var(--spacing-md);
        }

        .agreement-section li {
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .agreement-footer {
          padding-top: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-xl);
        }

        .scroll-hint {
          padding: var(--spacing-md);
          background: var(--color-info-bg);
          border-top: 1px solid var(--color-info-border);
          text-align: center;
        }

        .scroll-hint p {
          margin: 0;
          color: var(--color-info);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .modal-footer {
          padding: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
        }

        .modal-footer.footer-disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin-top: 0.25rem;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-label span {
          flex: 1;
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
        }

        .error-message {
          background: var(--color-error-bg);
          border: 1px solid var(--color-error-border);
          color: var(--color-error);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
          font-size: var(--font-size-sm);
        }

        .modal-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        /* Scrollbar styling */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: var(--color-surface);
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: var(--radius-full);
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

console.log('✅ LegalGateModal component initialized');
