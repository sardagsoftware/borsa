/**
 * 🎨 Message Cards - Action-Specific Result Rendering
 * Beautiful transparent bubbles with 1px borders
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

'use client';

import React from 'react';

/**
 * Base Message Card
 */
export interface MessageCardProps {
  data: any;
  locale?: string;
  className?: string;
}

/**
 * Shipment Tracking Card
 */
export function ShipmentCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { trackingNumber, status, currentLocation, estimatedDelivery, history = [] } = data;

  const statusColors: Record<string, string> = {
    in_transit: '#FFC107',
    delivered: '#4CAF50',
    pending: '#9E9E9E',
    cancelled: '#F44336'
  };

  const statusLabels: Record<string, Record<string, string>> = {
    in_transit: { tr: 'Yolda', en: 'In Transit', ar: 'في الطريق' },
    delivered: { tr: 'Teslim Edildi', en: 'Delivered', ar: 'تم التسليم' },
    pending: { tr: 'Beklemede', en: 'Pending', ar: 'قيد الانتظار' },
    cancelled: { tr: 'İptal Edildi', en: 'Cancelled', ar: 'ملغى' }
  };

  return (
    <div className={`message-card shipment-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">📦</span>
        <div className="card-title-group">
          <h4 className="card-title">{locale === 'tr' ? 'Kargo Takip' : 'Shipment Tracking'}</h4>
          <span className="tracking-number">#{trackingNumber}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="status-badge" style={{ borderColor: statusColors[status] || '#9E9E9E' }}>
          <span className="status-dot" style={{ background: statusColors[status] || '#9E9E9E' }} />
          <span className="status-text">{statusLabels[status]?.[locale] || status}</span>
        </div>

        <div className="info-row">
          <span className="info-label">{locale === 'tr' ? 'Konum' : 'Location'}:</span>
          <span className="info-value">{currentLocation}</span>
        </div>

        <div className="info-row">
          <span className="info-label">{locale === 'tr' ? 'Tahmini Teslimat' : 'Est. Delivery'}:</span>
          <span className="info-value">{estimatedDelivery}</span>
        </div>

        {history.length > 0 && (
          <div className="tracking-history">
            <h5 className="history-title">{locale === 'tr' ? 'Geçmiş' : 'History'}</h5>
            {history.map((item: any, index: number) => (
              <div key={index} className="history-item">
                <span className="history-dot" />
                <div className="history-content">
                  <span className="history-date">{item.date}</span>
                  <span className="history-location">{item.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .message-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
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

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .card-icon {
          font-size: 28px;
        }

        .card-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .tracking-number {
          font-size: 13px;
          color: #888;
          font-family: monospace;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border: 1px solid;
          border-radius: 20px;
          width: fit-content;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .status-text {
          font-size: 14px;
          font-weight: 600;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .info-label {
          color: #888;
          font-size: 14px;
        }

        .info-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }

        .tracking-history {
          margin-top: 10px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .history-title {
          font-size: 13px;
          font-weight: 600;
          color: #888;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .history-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          position: relative;
        }

        .history-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 20px;
          bottom: -12px;
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .history-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
          margin-top: 5px;
        }

        .history-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .history-date {
          font-size: 12px;
          color: #888;
        }

        .history-location {
          font-size: 14px;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}

/**
 * Loan Comparison Card
 */
export function LoanCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { offers = [], requestedAmount, requestedTerm } = data;

  return (
    <div className={`message-card loan-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">💰</span>
        <div className="card-title-group">
          <h4 className="card-title">{locale === 'tr' ? 'Kredi Karşılaştırma' : 'Loan Comparison'}</h4>
          <span className="loan-details">
            {requestedAmount?.toLocaleString()} TL • {requestedTerm} {locale === 'tr' ? 'ay' : 'months'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {offers.map((offer: any, index: number) => (
          <div key={index} className="loan-offer">
            <div className="offer-header">
              <span className="bank-name">{offer.bank}</span>
              <span className="offer-badge">{index === 0 ? (locale === 'tr' ? 'En İyi' : 'Best') : ''}</span>
            </div>
            <div className="offer-details">
              <div className="detail-item">
                <span className="detail-label">{locale === 'tr' ? 'Faiz' : 'Interest'}:</span>
                <span className="detail-value highlight">{offer.interestRate}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{locale === 'tr' ? 'Aylık' : 'Monthly'}:</span>
                <span className="detail-value">{offer.monthlyPayment?.toLocaleString()} TL</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{locale === 'tr' ? 'Toplam' : 'Total'}:</span>
                <span className="detail-value">{offer.totalPayment?.toLocaleString()} TL</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .loan-card .card-body {
          gap: 12px;
        }

        .loan-details {
          font-size: 13px;
          color: #FFC107;
          font-weight: 600;
        }

        .loan-offer {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          transition: all 0.2s;
        }

        .loan-offer:hover {
          border-color: #FFC107;
          transform: translateX(4px);
        }

        .offer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .bank-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .offer-badge {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
          border-radius: 10px;
          color: #4CAF50;
          font-weight: 600;
        }

        .offer-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .detail-label {
          color: #888;
        }

        .detail-value {
          color: #ffffff;
          font-weight: 600;
        }

        .detail-value.highlight {
          color: #FFC107;
        }
      `}</style>
    </div>
  );
}

/**
 * Hotel/Trip Search Card
 */
export function HotelCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { hotels = [], destination, nights, guests } = data;

  return (
    <div className={`message-card hotel-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">✈️</span>
        <div className="card-title-group">
          <h4 className="card-title">{locale === 'tr' ? 'Otel Arama' : 'Hotel Search'}</h4>
          <span className="search-params">
            {destination} • {nights} {locale === 'tr' ? 'gece' : 'nights'} • {guests} {locale === 'tr' ? 'kişi' : 'guests'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {hotels.map((hotel: any, index: number) => (
          <div key={index} className="hotel-item">
            <div className="hotel-info">
              <span className="hotel-name">{hotel.name}</span>
              <div className="hotel-rating">
                {'⭐'.repeat(Math.floor(hotel.rating || 0))}
                <span className="rating-value">{hotel.rating}</span>
              </div>
            </div>
            <div className="hotel-pricing">
              <span className="price-amount">{hotel.price?.toLocaleString()} TL</span>
              <span className="price-label">/{locale === 'tr' ? 'gece' : 'night'}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .search-params {
          font-size: 13px;
          color: #9C27B0;
          font-weight: 600;
        }

        .hotel-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .hotel-item:hover {
          border-color: #9C27B0;
          transform: scale(1.02);
        }

        .hotel-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hotel-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .hotel-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .rating-value {
          font-size: 13px;
          color: #FFC107;
          font-weight: 600;
        }

        .hotel-pricing {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .price-amount {
          font-size: 18px;
          font-weight: 700;
          color: #9C27B0;
        }

        .price-label {
          font-size: 12px;
          color: #888;
        }
      `}</style>
    </div>
  );
}

/**
 * Product List Card
 */
export function ProductCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { products = [], total, platform } = data;

  return (
    <div className={`message-card product-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">🛍️</span>
        <div className="card-title-group">
          <h4 className="card-title">{locale === 'tr' ? 'Ürün Listesi' : 'Product List'}</h4>
          <span className="product-count">
            {total} {locale === 'tr' ? 'ürün' : 'products'} • {platform}
          </span>
        </div>
      </div>

      <div className="card-body">
        {products.slice(0, 5).map((product: any, index: number) => (
          <div key={index} className="product-item">
            <div className="product-icon">{product.image || '📦'}</div>
            <div className="product-info">
              <span className="product-name">{product.name}</span>
              <span className="product-stock">
                {locale === 'tr' ? 'Stok' : 'Stock'}: {product.stock}
              </span>
            </div>
            <div className="product-price">{product.price?.toLocaleString()} TL</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .product-count {
          font-size: 13px;
          color: #FF9800;
          font-weight: 600;
        }

        .product-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .product-item:hover {
          border-color: #FF9800;
        }

        .product-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .product-name {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .product-stock {
          font-size: 12px;
          color: #888;
        }

        .product-price {
          font-size: 15px;
          font-weight: 700;
          color: #FF9800;
        }
      `}</style>
    </div>
  );
}

/**
 * ESG Carbon Footprint Card
 */
export function ESGCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { carbonFootprint, breakdown = [], recommendations = [] } = data;

  return (
    <div className={`message-card esg-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">🌱</span>
        <div className="card-title-group">
          <h4 className="card-title">{locale === 'tr' ? 'Karbon Ayak İzi' : 'Carbon Footprint'}</h4>
          <span className="carbon-value">{carbonFootprint} kg CO₂</span>
        </div>
      </div>

      <div className="card-body">
        {breakdown.length > 0 && (
          <div className="breakdown-section">
            <h5 className="section-title">{locale === 'tr' ? 'Dağılım' : 'Breakdown'}</h5>
            {breakdown.map((item: any, index: number) => (
              <div key={index} className="breakdown-item">
                <span className="breakdown-label">{item.source}</span>
                <div className="breakdown-bar">
                  <div className="bar-fill" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="breakdown-value">{item.amount} kg</span>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h5 className="section-title">{locale === 'tr' ? 'Öneriler' : 'Recommendations'}</h5>
            {recommendations.map((rec: string, index: number) => (
              <div key={index} className="recommendation-item">
                <span className="rec-icon">✓</span>
                <span className="rec-text">{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .carbon-value {
          font-size: 16px;
          color: #4CAF50;
          font-weight: 700;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #888;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .breakdown-section,
        .recommendations-section {
          margin-top: 12px;
        }

        .breakdown-item {
          display: grid;
          grid-template-columns: 100px 1fr 60px;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }

        .breakdown-label {
          font-size: 13px;
          color: #ffffff;
        }

        .breakdown-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
          transition: width 0.5s ease;
        }

        .breakdown-value {
          font-size: 12px;
          color: #4CAF50;
          font-weight: 600;
          text-align: right;
        }

        .recommendation-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: rgba(76, 175, 80, 0.05);
          border-radius: 8px;
        }

        .rec-icon {
          color: #4CAF50;
          font-weight: 700;
        }

        .rec-text {
          font-size: 13px;
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}

/**
 * Insight/Trend Chart Card
 */
export function InsightCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  const { title, trend, dataPoints = [], insights = [] } = data;

  return (
    <div className={`message-card insight-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">📊</span>
        <div className="card-title-group">
          <h4 className="card-title">{title || (locale === 'tr' ? 'Trend Analizi' : 'Trend Analysis')}</h4>
          <span className={`trend-indicator ${trend}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            {trend === 'up'
              ? locale === 'tr'
                ? 'Artış'
                : 'Increasing'
              : trend === 'down'
              ? locale === 'tr'
                ? 'Azalış'
                : 'Decreasing'
              : locale === 'tr'
              ? 'Stabil'
              : 'Stable'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {dataPoints.length > 0 && (
          <div className="chart-container">
            {dataPoints.map((point: any, index: number) => (
              <div key={index} className="chart-bar">
                <div
                  className="bar"
                  style={{
                    height: `${(point.value / Math.max(...dataPoints.map((p: any) => p.value))) * 100}%`
                  }}
                />
                <span className="bar-label">{point.label}</span>
              </div>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="insights-list">
            {insights.map((insight: string, index: number) => (
              <div key={index} className="insight-item">
                <span className="insight-bullet">•</span>
                <span className="insight-text">{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .trend-indicator {
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid;
        }

        .trend-indicator.up {
          color: #4CAF50;
          border-color: #4CAF50;
          background: rgba(76, 175, 80, 0.1);
        }

        .trend-indicator.down {
          color: #F44336;
          border-color: #F44336;
          background: rgba(244, 67, 54, 0.1);
        }

        .trend-indicator.stable {
          color: #FFC107;
          border-color: #FFC107;
          background: rgba(255, 193, 7, 0.1);
        }

        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 120px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .chart-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px 4px 0 0;
          transition: height 0.5s ease;
        }

        .bar-label {
          font-size: 11px;
          color: #888;
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight-item {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .insight-bullet {
          color: #667eea;
          font-weight: 700;
        }

        .insight-text {
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}

/**
 * Generic Result Card (fallback)
 */
export function GenericCard({ data, locale = 'tr', className = '' }: MessageCardProps) {
  return (
    <div className={`message-card generic-card ${className}`}>
      <div className="card-header">
        <span className="card-icon">✅</span>
        <h4 className="card-title">{locale === 'tr' ? 'Sonuç' : 'Result'}</h4>
      </div>

      <div className="card-body">
        <pre className="json-output">{JSON.stringify(data, null, 2)}</pre>
      </div>

      <style jsx>{`
        .json-output {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          color: #4CAF50;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
