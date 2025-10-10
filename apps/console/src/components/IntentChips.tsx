/**
 * 💡 Intent Chips - AI-powered Action Suggestions
 * Displays top 3 predicted intents as clickable suggestion chips
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

'use client';

import React from 'react';
import { Intent } from '../intent/engine';
import { getActionMetadata } from '../core/tool-registry';

export interface IntentChipsProps {
  intents: Intent[];
  onSelect: (intent: Intent) => void;
  locale?: string;
  className?: string;
}

export function IntentChips({
  intents,
  onSelect,
  locale = 'tr',
  className = ''
}: IntentChipsProps) {
  if (!intents || intents.length === 0) {
    return null;
  }

  return (
    <div
      className={`intent-chips ${className}`}
      role="listbox"
      aria-label="Suggested actions"
    >
      {intents.slice(0, 3).map((intent, index) => (
        <IntentChip
          key={`${intent.action}-${index}`}
          intent={intent}
          onClick={() => onSelect(intent)}
          rank={index + 1}
          locale={locale}
        />
      ))}

      <style jsx>{`
        .intent-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 0;
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

        @media (max-width: 768px) {
          .intent-chips {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

interface IntentChipProps {
  intent: Intent;
  onClick: () => void;
  rank: number;
  locale: string;
}

function IntentChip({ intent, onClick, rank, locale }: IntentChipProps) {
  const metadata = getActionMetadata(intent.action);
  const icon = metadata?.icon || '🔧';
  const category = metadata?.category || 'general';

  // Format confidence as percentage
  const confidence = Math.round(intent.score * 100);

  // Get category color
  const categoryColor = getCategoryColor(category);

  // Check if RTL
  const isRTL = locale === 'ar';

  return (
    <button
      type="button"
      className={`intent-chip ${isRTL ? 'rtl' : ''}`}
      onClick={onClick}
      role="option"
      aria-label={`${intent.reason} - ${confidence}% confidence`}
      title={`Action: ${intent.action}\nConfidence: ${confidence}%`}
    >
      <span className="chip-rank" aria-hidden="true">
        {rank}
      </span>

      <span className="chip-icon" aria-hidden="true">
        {icon}
      </span>

      <span className="chip-content">
        <span className="chip-reason">{intent.reason || intent.action}</span>

        {Object.keys(intent.params).length > 0 && (
          <span className="chip-params">
            {formatParams(intent.params)}
          </span>
        )}
      </span>

      <span className="chip-confidence" aria-label={`${confidence}% confidence`}>
        {confidence}%
      </span>

      <style jsx>{`
        .intent-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${categoryColor};
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: #e0e0e0;
          position: relative;
          overflow: hidden;
          min-height: 44px; /* Touch target size */
        }

        .intent-chip:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: ${categoryColor};
          box-shadow: 0 0 15px ${categoryColor}40;
          transform: translateY(-2px);
        }

        .intent-chip:active {
          transform: translateY(0);
        }

        .intent-chip:focus {
          outline: 2px solid ${categoryColor};
          outline-offset: 2px;
        }

        .intent-chip.rtl {
          direction: rtl;
        }

        .chip-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: ${categoryColor}30;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          color: ${categoryColor};
          flex-shrink: 0;
        }

        .chip-icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }

        .chip-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .chip-reason {
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chip-params {
          font-size: 12px;
          color: #a0a0a0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chip-confidence {
          font-size: 11px;
          font-weight: 700;
          color: ${categoryColor};
          background: ${categoryColor}20;
          padding: 2px 6px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        /* Shimmer effect on hover */
        .intent-chip::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s;
        }

        .intent-chip:hover::before {
          left: 100%;
        }

        @media (max-width: 768px) {
          .intent-chip {
            width: 100%;
            justify-content: flex-start;
          }

          .chip-content {
            flex: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .intent-chip {
            transition: none;
          }

          .intent-chip:hover {
            transform: none;
          }

          .intent-chip::before {
            display: none;
          }
        }
      `}</style>
    </button>
  );
}

/**
 * Get category color for styling
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    logistics: '#4CAF50', // Green
    finance: '#FFC107', // Amber
    economy: '#2196F3', // Blue
    travel: '#9C27B0', // Purple
    insights: '#FF5722', // Deep Orange
    esg: '#4CAF50', // Green
    commerce: '#FF9800', // Orange
    delivery: '#00BCD4', // Cyan
    general: '#9E9E9E' // Grey
  };

  return colors[category] || colors.general;
}

/**
 * Format parameters for display
 */
function formatParams(params: Record<string, any>): string {
  const entries = Object.entries(params)
    .filter(([key]) => !key.startsWith('_')) // Ignore _ignore fields
    .map(([key, value]) => {
      if (typeof value === 'number') {
        // Format numbers with thousands separator
        return value.toLocaleString();
      }
      return String(value);
    });

  return entries.join(' • ');
}

/**
 * Loading state for intent chips
 */
export function IntentChipsLoading() {
  return (
    <div className="intent-chips-loading">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-chip" />
      ))}

      <style jsx>{`
        .intent-chips-loading {
          display: flex;
          gap: 8px;
          padding: 8px 0;
        }

        .skeleton-chip {
          height: 44px;
          width: 200px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 20px;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (max-width: 768px) {
          .intent-chips-loading {
            flex-direction: column;
          }

          .skeleton-chip {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Empty state when no intents detected
 */
export function IntentChipsEmpty({ locale = 'tr' }: { locale?: string }) {
  const messages: Record<string, string> = {
    tr: 'Örnek: "kargom nerede aras 1234567890"',
    en: 'Example: "track shipment aras 1234567890"',
    ar: 'مثال: "تتبع الشحنة aras 1234567890"',
    ru: 'Пример: "отследить посылку aras 1234567890"',
    de: 'Beispiel: "sendung verfolgen aras 1234567890"'
  };

  return (
    <div className="intent-chips-empty">
      <span className="empty-icon">💡</span>
      <span className="empty-text">{messages[locale] || messages.tr}</span>

      <style jsx>{`
        .intent-chips-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 13px;
          color: #888;
        }

        .empty-icon {
          font-size: 16px;
        }

        .empty-text {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
