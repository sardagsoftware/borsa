/**
 * AI Power Panel - Model Table
 * Model | Type | Params | Active | FLOPs/tkn | tps | TPM | RPM | p95 | Provider | Status
 */

'use client';

import React from 'react';
import { AIModel } from '../../lib/models/registry';
import { OperationalMetrics, calculateActiveParamsB, calculateFLOPsPerToken, formatParams, formatFLOPs, formatLatency } from '../../lib/models/formulas';

export interface PowerTableProps {
  models: AIModel[];
  metricsMap: Map<string, OperationalMetrics>;
  loading?: boolean;
}

export function PowerTable({ models, metricsMap, loading }: PowerTableProps) {
  return (
    <div className="power-table-container">
      <table className="power-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Type</th>
            <th>Params(B)</th>
            <th>Active(B)</th>
            <th>FLOPs/tkn</th>
            <th>TPS</th>
            <th>TPM</th>
            <th>RPM</th>
            <th>p95(ms)</th>
            <th>Provider</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const metrics = metricsMap.get(model.id);
            const activeParams = calculateActiveParamsB(model);
            const flops = calculateFLOPsPerToken(model);
            const tps = metrics?.tps || (metrics?.TPM ? metrics.TPM / 60 : null);

            return (
              <tr key={model.id}>
                <td className="model-name">{model.name}</td>
                <td>
                  <span className={`type-badge type-${model.type}`}>
                    {model.type}
                  </span>
                </td>
                <td>{formatParams(model.paramsB)}</td>
                <td>{formatParams(activeParams)}</td>
                <td>{formatFLOPs(flops)}</td>
                <td>{tps !== null ? tps.toFixed(1) : 'N/A'}</td>
                <td>{metrics?.TPM || 'N/A'}</td>
                <td>{metrics?.RPM || 'N/A'}</td>
                <td>{formatLatency(metrics?.p95_ms || null)}</td>
                <td>
                  <span className={`provider-badge provider-${model.provider}`}>
                    {model.provider}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${model.status}`}>
                    {model.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style jsx>{`
        .power-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .power-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .power-table th {
          background: #f9fafb;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
        }

        .power-table td {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .model-name {
          font-weight: 500;
          color: #111827;
        }

        .type-badge, .provider-badge, .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-block;
        }

        .type-dense { background: #dbeafe; color: #1e40af; }
        .type-moe { background: #fef3c7; color: #92400e; }
        .type-closed { background: #e0e7ff; color: #4338ca; }

        .provider-azure { background: #cffafe; color: #155e75; }
        .provider-openai { background: #d1fae5; color: #065f46; }
        .provider-anthropic { background: #fce7f3; color: #9f1239; }
        .provider-google { background: #fef9c3; color: #713f12; }
        .provider-groq { background: #e9d5ff; color: #6b21a8; }
        .provider-local { background: #f3f4f6; color: #374151; }

        .status-active { background: #d1fae5; color: #065f46; }
        .status-degraded { background: #fed7aa; color: #9a3412; }
        .status-inactive { background: #f3f4f6; color: #6b7280; }
      `}</style>
    </div>
  );
}
