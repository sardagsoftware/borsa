/**
 * 🤝 Partner Application Form
 * Multi-step form for partner program application
 *
 * @module components/rbac/PartnerApplicationForm
 * @white-hat Compliant - Official partner API only
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../../store';
import { apiFetch } from '../../lib/api-client';
import { trackAction } from '../../lib/telemetry';
import { cn } from '../../lib/theme-utils';

export type PartnerType = 'integration' | 'reseller' | 'technology' | 'consulting';

export interface PartnerApplicationData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;

  // Step 2: Company Info
  companyName: string;
  companyWebsite: string;
  companySize: string;
  companyIndustry: string;
  companyCountry: string;

  // Step 3: Partnership Details
  partnerType: PartnerType;
  expectedRevenue: string;
  customerBase: string;
  technicalCapability: string;
  motivation: string;

  // KVKK Consent
  kvkkConsent: boolean;
  marketingConsent: boolean;
}

const INITIAL_DATA: PartnerApplicationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  companyName: '',
  companyWebsite: '',
  companySize: '',
  companyIndustry: '',
  companyCountry: 'TR',
  partnerType: 'integration',
  expectedRevenue: '',
  customerBase: '',
  technicalCapability: '',
  motivation: '',
  kvkkConsent: false,
  marketingConsent: false,
};

export interface PartnerApplicationFormProps {
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
 * PartnerApplicationForm Component
 */
