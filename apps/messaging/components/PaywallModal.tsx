/**
 * SHARD_9.4 - Paywall Modal
 * Upgrade prompt when quota exceeded
 *
 * Security: Client-side UI only, server validates all actions
 * White Hat: Clear pricing, no dark patterns, easy cancellation
 */

'use client';

import React from 'react';
import { SubscriptionTier, TIER_PRICING, TIER_LIMITS } from '@/lib/billing/types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  reason: string;
  feature?: string;
  onUpgrade?: (tier: SubscriptionTier, period: 'monthly' | 'yearly') => void;
}

export default function PaywallModal({
  isOpen,
  onClose,
  currentTier,
  reason,
  feature,
  onUpgrade
}: PaywallModalProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const recommendedTier = currentTier === SubscriptionTier.FREE
    ? SubscriptionTier.PRO
    : SubscriptionTier.ENTERPRISE;

  const pricing = TIER_PRICING[recommendedTier];
  const limits = TIER_LIMITS[recommendedTier];

  const price = selectedPeriod === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice;
  const savings = selectedPeriod === 'yearly'
    ? ((pricing.monthlyPrice * 12 - pricing.yearlyPrice) / (pricing.monthlyPrice * 12) * 100).toFixed(0)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#374151]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {currentTier === SubscriptionTier.FREE ? '🚀 Pro\'ya Yükseltin' : '⚡ Enterprise\'a Yükseltin'}
              </h2>
              <p className="text-[#9CA3AF]">{reason}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Billing Period Toggle */}
        <div className="p-6 border-b border-[#374151]">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] text-white'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                selectedPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] text-white'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
              }`}
            >
              Yıllık
              {savings && (
                <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs px-2 py-0.5 rounded-full">
                  %{savings} İndirim
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-6 text-center border-b border-[#374151]">
          <div className="text-5xl font-bold mb-2">
            ${price}
            <span className="text-2xl text-[#9CA3AF]">/{selectedPeriod === 'monthly' ? 'ay' : 'yıl'}</span>
          </div>
          {savings && (
            <p className="text-[#10A37F] text-sm">
              Yıllık ödemede ${(pricing.monthlyPrice * 12 - pricing.yearlyPrice).toFixed(2)} tasarruf!
            </p>
          )}
        </div>

        {/* Features */}
        <div className="p-6 border-b border-[#374151]">
          <h3 className="text-lg font-semibold mb-4">✨ {recommendedTier === SubscriptionTier.PRO ? 'Pro' : 'Enterprise'} Özellikleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Feature
              icon="💬"
              text={limits.messagesPerDay === Infinity ? 'Sınırsız mesaj' : `${limits.messagesPerDay.toLocaleString()} mesaj/gün`}
            />
            <Feature
              icon="📁"
              text={`${(limits.maxFileSize / (1024 * 1024)).toFixed(0)} MB dosya boyutu`}
            />
            <Feature
              icon="💾"
              text={limits.storageQuota === Infinity ? 'Sınırsız depolama' : `${(limits.storageQuota / (1024 * 1024 * 1024)).toFixed(0)} GB depolama`}
            />
            <Feature
              icon="📞"
              text={limits.callDurationPerDay === Infinity ? 'Sınırsız arama' : `${limits.callDurationPerDay} dk arama/gün`}
            />
            <Feature
              icon="👥"
              text={`${limits.groupCallParticipants} kişilik grup araması`}
            />
            <Feature
              icon="📍"
              text={limits.locationShareDuration === Infinity ? 'Sınırsız konum paylaşımı' : `${limits.locationShareDuration} dk konum paylaşımı`}
            />
            {limits.canUseCustomEmoji && <Feature icon="😊" text="Özel emoji" />}
            {limits.prioritySupport && <Feature icon="⚡" text="Öncelikli destek" />}
            <Feature icon="🔒" text="E2EE şifreleme" />
            <Feature icon="🛡️" text="Güvenli depolama" />
          </div>
        </div>

        {/* CTA */}
        <div className="p-6">
          <button
            onClick={() => onUpgrade?.(recommendedTier, selectedPeriod)}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-bold text-lg transition-all transform hover:scale-105"
          >
            {recommendedTier === SubscriptionTier.PRO ? 'Pro\'ya Yükselt' : 'Enterprise\'a Yükselt'}
          </button>
          <p className="text-center text-xs text-[#6B7280] mt-3">
            İstediğiniz zaman iptal edebilirsiniz. Gizli ücret yok.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xl">{icon}</span>
      <span className="text-[#E5E7EB]">{text}</span>
    </div>
  );
}
