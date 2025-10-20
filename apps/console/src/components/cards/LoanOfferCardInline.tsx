/**
 * 💰 Loan Offer Card (Inline)
 * ChatGPT-style inline result card for banking loan offers
 *
 * @module components/cards/LoanOfferCardInline
 * @white-hat Compliant - Partner APIs with legal agreements
 */

import React from 'react';

interface LoanOffer {
  id: string;
  bankName: string;
  bankLogo?: string;
  amount: number;
  term: number; // months
  interestRate: number; // percentage
  monthlyPayment: number;
  totalPayment: number;
  processingFee?: number;
  eligibility: 'approved' | 'pre-approved' | 'pending' | 'requires_documents';
}

interface LoanOfferCardInlineProps {
  data: LoanOffer;
  onShowDetails?: () => void;
  onApply?: () => void;
}

const ELIGIBILITY_STATUS: Record<string, { label: string; color: string; emoji: string }> = {
  approved: { label: 'Onaylandı', color: '#2ed573', emoji: '✅' },
  'pre-approved': { label: 'Ön Onay', color: '#3498db', emoji: '⏳' },
  pending: { label: 'İnceleniyor', color: '#f39c12', emoji: '🔍' },
  requires_documents: { label: 'Belge Gerekli', color: '#ff6b6b', emoji: '📄' },
};

export default function LoanOfferCardInline({
  data,
  onShowDetails,
  onApply,
}: LoanOfferCardInlineProps) {
  const eligibility = ELIGIBILITY_STATUS[data.eligibility];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <div
      className="loan-offer-card-inline"
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        marginTop: 'var(--spacing-md)',
        maxWidth: '600px',
      }}
    >
      {/* Header with Bank Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            {data.bankLogo || '🏦'}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {data.bankName}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Kredi Teklifi
            </div>
          </div>
        </div>

        {/* Eligibility Badge */}
        <div
          style={{
            background: `${eligibility.color}20`,
            color: eligibility.color,
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{eligibility.emoji}</span>
          <span>{eligibility.label}</span>
        </div>
      </div>

      {/* Loan Amount & Term */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            💵 Kredi Tutarı
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {formatCurrency(data.amount)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            📅 Vade
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
            {data.term} Ay
          </div>
        </div>
      </div>

      {/* Interest Rate (Prominent) */}
      <div
        style={{
          background: `linear-gradient(135deg, var(--color-primary) 0%, ${data.interestRate < 3 ? '#2ed573' : '#f39c12'} 100%)`,
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px', fontWeight: 600 }}>
          🎯 Faiz Oranı
        </div>
        <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
          %{data.interestRate.toFixed(2)}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
          Aylık Sabit Faiz
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            💳 Aylık Ödeme
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {formatCurrency(data.monthlyPayment)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            📊 Toplam Geri Ödeme
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            {formatCurrency(data.totalPayment)}
          </span>
        </div>
        {data.processingFee && data.processingFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              💼 Dosya Masrafı
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              {formatCurrency(data.processingFee)}
            </span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          padding: '12px',
          background: '#f39c1210',
          border: '1px solid #f39c1240',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          ⚠️ <strong>Önemli:</strong> Bu teklif ön onay niteliğindedir. Kesin onay için belge ibrazı gerekebilir.
          KKDF ve BSMV dahildir. Kredi başvurusu KVKK kapsamında işlenir.
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onApply}
          style={{
            flex: 2,
            padding: '14px 20px',
            background: 'var(--color-primary)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          📝 Başvur
        </button>
        <button
          onClick={onShowDetails}
          style={{
            flex: 1,
            padding: '14px 20px',
            background: 'transparent',
            color: 'var(--color-text)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
        >
          🔍 Detay
        </button>
      </div>
    </div>
  );
}

console.log('✅ LoanOfferCardInline initialized (KVKK compliant)');
