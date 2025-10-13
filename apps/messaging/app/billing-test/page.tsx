/**
 * SHARD_9.6 - Billing System Demo
 * Interactive demonstration of quota management and entitlements
 *
 * Features:
 * - Tier comparison
 * - Usage tracking simulation
 * - Quota enforcement
 * - Upgrade/downgrade flow
 * - Paywall modals
 */

'use client';

import React, { useState } from 'react';
import PaywallModal from '@/components/PaywallModal';
import UsagePanel from '@/components/UsagePanel';
import { SubscriptionTier } from '@/lib/billing/types';

type LogEntry = { time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string };

export default function BillingTestPage() {
  const [userId] = useState('demo-user');
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const [usage, setUsage] = useState({
    messages: { used: 0, limit: 100, percentage: 0 },
    files: { used: 0, limit: 20, percentage: 0 },
    storage: { used: 0, limit: 100 * 1024 * 1024, percentage: 0 },
    calls: { used: 0, limit: 30, percentage: 0 },
    locationShares: { used: 0, limit: 5, percentage: 0 },
    timeUntilReset: '23s 45dk'
  });

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [{ time, type, message }, ...prev].slice(0, 100));
  };

  const updateUsageLimits = (tier: SubscriptionTier) => {
    const limits = {
      [SubscriptionTier.FREE]: {
        messages: 100,
        files: 20,
        storage: 100 * 1024 * 1024,
        calls: 30,
        locationShares: 5
      },
      [SubscriptionTier.PRO]: {
        messages: 1000,
        files: 200,
        storage: 10 * 1024 * 1024 * 1024,
        calls: 240,
        locationShares: 50
      },
      [SubscriptionTier.ENTERPRISE]: {
        messages: Infinity,
        files: Infinity,
        storage: 1024 * 1024 * 1024 * 1024,
        calls: Infinity,
        locationShares: Infinity
      }
    };

    const tierLimits = limits[tier];

    setUsage((prev) => ({
      messages: {
        ...prev.messages,
        limit: tierLimits.messages,
        percentage: tierLimits.messages === Infinity ? 0 : (prev.messages.used / tierLimits.messages) * 100
      },
      files: {
        ...prev.files,
        limit: tierLimits.files,
        percentage: tierLimits.files === Infinity ? 0 : (prev.files.used / tierLimits.files) * 100
      },
      storage: {
        ...prev.storage,
        limit: tierLimits.storage,
        percentage: (prev.storage.used / tierLimits.storage) * 100
      },
      calls: {
        ...prev.calls,
        limit: tierLimits.calls,
        percentage: tierLimits.calls === Infinity ? 0 : (prev.calls.used / tierLimits.calls) * 100
      },
      locationShares: {
        ...prev.locationShares,
        limit: tierLimits.locationShares,
        percentage: tierLimits.locationShares === Infinity ? 0 : (prev.locationShares.used / tierLimits.locationShares) * 100
      },
      timeUntilReset: prev.timeUntilReset
    }));
  };

  const simulateSendMessage = async () => {
    addLog('🔍 Mesaj gönderme limiti kontrol ediliyor...');

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (usage.messages.used >= usage.messages.limit && usage.messages.limit !== Infinity) {
      addLog('❌ Günlük mesaj limitine ulaştınız', 'error');
      setPaywallReason('Günlük mesaj limitine ulaştınız. Daha fazla mesaj göndermek için planınızı yükseltin.');
      setShowPaywall(true);
      return;
    }

    setUsage((prev) => {
      const newUsed = prev.messages.used + 1;
      return {
        ...prev,
        messages: {
          ...prev.messages,
          used: newUsed,
          percentage: prev.messages.limit === Infinity ? 0 : (newUsed / prev.messages.limit) * 100
        }
      };
    });

    addLog('✅ Mesaj gönderildi', 'success');
  };

  const simulateUploadFile = async () => {
    addLog('🔍 Dosya yükleme limiti kontrol ediliyor...');

    const fileSize = Math.floor(Math.random() * 50 * 1024 * 1024); // Random 0-50MB
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (usage.files.used >= usage.files.limit && usage.files.limit !== Infinity) {
      addLog('❌ Günlük dosya yükleme limitine ulaştınız', 'error');
      setPaywallReason('Günlük dosya yükleme limitine ulaştınız. Daha fazla dosya yüklemek için planınızı yükseltin.');
      setShowPaywall(true);
      return;
    }

    const maxFileSize = currentTier === SubscriptionTier.FREE ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (fileSize > maxFileSize) {
      addLog(`❌ Dosya çok büyük (${(fileSize / (1024 * 1024)).toFixed(1)} MB). Maksimum: ${maxFileSize / (1024 * 1024)} MB`, 'error');
      setPaywallReason(`Dosya boyutu limitiniz ${maxFileSize / (1024 * 1024)} MB. Daha büyük dosyalar yüklemek için planınızı yükseltin.`);
      setShowPaywall(true);
      return;
    }

    setUsage((prev) => {
      const newFilesUsed = prev.files.used + 1;
      const newStorageUsed = prev.storage.used + fileSize;
      return {
        ...prev,
        files: {
          ...prev.files,
          used: newFilesUsed,
          percentage: prev.files.limit === Infinity ? 0 : (newFilesUsed / prev.files.limit) * 100
        },
        storage: {
          ...prev.storage,
          used: newStorageUsed,
          percentage: (newStorageUsed / prev.storage.limit) * 100
        }
      };
    });

    addLog(`✅ Dosya yüklendi (${(fileSize / (1024 * 1024)).toFixed(1)} MB)`, 'success');
  };

  const simulateCall = async () => {
    addLog('🔍 Arama süresi limiti kontrol ediliyor...');

    const duration = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (usage.calls.used + duration > usage.calls.limit && usage.calls.limit !== Infinity) {
      addLog('❌ Günlük arama süresi limitine ulaştınız', 'error');
      setPaywallReason('Günlük arama süresi limitinizi aştınız. Daha uzun aramalar için planınızı yükseltin.');
      setShowPaywall(true);
      return;
    }

    setUsage((prev) => {
      const newUsed = prev.calls.used + duration;
      return {
        ...prev,
        calls: {
          ...prev.calls,
          used: newUsed,
          percentage: prev.calls.limit === Infinity ? 0 : (newUsed / prev.calls.limit) * 100
        }
      };
    });

    addLog(`✅ Arama tamamlandı (${duration} dk)`, 'success');
  };

  const simulateLocationShare = async () => {
    addLog('🔍 Konum paylaşım limiti kontrol ediliyor...');

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (usage.locationShares.used >= usage.locationShares.limit && usage.locationShares.limit !== Infinity) {
      addLog('❌ Günlük konum paylaşım limitine ulaştınız', 'error');
      setPaywallReason('Günlük konum paylaşım limitine ulaştınız. Daha fazla paylaşım için planınızı yükseltin.');
      setShowPaywall(true);
      return;
    }

    setUsage((prev) => {
      const newUsed = prev.locationShares.used + 1;
      return {
        ...prev,
        locationShares: {
          ...prev.locationShares,
          used: newUsed,
          percentage: prev.locationShares.limit === Infinity ? 0 : (newUsed / prev.locationShares.limit) * 100
        }
      };
    });

    addLog('✅ Konum paylaşıldı', 'success');
  };

  const changeTier = (tier: SubscriptionTier) => {
    setCurrentTier(tier);
    updateUsageLimits(tier);
    addLog(`🎯 Plan değiştirildi: ${getTierName(tier)}`, 'success');
  };

  const handleUpgrade = (tier: SubscriptionTier, period: 'monthly' | 'yearly') => {
    changeTier(tier);
    setShowPaywall(false);
    addLog(`🚀 ${getTierName(tier)} planına yükseltildi (${period === 'monthly' ? 'Aylık' : 'Yıllık'})`, 'success');
  };

  const resetUsage = () => {
    setUsage((prev) => ({
      messages: { ...prev.messages, used: 0, percentage: 0 },
      files: { ...prev.files, used: 0, percentage: 0 },
      storage: { ...prev.storage, used: 0, percentage: 0 },
      calls: { ...prev.calls, used: 0, percentage: 0 },
      locationShares: { ...prev.locationShares, used: 0, percentage: 0 },
      timeUntilReset: prev.timeUntilReset
    }));
    addLog('🔄 Kullanım istatistikleri sıfırlandı', 'info');
  };

  const simulateHeavyUsage = () => {
    setUsage((prev) => ({
      messages: {
        ...prev.messages,
        used: Math.floor(prev.messages.limit * 0.95),
        percentage: 95
      },
      files: {
        ...prev.files,
        used: Math.floor(prev.files.limit * 0.88),
        percentage: 88
      },
      storage: {
        ...prev.storage,
        used: Math.floor(prev.storage.limit * 0.92),
        percentage: 92
      },
      calls: {
        ...prev.calls,
        used: Math.floor(prev.calls.limit * 0.78),
        percentage: 78
      },
      locationShares: {
        ...prev.locationShares,
        used: Math.floor(prev.locationShares.limit * 0.80),
        percentage: 80
      },
      timeUntilReset: prev.timeUntilReset
    }));
    addLog('⚡ Yoğun kullanım simüle edildi', 'warning');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">💳 Billing & Entitlements</h1>
        <p className="text-[#9CA3AF]">
          Kota yönetimi, kullanım takibi ve abonelik sistemi demo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Selection */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Mevcut Plan</h2>
            <div className="flex gap-3">
              <TierButton
                tier={SubscriptionTier.FREE}
                currentTier={currentTier}
                onClick={() => changeTier(SubscriptionTier.FREE)}
              />
              <TierButton
                tier={SubscriptionTier.PRO}
                currentTier={currentTier}
                onClick={() => changeTier(SubscriptionTier.PRO)}
              />
              <TierButton
                tier={SubscriptionTier.ENTERPRISE}
                currentTier={currentTier}
                onClick={() => changeTier(SubscriptionTier.ENTERPRISE)}
              />
            </div>
          </div>

          {/* Action Simulations */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🧪 Eylem Simülasyonları</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon="💬" label="Mesaj Gönder" onClick={simulateSendMessage} />
              <ActionButton icon="📁" label="Dosya Yükle" onClick={simulateUploadFile} />
              <ActionButton icon="📞" label="Arama Yap" onClick={simulateCall} />
              <ActionButton icon="📍" label="Konum Paylaş" onClick={simulateLocationShare} />
              <ActionButton icon="⚡" label="Yoğun Kullanım" onClick={simulateHeavyUsage} variant="warning" />
              <ActionButton icon="🔄" label="Kullanımı Sıfırla" onClick={resetUsage} variant="secondary" />
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📊 Konsol Logları</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-[#6B7280] text-sm">Henüz log yok. Bir eylem deneyin.</p>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded ${
                      log.type === 'error'
                        ? 'bg-[#EF4444]/10 text-[#EF4444]'
                        : log.type === 'warning'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        : log.type === 'success'
                        ? 'bg-[#10A37F]/10 text-[#10A37F]'
                        : 'bg-[#374151] text-[#E5E7EB]'
                    }`}
                  >
                    <span className="text-[#6B7280] mr-2">[{log.time}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Usage Panel */}
        <div>
          <UsagePanel tier={currentTier} usage={usage} onUpgradeClick={() => setShowPaywall(true)} />
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentTier={currentTier}
        reason={paywallReason}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}

function TierButton({
  tier,
  currentTier,
  onClick
}: {
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  onClick: () => void;
}) {
  const isActive = tier === currentTier;
  const name = getTierName(tier);

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
        isActive
          ? 'bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] text-white'
          : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
      }`}
    >
      {name}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'primary'
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'warning';
}) {
  const styles = {
    primary: 'bg-[#1F2937] hover:bg-[#374151] text-white',
    secondary: 'bg-[#374151] hover:bg-[#4B5563] text-[#9CA3AF]',
    warning: 'bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/50'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${styles[variant]}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
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
