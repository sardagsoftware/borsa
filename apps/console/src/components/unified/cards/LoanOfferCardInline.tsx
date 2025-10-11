/**
 * =° LoanOfferCardInline - Kredi Teklifi Kart1
 *
 * Displays loan offer comparison inline within chat
 * - Bank name, interest rate, monthly payment
 * - Total cost comparison
 * - Apply button
 * - Turkish default
 *
 * @module components/unified/cards
 */

'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface LoanOffer {
  bank: string;
  bankLogo?: string;
  interestRate: number; // Annual percentage rate
  monthlyPayment: number;
  totalCost: number;
  loanAmount: number;
  term: number; // months
  currency: string;
  features?: string[];
  applyUrl?: string;
}

interface LoanOfferCardInlineProps {
  offers: LoanOffer[];
  locale?: string;
}

// ============================================================================
// LoanOfferCardInline Component
// ============================================================================

export function LoanOfferCardInline({
  offers,
  locale = 'tr',
}: LoanOfferCardInlineProps) {
  if (!offers || offers.length === 0) {
    return (
      <div className="loan-offer-card-inline">
        <p>Kredi teklifi bulunamad1.</p>
      </div>
    );
  }

  // Sort by lowest monthly payment
  const sortedOffers = [...offers].sort(
    (a, b) => a.monthlyPayment - b.monthlyPayment
  );

  return (
    <div className="loan-offer-card-inline">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">Kredi Teklifleri Kar_1la_t1rma</h3>
        <div className="card-subtitle">
          {offers[0].loanAmount.toLocaleString(locale)} {offers[0].currency} ·{' '}
          {offers[0].term} Ay
        </div>
      </div>

      {/* Offers List */}
      <div className="offers-list">
        {sortedOffers.map((offer, index) => (
          <div key={index} className={`offer-item ${index === 0 ? 'best' : ''}`}>
            {index === 0 && <div className="best-badge">En 0yi Teklif</div>}

            {/* Bank Info */}
            <div className="offer-header">
              <div className="bank-info">
                {offer.bankLogo ? (
                  <img
                    src={offer.bankLogo}
                    alt={offer.bank}
                    className="bank-logo"
                  />
                ) : (
                  <div className="bank-logo-placeholder">{offer.bank[0]}</div>
                )}
                <span className="bank-name">{offer.bank}</span>
              </div>
              <div className="interest-rate">
                {offer.interestRate.toFixed(2)}% <span className="rate-label">Faiz</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-details">
              <div className="detail-item">
                <span className="detail-label">Ayl1k Taksit</span>
                <span className="detail-value monthly-payment">
                  {offer.monthlyPayment.toLocaleString(locale)} {offer.currency}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Toplam Ödeme</span>
                <span className="detail-value">
                  {offer.totalCost.toLocaleString(locale)} {offer.currency}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Toplam Faiz</span>
                <span className="detail-value cost-difference">
                  +{(offer.totalCost - offer.loanAmount).toLocaleString(locale)}{' '}
                  {offer.currency}
                </span>
              </div>
            </div>

            {/* Features */}
            {offer.features && offer.features.length > 0 && (
              <div className="offer-features">
                {offer.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="feature-item">
                     {feature}
                  </div>
                ))}
              </div>
            )}

            {/* Apply Button */}
            {offer.applyUrl && (
              <a
                href={offer.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="apply-button"
              >
                Ba_vur ’
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        .loan-offer-card-inline {
          padding: 16px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          color: #fff;
        }

        .card-header {
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .card-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .offers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .offer-item {
          position: relative;
          padding: 16px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 215, 0, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .offer-item:hover {
          background: rgba(0, 0, 0, 0.7);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .offer-item.best {
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }

        .best-badge {
          position: absolute;
          top: -8px;
          right: 16px;
          padding: 4px 12px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .offer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .bank-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bank-logo {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: contain;
          background: #fff;
          padding: 4px;
        }

        .bank-logo-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: rgba(255, 215, 0, 0.9);
        }

        .bank-name {
          font-size: 16px;
          font-weight: 600;
        }

        .interest-rate {
          font-size: 20px;
          font-weight: 700;
          color: rgba(255, 215, 0, 0.9);
        }

        .rate-label {
          font-size: 12px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.6);
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          padding: 12px;
          background: rgba(255, 215, 0, 0.05);
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .detail-value {
          font-weight: 600;
        }

        .monthly-payment {
          color: rgba(255, 215, 0, 0.9);
          font-size: 16px;
        }

        .cost-difference {
          color: rgba(255, 255, 255, 0.6);
        }

        .offer-features {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .feature-item {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .apply-button {
          display: block;
          width: 100%;
          padding: 12px;
          background: rgba(255, 215, 0, 0.2);
          border: 1px solid rgba(255, 215, 0, 0.4);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apply-button:hover {
          background: rgba(255, 215, 0, 0.3);
          border-color: rgba(255, 215, 0, 0.6);
          transform: scale(1.02);
        }

        .apply-button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export default LoanOfferCardInline;
