/**
 * 📦 Shipment Card (Inline)
 * ChatGPT-style inline result card for shipment tracking
 *
 * @module components/cards/ShipmentCardInline
 * @white-hat Compliant - Uses official carrier APIs only
 */

import React from 'react';

interface ShipmentData {
  trackingNumber: string;
  vendor: 'aras' | 'ups' | 'fedex' | 'yurtici' | 'mng';
  status: 'in_transit' | 'delivered' | 'pending' | 'cancelled';
  currentLocation?: string;
  estimatedDelivery?: string;
  lastUpdate?: string;
  events?: Array<{
    timestamp: string;
    location: string;
    description: string;
  }>;
}

interface ShipmentCardInlineProps {
  data: ShipmentData;
  onShowDetails?: () => void;
}

const VENDOR_LOGOS: Record<string, string> = {
  aras: '🚚',
  ups: '📦',
  fedex: '✈️',
  yurtici: '🚛',
  mng: '🚐',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  in_transit: { bg: '#3498db20', text: '#3498db', emoji: '🚚' },
  delivered: { bg: '#2ed57320', text: '#2ed573', emoji: '✅' },
  pending: { bg: '#f39c1220', text: '#f39c12', emoji: '⏳' },
  cancelled: { bg: '#e7484820', text: '#e74848', emoji: '❌' },
};

const STATUS_LABELS: Record<string, { tr: string; en: string }> = {
  in_transit: { tr: 'Yolda', en: 'In Transit' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered' },
  pending: { tr: 'Beklemede', en: 'Pending' },
  cancelled: { tr: 'İptal Edildi', en: 'Cancelled' },
};

export default function ShipmentCardInline({
  data,
  onShowDetails,
}: ShipmentCardInlineProps) {
  const statusStyle = STATUS_COLORS[data.status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[data.status]?.tr || data.status;

  return (
    <div
      className="shipment-card-inline"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
        maxWidth: '600px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>{VENDOR_LOGOS[data.vendor]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {data.vendor.toUpperCase()}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>
            {data.trackingNumber}
          </div>
        </div>
        <div
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{statusStyle.emoji}</span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Current Location */}
      {data.currentLocation && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            📍 Mevcut Konum
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
            {data.currentLocation}
          </div>
        </div>
      )}

      {/* Estimated Delivery */}
      {data.estimatedDelivery && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            🕐 Tahmini Teslimat
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
            {new Date(data.estimatedDelivery).toLocaleString('tr-TR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}

      {/* Last Update */}
      {data.lastUpdate && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
          Son güncelleme: {new Date(data.lastUpdate).toLocaleString('tr-TR')}
        </div>
      )}

      {/* Events Timeline (if available) */}
      {data.events && data.events.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            📋 Son Hareketler
          </div>
          {data.events.slice(0, 3).map((event, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ color: 'var(--color-text-secondary)', minWidth: '80px' }}>
                {new Date(event.timestamp).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                  {event.description}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                  {event.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={onShowDetails}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '10px 16px',
          background: 'var(--color-primary)',
          color: 'var(--color-background)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        🔍 Detayları Görüntüle
      </button>
    </div>
  );
}

console.log('✅ ShipmentCardInline initialized');
