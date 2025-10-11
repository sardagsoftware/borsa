/**
 * AI Power Panel - Summary Cards
 * Displays ΣActive Params, Σ Throughput, ΣTPM/RPM
 */

'use client';

import React from 'react';
import { formatLargeNumber, formatParams } from '../../lib/models/formulas';

export interface PowerCardData {
  totalActiveParamsB: number;
  totalTPS: number;
  totalTPM: number;
  totalRPM: number;
  activeModels: number;
  totalModels: number;
}

export interface PowerCardsProps {
  data: PowerCardData;
  loading?: boolean;
}

export function PowerCards({ data, loading }: PowerCardsProps) {
  const cards = [
    {
      id: 'params',
      title: 'ΣActive Params',
      value: formatParams(data.totalActiveParamsB),
      subtitle: 'Open models only',
      icon: '🧠',
      color: 'blue'
    },
    {
      id: 'throughput',
      title: 'ΣThroughput',
      value: `${formatLargeNumber(data.totalTPS)} tps`,
      subtitle: 'Tokens per second',
      icon: '⚡',
      color: 'green'
    },
    {
      id: 'tpm',
      title: 'ΣTPM',
      value: formatLargeNumber(data.totalTPM),
      subtitle: 'Azure quotas',
      icon: '📊',
      color: 'purple'
    },
    {
      id: 'rpm',
      title: 'ΣRPM',
      value: formatLargeNumber(data.totalRPM),
      subtitle: 'Requests per minute',
      icon: '🔄',
      color: 'orange'
    }
  ];

  return (
    <div className="power-cards-grid">
      {cards.map((card) => (
        <div key={card.id} className={`power-card power-card-${card.color}`}>
          <div className="power-card-header">
            <span className="power-card-icon">{card.icon}</span>
            <h3 className="power-card-title">{card.title}</h3>
          </div>
          <div className="power-card-body">
            {loading ? (
              <div className="power-card-skeleton" />
            ) : (
              <div className="power-card-value">{card.value}</div>
            )}
            <div className="power-card-subtitle">{card.subtitle}</div>
          </div>
        </div>
      ))}
      <style jsx>{`
        .power-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .power-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .power-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .power-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .power-card-icon {
          font-size: 2rem;
        }

        .power-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .power-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .power-card-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .power-card-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .power-card-skeleton {
          height: 2rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: loading 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .power-card-blue .power-card-value { color: #3b82f6; }
        .power-card-green .power-card-value { color: #10b981; }
        .power-card-purple .power-card-value { color: #8b5cf6; }
        .power-card-orange .power-card-value { color: #f59e0b; }

        @media (max-width: 768px) {
          .power-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