export default function PartnerApplicationForm({
  onSuccess,
  onCancel,
}: PartnerApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PartnerApplicationData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerApplicationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { userId, email: userEmail } = useUser();

  const totalSteps = 3;

  // Load draft from localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem('partner-application-draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData({ ...INITIAL_DATA, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('partner-application-draft', JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  }, [formData]);

  // Pre-fill email from user
  useEffect(() => {
    if (userEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail, formData.email]);

  // Update field
  const updateField = (field: keyof PartnerApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate step
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof PartnerApplicationData, string>> = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Ad gerekli';
      if (!formData.lastName.trim()) newErrors.lastName = 'Soyad gerekli';
      if (!formData.email.trim()) newErrors.email = 'E-posta gerekli';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta girin';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Telefon gerekli';
      if (!formData.position.trim()) newErrors.position = 'Pozisyon gerekli';
    }

    if (currentStep === 2) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Şirket adı gerekli';
      if (!formData.companyWebsite.trim()) newErrors.companyWebsite = 'Website gerekli';
      if (!formData.companySize) newErrors.companySize = 'Şirket büyüklüğü seçin';
      if (!formData.companyIndustry.trim()) newErrors.companyIndustry = 'Sektör gerekli';
    }

    if (currentStep === 3) {
      if (!formData.expectedRevenue) newErrors.expectedRevenue = 'Tahmini gelir seçin';
      if (!formData.customerBase.trim()) newErrors.customerBase = 'Müşteri tabanı gerekli';
      if (!formData.technicalCapability.trim()) {
        newErrors.technicalCapability = 'Teknik yetenek gerekli';
      }
      if (!formData.motivation.trim()) newErrors.motivation = 'Motivasyon gerekli';
      if (!formData.kvkkConsent) newErrors.kvkkConsent = 'KVKK onayı gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      trackAction('partner_form_step_complete', { step });
    }
  };

  // Previous step
  const handlePrevious = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await apiFetch('/api/partner/apply', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          ...formData,
          appliedAt: new Date().toISOString(),
        }),
      });

      if (result.success) {
        // Clear draft
        localStorage.removeItem('partner-application-draft');

        // Track success
        trackAction('partner_application_submitted', {
          partnerType: formData.partnerType,
        });

        // Success callback
        onSuccess?.();
      } else {
        setSubmitError(result.error || 'Başvuru gönderilemedi');
      }
    } catch (error) {
      console.error('Partner application error:', error);
      setSubmitError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="partner-application-form">
      {/* Progress Indicator */}
      <div className="form-progress">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={cn(
              'progress-step',
              s === step && 'progress-step-active',
              s < step && 'progress-step-completed'
            )}
          >
            <div className="progress-number">
              {s < step ? '✓' : s}
            </div>
            <div className="progress-label">
              {s === 1 && 'Temel Bilgiler'}
              {s === 2 && 'Şirket Bilgileri'}
              {s === 3 && 'Detaylar'}
            </div>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="form-step">
            <h2 className="step-title">Temel Bilgiler</h2>
            <p className="step-description">
              Başvuru yapan kişinin bilgileri
            </p>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="firstName">Ad *</label>
                <input
                  id="firstName"
                  type="text"
                  className={cn('input', errors.firstName && 'input-error')}
                  value={formData.firstName}
                  onChange={e => updateField('firstName', e.target.value)}
                  placeholder="Adınız"
                />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="lastName">Soyad *</label>
                <input
                  id="lastName"
                  type="text"
                  className={cn('input', errors.lastName && 'input-error')}
                  value={formData.lastName}
                  onChange={e => updateField('lastName', e.target.value)}
                  placeholder="Soyadınız"
                />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="email">E-posta *</label>
              <input
                id="email"
                type="email"
                className={cn('input', errors.email && 'input-error')}
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="ornek@sirket.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="phone">Telefon *</label>
                <input
                  id="phone"
                  type="tel"
                  className={cn('input', errors.phone && 'input-error')}
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+90 xxx xxx xx xx"
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="position">Pozisyon *</label>
                <input
                  id="position"
                  type="text"
                  className={cn('input', errors.position && 'input-error')}
                  value={formData.position}
                  onChange={e => updateField('position', e.target.value)}
                  placeholder="CTO, CEO, Geliştirici, vs."
                />
                {errors.position && <span className="field-error">{errors.position}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Info */}
        {step === 2 && (
          <div className="form-step">
            <h2 className="step-title">Şirket Bilgileri</h2>
            <p className="step-description">
              Şirket ve organizasyon detayları
            </p>

            <div className="form-field">
              <label htmlFor="companyName">Şirket Adı *</label>
              <input
                id="companyName"
                type="text"
                className={cn('input', errors.companyName && 'input-error')}
                value={formData.companyName}
                onChange={e => updateField('companyName', e.target.value)}
                placeholder="Şirketinizin adı"
              />
              {errors.companyName && <span className="field-error">{errors.companyName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="companyWebsite">Website *</label>
              <input
                id="companyWebsite"
                type="url"
                className={cn('input', errors.companyWebsite && 'input-error')}
                value={formData.companyWebsite}
                onChange={e => updateField('companyWebsite', e.target.value)}
                placeholder="https://sirketiniz.com"
              />
              {errors.companyWebsite && <span className="field-error">{errors.companyWebsite}</span>}
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="companySize">Şirket Büyüklüğü *</label>
                <select
                  id="companySize"
                  className={cn('input', errors.companySize && 'input-error')}
                  value={formData.companySize}
                  onChange={e => updateField('companySize', e.target.value)}
                >
                  <option value="">Seçiniz</option>
                  <option value="1-10">1-10 çalışan</option>
                  <option value="11-50">11-50 çalışan</option>
                  <option value="51-200">51-200 çalışan</option>
                  <option value="201-500">201-500 çalışan</option>
                  <option value="501+">501+ çalışan</option>
                </select>
                {errors.companySize && <span className="field-error">{errors.companySize}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="companyCountry">Ülke *</label>
                <select
                  id="companyCountry"
                  className="input"
                  value={formData.companyCountry}
                  onChange={e => updateField('companyCountry', e.target.value)}
                >
                  <option value="TR">Türkiye</option>
                  <option value="US">ABD</option>
                  <option value="GB">İngiltere</option>
                  <option value="DE">Almanya</option>
                  <option value="FR">Fransa</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="companyIndustry">Sektör *</label>
              <input
                id="companyIndustry"
                type="text"
                className={cn('input', errors.companyIndustry && 'input-error')}
                value={formData.companyIndustry}
                onChange={e => updateField('companyIndustry', e.target.value)}
                placeholder="Teknoloji, Sağlık, Finans, vs."
              />
              {errors.companyIndustry && <span className="field-error">{errors.companyIndustry}</span>}
            </div>
          </div>
        )}

        {/* Step 3: Partnership Details */}
        {step === 3 && (
          <div className="form-step">
            <h2 className="step-title">Ortaklık Detayları</h2>
            <p className="step-description">
              Ortaklık türü ve beklentiler
            </p>

            <div className="form-field">
              <label htmlFor="partnerType">Ortaklık Türü *</label>
              <select
                id="partnerType"
                className="input"
                value={formData.partnerType}
                onChange={e => updateField('partnerType', e.target.value as PartnerType)}
              >
                <option value="integration">Integration Partner - API entegrasyonu</option>
                <option value="reseller">Reseller Partner - Bayi satışı</option>
                <option value="technology">Technology Partner - Teknik işbirliği</option>
                <option value="consulting">Consulting Partner - Danışmanlık</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="expectedRevenue">Tahmini Yıllık Gelir *</label>
              <select
                id="expectedRevenue"
                className={cn('input', errors.expectedRevenue && 'input-error')}
                value={formData.expectedRevenue}
                onChange={e => updateField('expectedRevenue', e.target.value)}
              >
                <option value="">Seçiniz</option>
                <option value="<50k">$50K altı</option>
                <option value="50k-100k">$50K - $100K</option>
                <option value="100k-500k">$100K - $500K</option>
                <option value="500k-1m">$500K - $1M</option>
                <option value=">1m">$1M üzeri</option>
              </select>
              {errors.expectedRevenue && <span className="field-error">{errors.expectedRevenue}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="customerBase">Müşteri Tabanı *</label>
              <textarea
                id="customerBase"
                className={cn('input', errors.customerBase && 'input-error')}
                value={formData.customerBase}
                onChange={e => updateField('customerBase', e.target.value)}
                placeholder="Mevcut müşteri sayınız ve hedef kitleniz (min. 50 karakter)"
                rows={3}
              />
              {errors.customerBase && <span className="field-error">{errors.customerBase}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="technicalCapability">Teknik Yetenek *</label>
              <textarea
                id="technicalCapability"
                className={cn('input', errors.technicalCapability && 'input-error')}
                value={formData.technicalCapability}
                onChange={e => updateField('technicalCapability', e.target.value)}
                placeholder="Teknik ekibinizin yetenekleri ve deneyimi (min. 50 karakter)"
                rows={3}
              />
              {errors.technicalCapability && (
                <span className="field-error">{errors.technicalCapability}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="motivation">Neden Partner Olmak İstiyorsunuz? *</label>
              <textarea
                id="motivation"
                className={cn('input', errors.motivation && 'input-error')}
                value={formData.motivation}
                onChange={e => updateField('motivation', e.target.value)}
                placeholder="Motivasyonunuz ve iş planınız (min. 100 karakter)"
                rows={4}
              />
              {errors.motivation && <span className="field-error">{errors.motivation}</span>}
            </div>

            {/* KVKK Consent */}
            <div className="consent-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.kvkkConsent}
                  onChange={e => updateField('kvkkConsent', e.target.checked)}
                />
                <span>
                  <strong>KVKK Onayı *:</strong> Kişisel verilerimin{' '}
                  <a href="/privacy" target="_blank">KVKK Aydınlatma Metni</a>{' '}
                  kapsamında işlenmesini kabul ediyorum.
                </span>
              </label>
              {errors.kvkkConsent && <span className="field-error">{errors.kvkkConsent}</span>}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={e => updateField('marketingConsent', e.target.checked)}
                />
                <span>
                  Partner programı, güncellemeler ve pazarlama içerikleri hakkında
                  bilgilendirilmek istiyorum.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="submit-error">
          ❌ {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            İptal
          </button>
        )}

        {step > 1 && (
          <button className="btn btn-secondary" onClick={handlePrevious}>
            ← Geri
          </button>
        )}

        <div style={{ flex: 1 }} />

        {step < totalSteps ? (
          <button className="btn btn-primary" onClick={handleNext}>
            İleri →
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder 🚀'}
          </button>
        )}
      </div>

      <style jsx>{`
        .partner-application-form {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          max-width: 800px;
          margin: 0 auto;
        }

        .form-progress {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-3xl);
          position: relative;
        }

        .form-progress::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: var(--color-border);
          z-index: 0;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .progress-number {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--color-background);
          border: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
          color: var(--color-text-secondary);
          transition: all var(--transition-base);
        }

        .progress-step-active .progress-number {
          background: var(--gradient-primary);
          border-color: var(--color-primary);
          color: #000;
          box-shadow: var(--shadow-gold);
        }

        .progress-step-completed .progress-number {
          background: var(--color-success);
          border-color: var(--color-success);
          color: #fff;
        }

        .progress-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .form-content {
          margin-bottom: var(--spacing-2xl);
        }

        .form-step {
          animation: fadeIn 0.3s ease-in-out;
        }

        .step-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-sm);
        }

        .step-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .form-field {
          margin-bottom: var(--spacing-lg);
        }

        .form-field label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .field-error {
          display: block;
          color: var(--color-error);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
        }

        .consent-section {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-top: var(--spacing-xl);
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          cursor: pointer;
        }

        .checkbox-label:last-child {
          margin-bottom: 0;
        }

        .checkbox-label input[type="checkbox"] {
          margin-top: 0.25rem;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-label span {
          flex: 1;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .checkbox-label a {
          color: var(--color-primary);
          text-decoration: none;
        }

        .checkbox-label a:hover {
          text-decoration: underline;
        }

        .submit-error {
          background: var(--color-error-bg);
          border: 1px solid var(--color-error-border);
          color: var(--color-error);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
          padding-top: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

console.log('✅ PartnerApplicationForm component initialized');
