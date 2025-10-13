/**
 * SHARD_10.6 - Dashboard Demo
 * Interactive user dashboard with devices, stats, and activity
 *
 * Features:
 * - Device management
 * - Usage statistics
 * - Activity feed
 * - Security settings
 */

'use client';

import React, { useState } from 'react';
import DeviceList from '@/components/DeviceList';
import StatsCard, { StatsGrid } from '@/components/StatsCard';
import ActivityFeed from '@/components/ActivityFeed';
import {
  Device,
  registerDevice,
  getUserDevices,
  trustDevice as trustDeviceAction,
  untrustDevice as untrustDeviceAction,
  removeDevice as removeDeviceAction,
  setCurrentDevice
} from '@/lib/dashboard/devices';
import {
  getUserStats,
  trackMessageSent,
  trackMessageReceived,
  trackFileShared,
  trackCallMade,
  trackLocationShare,
  getRecentActivity,
  calculateWeeklyGrowth,
  logActivity
} from '@/lib/dashboard/statistics';

type LogEntry = { time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string };

export default function DashboardTestPage() {
  const [userId] = useState('demo-user');
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'activity' | 'settings'>('overview');

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [{ time, type, message }, ...prev].slice(0, 50));
  };

  // Initialize with sample devices
  React.useEffect(() => {
    if (devices.length === 0) {
      const device1 = registerDevice(userId, {
        name: 'MacBook Pro',
        type: 'desktop',
        os: 'macOS 14.2',
        browser: 'Chrome 120',
        publicKey: btoa('sample-public-key-1'),
        location: { city: 'İstanbul', country: 'Türkiye' }
      });

      const device2 = registerDevice(userId, {
        name: 'iPhone 15 Pro',
        type: 'mobile',
        os: 'iOS 17.2',
        publicKey: btoa('sample-public-key-2'),
        location: { city: 'İstanbul', country: 'Türkiye' }
      });

      const device3 = registerDevice(userId, {
        name: 'Chrome Browser',
        type: 'web',
        os: 'Windows 11',
        browser: 'Chrome 120',
        publicKey: btoa('sample-public-key-3')
      });

      setCurrentDevice(userId, device1.id);
      trustDeviceAction(userId, device1.id);
      trustDeviceAction(userId, device2.id);

      setDevices(getUserDevices(userId));
      addLog('✅ Dashboard başlatıldı - 3 cihaz yüklendi', 'success');
    }
  }, []);

  const stats = getUserStats(userId);
  const activities = getRecentActivity(userId);
  const growth = calculateWeeklyGrowth(userId);

  const simulateMessage = () => {
    trackMessageSent(userId);
    setDevices(getUserDevices(userId));
    addLog('💬 Mesaj gönderildi', 'success');
  };

  const simulateFile = () => {
    const size = Math.floor(Math.random() * 50 * 1024 * 1024); // 0-50MB
    trackFileShared(userId, size);
    setDevices(getUserDevices(userId));
    addLog(`📁 Dosya yüklendi (${(size / (1024 * 1024)).toFixed(1)} MB)`, 'success');
  };

  const simulateCall = () => {
    const duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    trackCallMade(userId, duration);
    setDevices(getUserDevices(userId));
    addLog(`📞 Arama tamamlandı (${duration} dk)`, 'success');
  };

  const simulateLocation = () => {
    trackLocationShare(userId);
    setDevices(getUserDevices(userId));
    addLog('📍 Konum paylaşıldı', 'success');
  };

  const addNewDevice = () => {
    const types: Device['type'][] = ['desktop', 'mobile', 'tablet', 'web'];
    const names = ['iPad Air', 'Linux Desktop', 'Android Phone', 'Firefox Browser'];
    const oses = ['iPadOS 17', 'Ubuntu 22.04', 'Android 14', 'Windows 11'];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomIndex = types.indexOf(randomType);

    const device = registerDevice(userId, {
      name: names[randomIndex],
      type: randomType,
      os: oses[randomIndex],
      browser: randomType === 'web' ? 'Firefox 121' : undefined,
      publicKey: btoa(`sample-key-${Date.now()}`),
      location: { city: 'Ankara', country: 'Türkiye' }
    });

    setDevices(getUserDevices(userId));
    logActivity(userId, 'device', 'added', { deviceName: device.name });
    addLog(`🖥️ Yeni cihaz eklendi: ${device.name}`, 'success');
  };

  const handleTrustDevice = (deviceId: string) => {
    trustDeviceAction(userId, deviceId);
    setDevices(getUserDevices(userId));
    addLog('✓ Cihaz güvenilir olarak işaretlendi', 'success');
  };

  const handleUntrustDevice = (deviceId: string) => {
    untrustDeviceAction(userId, deviceId);
    setDevices(getUserDevices(userId));
    addLog('⚠️ Cihaz güvenilir listesinden çıkarıldı', 'warning');
  };

  const handleRemoveDevice = (deviceId: string) => {
    try {
      removeDeviceAction(userId, deviceId);
      setDevices(getUserDevices(userId));
      logActivity(userId, 'device', 'removed');
      addLog('🗑️ Cihaz kaldırıldı', 'success');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`, 'error');
    }
  };

  const revokeAllSessions = () => {
    addLog('🔒 Tüm diğer oturumlar sonlandırıldı', 'success');
    logActivity(userId, 'settings', 'revoked_sessions');
  };

  const simulateHeavyActivity = () => {
    for (let i = 0; i < 10; i++) {
      trackMessageSent(userId);
      if (i % 3 === 0) trackFileShared(userId, 5 * 1024 * 1024);
      if (i % 5 === 0) trackCallMade(userId, 10);
    }
    setDevices(getUserDevices(userId));
    addLog('⚡ Yoğun aktivite simüle edildi', 'warning');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Kullanıcı Dashboard</h1>
          <p className="text-[#9CA3AF]">
            Cihazlarınızı yönetin, kullanım istatistiklerinizi görün
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addNewDevice}
            className="px-4 py-2 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all"
          >
            + Cihaz Ekle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#374151]">
        <TabButton
          label="Genel Bakış"
          icon="📊"
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          label="Cihazlar"
          icon="🖥️"
          active={activeTab === 'devices'}
          onClick={() => setActiveTab('devices')}
          badge={devices.length}
        />
        <TabButton
          label="Aktivite"
          icon="📝"
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          badge={activities.length}
        />
        <TabButton
          label="Ayarlar"
          icon="⚙️"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <StatsGrid>
            <StatsCard
              icon="💬"
              label="Toplam Mesaj"
              value={stats.totalMessages}
              trend={growth.messages !== 0 ? { value: growth.messages, direction: growth.messages > 0 ? 'up' : 'down' } : undefined}
              subtitle="Bu hafta"
            />
            <StatsCard
              icon="📁"
              label="Paylaşılan Dosya"
              value={stats.totalFiles}
              trend={growth.files !== 0 ? { value: growth.files, direction: growth.files > 0 ? 'up' : 'down' } : undefined}
              subtitle="Toplam"
              color="#3B82F6"
            />
            <StatsCard
              icon="📞"
              label="Aramalar"
              value={stats.totalCalls}
              trend={growth.calls !== 0 ? { value: growth.calls, direction: growth.calls > 0 ? 'up' : 'down' } : undefined}
              subtitle="Toplam"
              color="#8B5CF6"
            />
            <StatsCard
              icon="⏱️"
              label="Arama Süresi"
              value={`${stats.totalCallMinutes} dk`}
              subtitle="Toplam"
              color="#F59E0B"
            />
          </StatsGrid>

          {/* Quick Actions */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">⚡ Hızlı Eylemler</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <ActionButton icon="💬" label="Mesaj Simüle Et" onClick={simulateMessage} />
              <ActionButton icon="📁" label="Dosya Yükle" onClick={simulateFile} />
              <ActionButton icon="📞" label="Arama Yap" onClick={simulateCall} />
              <ActionButton icon="📍" label="Konum Paylaş" onClick={simulateLocation} />
              <ActionButton
                icon="⚡"
                label="Yoğun Aktivite"
                onClick={simulateHeavyActivity}
                variant="warning"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📝 Son Aktiviteler</h2>
            <ActivityFeed activities={activities} maxItems={5} />
            {activities.length > 5 && (
              <button
                onClick={() => setActiveTab('activity')}
                className="w-full mt-4 py-2 text-sm text-[#10A37F] hover:text-[#0D8F6E] transition-colors"
              >
                Tümünü Göster →
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">🖥️ Cihazlarım ({devices.length})</h2>
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-[#10A37F]/20 text-[#10A37F]">
                  {devices.filter((d) => d.isTrusted).length} Güvenilir
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F59E0B]/20 text-[#F59E0B]">
                  {devices.filter((d) => !d.isTrusted).length} Güvenilir Değil
                </span>
              </div>
            </div>
            <DeviceList
              devices={devices}
              onTrustDevice={handleTrustDevice}
              onUntrustDevice={handleUntrustDevice}
              onRemoveDevice={handleRemoveDevice}
            />
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">📝 Tüm Aktiviteler</h2>
          <ActivityFeed activities={activities} maxItems={50} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🔒 Güvenlik Ayarları</h2>
            <div className="space-y-4">
              <SettingItem
                icon="🔐"
                title="Tüm Oturumları Sonlandır"
                description="Mevcut cihaz hariç tüm diğer cihazlardaki oturumları sonlandırın"
                action={
                  <button
                    onClick={revokeAllSessions}
                    className="px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold transition-all"
                  >
                    Sonlandır
                  </button>
                }
              />
              <SettingItem
                icon="🔑"
                title="E2EE Anahtarları"
                description="Şifreleme anahtarlarınızı yönetin"
                action={
                  <button className="px-4 py-2 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white font-semibold transition-all">
                    Yönet
                  </button>
                }
              />
              <SettingItem
                icon="🛡️"
                title="İki Faktörlü Kimlik Doğrulama"
                description="Hesabınıza ekstra güvenlik katmanı ekleyin"
                action={
                  <button className="px-4 py-2 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all">
                    Etkinleştir
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📊 Konsol Logları</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-[#6B7280] text-sm">Henüz log yok</p>
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
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
  badge
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative ${
        active
          ? 'text-[#10A37F] border-b-2 border-[#10A37F]'
          : 'text-[#9CA3AF] hover:text-white'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-[#10A37F] text-white text-xs font-bold">
          {badge}
        </span>
      )}
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
  variant?: 'primary' | 'warning';
}) {
  const styles = {
    primary: 'bg-[#1F2937] hover:bg-[#374151] text-white',
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

function SettingItem({
  icon,
  title,
  description,
  action
}: {
  icon: string;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#1F2937] rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-[#9CA3AF]">{description}</p>
      </div>
      {action}
    </div>
  );
}
