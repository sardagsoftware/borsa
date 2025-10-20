'use client';

/**
 * YÖNETİM PANELİ
 *
 * Özellik bayrakları ve A/B test yönetim paneli
 * - Özellik bayraklarını yönet
 * - Deney sonuçlarını görüntüle
 * - Override kontrolü
 *
 * BEYAZ ŞAPKA:
 * - Geliştirme/test için
 * - Production'da şifre korumalı
 * - Denetim kaydı hazır
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { FlagList } from '@/components/admin/FlagList';
import { ExperimentResults } from '@/components/admin/ExperimentResults';
import { useUserFlagInfo } from '@/hooks/useFeatureFlag';

type TabType = 'flags' | 'experiments' | 'info';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('flags');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [loggingOut, setLoggingOut] = useState(false);

  const userInfo = useUserFlagInfo();

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      setLoggingOut(true);
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error('Logout error:', error);
        setLoggingOut(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">⚙️ Yönetim Paneli</h1>
              <p className="text-sm text-gray-400 mt-1">
                Özellik Bayrakları & A/B Test Kontrol Merkezi
              </p>
            </div>

            {/* User info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="text-gray-500">Kullanıcı ID</div>
                <div className="font-mono text-white">{userInfo.userId.slice(0, 16)}...</div>
                <div className="text-gray-500 mt-1">Hash: {userInfo.userHash}</div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('flags')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  activeTab === 'flags'
                    ? 'bg-accent-blue text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              🚩 Özellik Bayrakları
            </button>
            <button
              onClick={() => setActiveTab('experiments')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  activeTab === 'experiments'
                    ? 'bg-accent-blue text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              📊 Deneyler
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  activeTab === 'info'
                    ? 'bg-accent-blue text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              ℹ️ Bilgi
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Flags tab */}
        {activeTab === 'flags' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bayrak ara..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent-blue/50"
              />

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent-blue/50"
              >
                <option value="all">Tüm Bayraklar</option>
                <option value="enabled">Sadece Aktifler</option>
                <option value="disabled">Sadece Pasifler</option>
              </select>
            </div>

            {/* Flag list */}
            <FlagList searchQuery={searchQuery} filterStatus={filterStatus} />
          </div>
        )}

        {/* Experiments tab */}
        {activeTab === 'experiments' && <ExperimentResults />}

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* System info */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Sistem Bilgileri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Kullanıcı ID</div>
                  <div className="font-mono text-white break-all">{userInfo.userId}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Kullanıcı Hash</div>
                  <div className="font-mono text-white">{userInfo.userHash}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Aktif Bayraklar</div>
                  <div className="font-mono text-white">{userInfo.enabledFlags.length}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Tarayıcı</div>
                  <div className="font-mono text-white text-xs">
                    {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Active flags */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Bu Kullanıcı için Aktif Bayraklar</h2>

              {userInfo.enabledFlags.length > 0 ? (
                <div className="space-y-2">
                  {userInfo.enabledFlags.map((flag) => (
                    <div
                      key={flag}
                      className="flex items-center justify-between p-3 bg-white/5 rounded"
                    >
                      <span className="font-mono text-sm">{flag}</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        AKTİF
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">Bu kullanıcı için aktif bayrak yok</div>
              )}
            </div>

            {/* Documentation */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📚 Dokümantasyon</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-bold text-white mb-2">Özellik Bayrakları</h3>
                  <p className="text-gray-400">
                    Özellik bayrakları, belirli kullanıcılar veya yüzdeler için özellikleri aktif/pasif etmenizi sağlar.
                    Bayrakları gerçek zamanlı kontrol etmek için geçiş anahtarlarını kullanın.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-2">A/B Testleri</h3>
                  <p className="text-gray-400">
                    A/B testleri, en iyi performans gösteren seçeneği bulmak için farklı varyantları karşılaştırır.
                    Sonuçlar dönüşüm oranlarını, istatistiksel anlamlılığı ve kazanan tespitini gösterir.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-2">Override (Geçersiz Kılma)</h3>
                  <p className="text-gray-400">
                    Override'lar, test için bayrakları manuel olarak aktif/pasif etmenizi sağlar.
                    Yerel olarak saklanırlar ve 7 gün sonra sona ererler.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="font-bold text-yellow-400 mb-2">⚠️ Production Uyarısı</h3>
                  <p className="text-gray-400">
                    Bu yönetim paneli production'da şifre ile korunmalıdır.
                    Burada yapılan değişiklikler canlı uygulamayı etkiler.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
