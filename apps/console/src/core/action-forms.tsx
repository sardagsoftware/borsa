/**
 * 📝 Action Forms - Parameter Collection with Zod Validation
 * Auto-fill from intent params, short forms for missing required fields
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Intent } from '../intent/engine';
import { getActionMetadata } from './tool-registry';

/**
 * Zod Schemas for Action Parameters
 */
const ShipmentTrackSchema = z.object({
  vendor: z.enum(['hepsijet', 'aras', 'yurtici', 'mng', 'surat', 'ups']),
  trackingNo: z.string().min(7, 'Tracking number must be at least 7 characters')
});

const LoanCompareSchema = z.object({
  amount: z.number().min(1000, 'Minimum loan amount: 1,000 TL'),
  term: z.number().min(1).max(360, 'Term must be between 1-360 months'),
  loanType: z.enum(['consumer', 'mortgage', 'auto']).optional()
});

const TripSearchSchema = z.object({
  place: z.string().min(2, 'Destination required'),
  days: z.number().min(1).max(365, 'Days must be between 1-365'),
  pax: z.number().min(1).max(20, 'Guests must be between 1-20'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional()
});

const EconomyOptimizeSchema = z.object({
  marginTarget: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
  competitorData: z.any().optional()
});

const ESGCalculateSchema = z.object({
  orderId: z.string().optional(),
  shipmentId: z.string().optional(),
  distance: z.number().min(0).optional(),
  transportMode: z.enum(['road', 'air', 'sea', 'rail']).optional()
});

const ProductSyncSchema = z.object({
  vendor: z.enum(['trendyol', 'hepsiburada', 'amazon', 'ebay']),
  sku: z.string().optional(),
  products: z.array(z.any()).optional()
});

const MenuUpdateSchema = z.object({
  vendor: z.enum(['yemeksepeti', 'getir', 'trendyol_yemek']),
  restaurantId: z.string().optional(),
  menuItems: z.array(z.any()).optional()
});

/**
 * Schema map by action
 */
const ActionSchemas: Record<string, z.ZodSchema> = {
  'shipment.track': ShipmentTrackSchema,
  'loan.compare': LoanCompareSchema,
  'trip.search': TripSearchSchema,
  'economy.optimize': EconomyOptimizeSchema,
  'esg.calculate-carbon': ESGCalculateSchema,
  'product.sync': ProductSyncSchema,
  'menu.update': MenuUpdateSchema
};

/**
 * Action Form Component
 */
export interface ActionFormProps {
  intent: Intent;
  locale?: string;
  onSubmit: (params: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ActionForm({
  intent,
  locale = 'tr',
  onSubmit,
  onCancel,
  className = ''
}: ActionFormProps) {
  const [params, setParams] = useState<Record<string, any>>(intent.params || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metadata = getActionMetadata(intent.action);
  const schema = ActionSchemas[intent.action];

  /**
   * Validate and submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schema) {
      // No schema = no validation required
      await executeSubmit(params);
      return;
    }

    try {
      // Validate with Zod
      const validated = schema.parse(params);
      await executeSubmit(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const executeSubmit = async (validatedParams: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(validatedParams);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Update field value
   */
  const updateField = (field: string, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  /**
   * Render form fields based on action type
   */
  const renderFields = () => {
    switch (intent.action) {
      case 'shipment.track':
        return <ShipmentTrackFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'loan.compare':
        return <LoanCompareFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'trip.search':
        return <TripSearchFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'economy.optimize':
        return <EconomyOptimizeFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'esg.calculate-carbon':
        return <ESGCalculateFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'product.sync':
        return <ProductSyncFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      case 'menu.update':
        return <MenuUpdateFields params={params} errors={errors} onChange={updateField} locale={locale} />;

      default:
        return <GenericFields params={params} metadata={metadata} errors={errors} onChange={updateField} locale={locale} />;
    }
  };

  const isRTL = locale === 'ar';

  return (
    <form
      className={`action-form ${isRTL ? 'rtl' : ''} ${className}`}
      onSubmit={handleSubmit}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="form-header">
        <span className="form-icon">{metadata?.icon || '🔧'}</span>
        <h3 className="form-title">{intent.reason || intent.action}</h3>
      </div>

      <div className="form-fields">{renderFields()}</div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" />
              {locale === 'tr' ? 'Çalıştırılıyor...' : 'Executing...'}
            </>
          ) : (
            <>{locale === 'tr' ? 'Çalıştır' : 'Execute'}</>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {locale === 'tr' ? 'İptal' : 'Cancel'}
          </button>
        )}
      </div>

      <style jsx>{`
        .action-form {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .form-icon {
          font-size: 24px;
        }

        .form-title {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .rtl .form-actions {
          justify-content: flex-start;
        }

        .btn-submit,
        .btn-cancel {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column-reverse;
          }

          .btn-submit,
          .btn-cancel {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </form>
  );
}

/**
 * Form Field Components
 */
interface FieldProps {
  params: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  locale: string;
}

function ShipmentTrackFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Kargo Firması' : 'Shipping Provider'}
        name="vendor"
        type="select"
        value={params.vendor || ''}
        error={errors.vendor}
        onChange={(value) => onChange('vendor', value)}
        options={[
          { value: 'hepsijet', label: 'HepsiJet' },
          { value: 'aras', label: 'Aras Kargo' },
          { value: 'yurtici', label: 'Yurtiçi Kargo' },
          { value: 'mng', label: 'MNG Kargo' },
          { value: 'surat', label: 'Sürat Kargo' },
          { value: 'ups', label: 'UPS' }
        ]}
        required
      />

      <FormField
        label={locale === 'tr' ? 'Takip Numarası' : 'Tracking Number'}
        name="trackingNo"
        type="text"
        value={params.trackingNo || ''}
        error={errors.trackingNo}
        onChange={(value) => onChange('trackingNo', value)}
        placeholder="1234567890"
        required
      />
    </>
  );
}

function LoanCompareFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Kredi Tutarı (TL)' : 'Loan Amount (TL)'}
        name="amount"
        type="number"
        value={params.amount || ''}
        error={errors.amount}
        onChange={(value) => onChange('amount', parseFloat(value) || 0)}
        placeholder="250000"
        required
      />

      <FormField
        label={locale === 'tr' ? 'Vade (Ay)' : 'Term (Months)'}
        name="term"
        type="number"
        value={params.term || ''}
        error={errors.term}
        onChange={(value) => onChange('term', parseInt(value, 10) || 0)}
        placeholder="24"
        required
      />
    </>
  );
}

function TripSearchFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Hedef Şehir' : 'Destination'}
        name="place"
        type="text"
        value={params.place || ''}
        error={errors.place}
        onChange={(value) => onChange('place', value)}
        placeholder={locale === 'tr' ? 'Antalya' : 'Antalya'}
        required
      />

      <FormField
        label={locale === 'tr' ? 'Gece Sayısı' : 'Nights'}
        name="days"
        type="number"
        value={params.days || ''}
        error={errors.days}
        onChange={(value) => onChange('days', parseInt(value, 10) || 0)}
        placeholder="3"
        required
      />

      <FormField
        label={locale === 'tr' ? 'Kişi Sayısı' : 'Guests'}
        name="pax"
        type="number"
        value={params.pax || ''}
        error={errors.pax}
        onChange={(value) => onChange('pax', parseInt(value, 10) || 0)}
        placeholder="2"
        required
      />
    </>
  );
}

function EconomyOptimizeFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Hedef Marj (%)' : 'Target Margin (%)'}
        name="marginTarget"
        type="number"
        value={params.marginTarget || ''}
        error={errors.marginTarget}
        onChange={(value) => onChange('marginTarget', parseFloat(value) || undefined)}
        placeholder="10"
      />
    </>
  );
}

function ESGCalculateFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Sipariş ID (Opsiyonel)' : 'Order ID (Optional)'}
        name="orderId"
        type="text"
        value={params.orderId || ''}
        error={errors.orderId}
        onChange={(value) => onChange('orderId', value)}
        placeholder="ORD-12345"
      />
    </>
  );
}

function ProductSyncFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Platform' : 'Platform'}
        name="vendor"
        type="select"
        value={params.vendor || ''}
        error={errors.vendor}
        onChange={(value) => onChange('vendor', value)}
        options={[
          { value: 'trendyol', label: 'Trendyol' },
          { value: 'hepsiburada', label: 'Hepsiburada' },
          { value: 'amazon', label: 'Amazon' },
          { value: 'ebay', label: 'eBay' }
        ]}
        required
      />
    </>
  );
}

function MenuUpdateFields({ params, errors, onChange, locale }: FieldProps) {
  return (
    <>
      <FormField
        label={locale === 'tr' ? 'Platform' : 'Platform'}
        name="vendor"
        type="select"
        value={params.vendor || ''}
        error={errors.vendor}
        onChange={(value) => onChange('vendor', value)}
        options={[
          { value: 'yemeksepeti', label: 'Yemeksepeti' },
          { value: 'getir', label: 'Getir' },
          { value: 'trendyol_yemek', label: 'Trendyol Yemek' }
        ]}
        required
      />
    </>
  );
}

function GenericFields({ params, metadata, errors, onChange, locale }: FieldProps & { metadata: any }) {
  if (!metadata || !metadata.requiredParams) {
    return <div>No fields required</div>;
  }

  return (
    <>
      {metadata.requiredParams.map((param: string) => (
        <FormField
          key={param}
          label={param}
          name={param}
          type="text"
          value={params[param] || ''}
          error={errors[param]}
          onChange={(value) => onChange(param, value)}
          required
        />
      ))}
    </>
  );
}

/**
 * Generic Form Field
 */
interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'number' | 'select';
  value: any;
  error?: string;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

function FormField({
  label,
  name,
  type,
  value,
  error,
  onChange,
  placeholder,
  required = false,
  options = []
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`field-input ${error ? 'error' : ''}`}
          required={required}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`field-input ${error ? 'error' : ''}`}
          required={required}
        />
      )}

      {error && <span className="field-error">{error}</span>}

      <style jsx>{`
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #e0e0e0;
        }

        .required {
          color: #ff5252;
          margin-left: 4px;
        }

        .field-input {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .field-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .field-input.error {
          border-color: #ff5252;
        }

        .field-error {
          font-size: 12px;
          color: #ff5252;
        }

        select.field-input {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
