/**
 * SHARD_9.5 - Usage Panel
 * Display current usage and limits
 *
 * Security: Read-only display, no sensitive data
 * White Hat: Transparent usage tracking, upgrade prompts
 */

'use client';

import React from 'react';
import { SubscriptionTier } from '@/lib/billing/types';
import { formatNumber, formatStorage } from '@/lib/billing/quotas';

interface UsageStat {
  label: string;
  icon: string;
  used: number;
  limit: number;
  percentage: number;
  formatter?: (n: number) => string;
}

interface UsagePanelProps {
  tier: SubscriptionTier;
  usage: {
    messages: { used: number; limit: number; percentage: number };
    files: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    calls: { used: number; limit: number; percentage: number };
    locationShares: { used: number; limit: number; percentage: number };
    timeUntilReset: string;
  };
  onUpgradeClick?: () => void;
}

export default function UsagePanel({ tier, usage, onUpgradeClick }: UsagePanelProps) {
  const stats: UsageStat[] = [
    {
      label: 'Mesajlar',
      icon: '💬',
      used: usage.messages.used,
      limit: usage.messages.limit,
      percentage: usage.messages.percentage,
      formatter: formatNumber
    },
    {
      label: 'Dosya Yüklemeleri',
      icon: '📁',
      used: usage.files.used,
      limit: usage.files.limit,
      percentage: usage.files.percentage,
      formatter: formatNumber
    },
    {
      label: 'Depolama',
      icon: '💾',
      used: usage.storage.used,
      limit: usage.storage.limit,
      percentage: usage.storage.percentage,
      formatter: formatStorage
    },
    {
      label: 'Arama Süresi',
      icon: '📞',
      used: usage.calls.used,
      limit: usage.calls.limit,
      percentage: usage.calls.percentage,
      formatter: (n) => `${formatNumber(n)} dk`
    },
    {
      label: 'Konum Paylaşımları',
      icon: '📍',
      used: usage.locationShares.used,
      limit: usage.locationShares.limit,
      percentage: usage.locationShares.percentage,
      formatter: formatNumber
    }
  ];

  return (
    <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">Kullanım Durumu</h3>
          <p className="text-sm text-[#9CA3AF]">
            Plan: <span className="text-[#10A37F] font-semibold">{getTierName(tier)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6B7280]">Sıfırlanma:</p>
          <p className="text-sm font-semibold text-[#10A37F]">{usage.timeUntilReset}</p>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-4">
        {stats.map((stat) => (
          <UsageStat key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Upgrade CTA */}
      {tier === SubscriptionTier.FREE && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#10A37F]/10 to-[#0D8F6E]/10 border border-[#10A37F]/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚀</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Pro ile daha fazlası</p>
              <p className="text-sm text-[#9CA3AF] mb-3">
                10x daha fazla mesaj, 100 MB dosyalar, 10 GB depolama ve daha fazlası
              </p>
              <button
                onClick={onUpgradeClick}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-semibold text-sm transition-all"
              >
                Pro'ya Yükselt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageStat({ stat }: { stat: UsageStat }) {
  const { label, icon, used, limit, percentage, formatter } = stat;

  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-[#EF4444]'; // Red
    if (pct >= 75) return 'bg-[#F59E0B]'; // Orange
    return 'bg-[#10A37F]'; // Green
  };

  const formatValue = formatter || formatNumber;

  return (
    <div>
      {/* Label and Values */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-[#9CA3AF]">
          {formatValue(used)} / {formatValue(limit)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor(percentage)}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Percentage */}
      {percentage >= 75 && (
        <p className="text-xs text-[#F59E0B] mt-1">
          {percentage >= 90 ? '⚠️ Limit dolmak üzere' : '⚡ Kullanım yüksek'}
        </p>
      )}
    </div>
  );
}

function getTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case SubscriptionTier.FREE:
      return 'Ücretsiz';
    case SubscriptionTier.PRO:
      return 'Pro';
    case SubscriptionTier.ENTERPRISE:
      return 'Enterprise';
  }
}
