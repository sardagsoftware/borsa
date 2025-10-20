/**
 * =æ ShipmentCardInline - Kargo Takip Kart1
 *
 * Displays shipment tracking results inline within chat
 * - Real-time tracking status
 * - Location updates
 * - Estimated delivery
 * - Turkish default
 *
 * @module components/unified/cards
 */

'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ShipmentData {
  trackingNumber: string;
  vendor: string;
  status: 'in_transit' | 'delivered' | 'pending' | 'exception';
  currentLocation?: string;
  estimatedDelivery?: string;
  updates: Array<{
    timestamp: number;
    location: string;
    status: string;
    description: string;
  }>;
}

interface ShipmentCardInlineProps {
  data: ShipmentData;
  locale?: string;
}

// ============================================================================
// Status Translations
// ============================================================================

const STATUS_TR: Record<string, string> = {
  in_transit: 'Yolda',
  delivered: 'Teslim Edildi',
  pending: 'Beklemede',
  exception: 'Sorun Var',
};

// ============================================================================
// ShipmentCardInline Component
// ============================================================================

export function ShipmentCardInline({
  data,
  locale = 'tr',
}: ShipmentCardInlineProps) {
  const statusText = STATUS_TR[data.status] || data.status;

  return (
    <div className="shipment-card-inline">
      {/* Header */}
      <div className="card-header">
        <div className="vendor-badge">{data.vendor}</div>
        <div className={`status-badge status-${data.status}`}>{statusText}</div>
      </div>

      {/* Tracking Number */}
      <div className="tracking-number">
        <span className="label">Takip No:</span>
        <span className="value">{data.trackingNumber}</span>
      </div>

      {/* Current Location */}
      {data.currentLocation && (
        <div className="current-location">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ marginRight: '8px' }}
          >
            <path
              d="M8 1C5.24 1 3 3.24 3 6C3 9.5 8 15 8 15C8 15 13 9.5 13 6C13 3.24 10.76 1 8 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="8" cy="6" r="2" fill="currentColor" />
          </svg>
          {data.currentLocation}
        </div>
      )}

      {/* Estimated Delivery */}
      {data.estimatedDelivery && (
        <div className="estimated-delivery">
          <span className="label">Tahmini Teslimat:</span>
          <span className="value">{data.estimatedDelivery}</span>
        </div>
      )}

      {/* Updates Timeline */}
      {data.updates && data.updates.length > 0 && (
        <div className="updates-timeline">
          <div className="timeline-label">Güzergah:</div>
          {data.updates.slice(0, 3).map((update, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-time">
                  {new Date(update.timestamp).toLocaleDateString(locale)}
                </div>
                <div className="timeline-location">{update.location}</div>
                <div className="timeline-description">{update.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .shipment-card-inline {
          padding: 16px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          color: #fff;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .vendor-badge {
          padding: 4px 12px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-in_transit {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .status-delivered {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-pending {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .status-exception {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .tracking-number {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .tracking-number .label {
          color: rgba(255, 255, 255, 0.6);
          margin-right: 8px;
        }

        .tracking-number .value {
          font-weight: 600;
          color: rgba(255, 215, 0, 0.9);
        }

        .current-location {
          display: flex;
          align-items: center;
          padding: 8px 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .estimated-delivery {
          padding: 8px 0;
          font-size: 14px;
        }

        .estimated-delivery .label {
          color: rgba(255, 255, 255, 0.6);
          margin-right: 8px;
        }

        .estimated-delivery .value {
          font-weight: 500;
        }

        .updates-timeline {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 215, 0, 0.1);
        }

        .timeline-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .timeline-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .timeline-dot {
          width: 8px;
          height: 8px;
          margin-top: 6px;
          background: rgba(255, 215, 0, 0.6);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .timeline-content {
          flex: 1;
        }

        .timeline-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 2px;
        }

        .timeline-location {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2px;
        }

        .timeline-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}

export default ShipmentCardInline;
