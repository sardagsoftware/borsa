'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import { SessionProvider } from 'next-auth/react';
import ConnectionStatus from '@/components/ConnectionStatus';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import Logo from '@/components/Logo';
import AIChat from '@/components/AIChat';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  riskLevel: string;
  maxDailyLoss: number;
  twoFactorEnabled: boolean;
  isActive: boolean;
}

interface ApiKeyData {
  id: string;
  exchange: string;
  name: string;
  isTestnet: boolean;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

interface RiskSettings {
  maxDailyLoss: number;
  maxPositionSize: number;
  maxLeverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxPositions: number;
  maxCorrelation: number;
  aiTradingEnabled: boolean;
  minAiConfidence: number;
}

function UserDashboardInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // States for different sections
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  
  // API Key Form
  const [newApiKey, setNewApiKey] = useState({
    exchange: 'BINANCE',
    name: '',
    apiKey: '',
    secretKey: '',
    passphrase: '',
    isTestnet: true,
    permissions: ['READ'] as string[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);
      }

      // Fetch API keys
      const apiKeysRes = await fetch('/api/user/api-keys');
      if (apiKeysRes.ok) {
        const apiKeysData = await apiKeysRes.json();
        setApiKeys(apiKeysData.apiKeys);
      }

      // Fetch risk settings
      const riskRes = await fetch('/api/user/risk-settings');
      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskSettings(riskData.settings);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApiKey),
      });

      if (response.ok) {
        setShowApiKeyForm(false);
        setNewApiKey({
          exchange: 'BINANCE',
          name: '',
          apiKey: '',
          secretKey: '',
          passphrase: '',
          isTestnet: true,
          permissions: ['READ'],
        });
        fetchUserData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      alert('Failed to add API key');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRiskSettings = async () => {
    if (!riskSettings) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/user/risk-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(riskSettings),
      });

      if (response.ok) {
        alert('Risk settings updated successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating risk settings:', error);
      alert('Failed to update risk settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-binance-dark flex items-center justify-center">
        <div className="text-binance-text">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-binance-dark flex flex-col">
      {/* Top Status Bar */}
      <div className="w-full bg-panel/80 backdrop-blur-sm border-b border-glass/30 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Connection Status */}
          <ConnectionStatus className="flex-shrink-0" />
          
          {/* Center - Crypto Ticker */}
          <div className="flex-1 mx-6">
            <CryptoPriceTicker 
              showTop={100}
              autoScroll={true}
              updateInterval={30000}
            />
          </div>
          
          {/* Right - User Info */}
          <div className="flex items-center gap-4 text-xs text-muted flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Güvenli Bağlantı</span>
            </div>
            <span>•</span>
            <span className="text-green-500 font-medium">{profile?.name || session?.user?.email}</span>
            <span>•</span>
            <span>{new Date().toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <Logo size="lg" className="flex-shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-binance-text mb-2">
                👤 Kontrol Paneli
              </h1>
              <p className="text-binance-textSecondary">
                Hoş geldin, {profile?.name || profile?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/ai-lens/trader')}
              className="btn-primary"
            >
              📊 İşlem Terminali
            </button>
            <button
              onClick={() => signOut()}
              className="btn-secondary"
            >
              🚪 Güvenli Çıkış
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6">
          {[
            { id: 'profile', label: '👤 Profil', icon: '👤' },
            { id: 'api-keys', label: '🔑 API Anahtarları', icon: '🔑' },
            { id: 'risk', label: '⚠️ Risk Ayarları', icon: '⚠️' },
            { id: 'security', label: '🔒 Güvenlik', icon: '🔒' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-binance-panel text-binance-yellow border-b-2 border-binance-yellow'
                  : 'bg-binance-dark text-binance-textSecondary hover:text-binance-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="panel p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-binance-text mb-4">Profil Bilgileri</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    className="input-primary w-full"
                    placeholder="Adınızı girin"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">E-posta</label>
                  <input
                    type="email"
                    value={profile.email}
                    className="input-primary w-full"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Risk Seviyesi</label>
                  <select className="input-primary w-full">
                    <option value="LOW">Düşük Risk</option>
                    <option value="MEDIUM">Orta Risk</option>
                    <option value="HIGH">Yüksek Risk</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Maksimum Günlük Zarar ($)</label>
                  <input
                    type="number"
                    value={profile.maxDailyLoss}
                    className="input-primary w-full"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              
              <button className="btn-primary">
                💾 Profili Güncelle
              </button>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-binance-text">API Anahtarları</h2>
                <button
                  onClick={() => setShowApiKeyForm(true)}
                  className="btn-primary"
                >
                  ➕ API Anahtarı Ekle
                </button>
              </div>

              {/* API Keys List */}
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="bg-binance-dark p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-binance-yellow font-bold">{key.exchange}</span>
                          <span className="text-binance-text">{key.name}</span>
                          {key.isTestnet && (
                            <span className="bg-binance-blue px-2 py-1 rounded text-xs text-white">
                              TESTNET
                            </span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${
                            key.isActive ? 'bg-binance-green' : 'bg-binance-red'
                          }`}></span>
                        </div>
                        <div className="text-binance-textSecondary text-sm mt-1">
                          İzinler: {key.permissions.join(', ')} • Oluşturulma: {new Date(key.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="btn-sell text-sm"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
                
                {apiKeys.length === 0 && (
                  <div className="text-center py-8 text-binance-textSecondary">
                    Henüz API anahtarı yapılandırılmamış. İşlem yapmaya başlamak için ilk API anahtarınızı ekleyin.
                  </div>
                )}
              </div>

              {/* Add API Key Form */}
              {showApiKeyForm && (
                <div className="bg-binance-dark p-6 rounded-lg border border-binance-yellow">
                  <h3 className="text-xl font-bold text-binance-text mb-4">Yeni API Anahtarı Ekle</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-binance-text font-semibold mb-2">Borsa</label>
                      <select
                        value={newApiKey.exchange}
                        onChange={(e) => setNewApiKey({...newApiKey, exchange: e.target.value})}
                        className="input-primary w-full"
                      >
                        <option value="BINANCE">Binance</option>
                        <option value="BYBIT">Bybit</option>
                        <option value="OKX">OKX</option>
                        <option value="KRAKEN">Kraken</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-binance-text font-semibold mb-2">İsim</label>
                      <input
                        type="text"
                        value={newApiKey.name}
                        onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
                        className="input-primary w-full"
                        placeholder="Benim İşlem Anahtarım"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-binance-text font-semibold mb-2">API Anahtarı</label>
                      <input
                        type="password"
                        value={newApiKey.apiKey}
                        onChange={(e) => setNewApiKey({...newApiKey, apiKey: e.target.value})}
                        className="input-primary w-full"
                        placeholder="API anahtarınızı girin"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-binance-text font-semibold mb-2">Gizli Anahtar</label>
                      <input
                        type="password"
                        value={newApiKey.secretKey}
                        onChange={(e) => setNewApiKey({...newApiKey, secretKey: e.target.value})}
                        className="input-primary w-full"
                        placeholder="Gizli anahtarınızı girin"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="testnet"
                        checked={newApiKey.isTestnet}
                        onChange={(e) => setNewApiKey({...newApiKey, isTestnet: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="testnet" className="text-binance-text">Test Ağı Kullan</label>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleAddApiKey}
                      className="btn-primary"
                      disabled={!newApiKey.apiKey || !newApiKey.secretKey || !newApiKey.name}
                    >
                      💾 API Anahtarı Kaydet
                    </button>
                    <button
                      onClick={() => setShowApiKeyForm(false)}
                      className="btn-secondary"
                    >
                      ❌ İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk Settings Tab */}
          {activeTab === 'risk' && riskSettings && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-binance-text mb-4">Risk Yönetimi Ayarları</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Maksimum Günlük Zarar ($)</label>
                  <input
                    type="number"
                    value={riskSettings.maxDailyLoss}
                    onChange={(e) => setRiskSettings({...riskSettings, maxDailyLoss: parseFloat(e.target.value)})}
                    className="input-primary w-full"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Maksimum Pozisyon Boyutu ($)</label>
                  <input
                    type="number"
                    value={riskSettings.maxPositionSize}
                    onChange={(e) => setRiskSettings({...riskSettings, maxPositionSize: parseFloat(e.target.value)})}
                    className="input-primary w-full"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Maksimum Kaldıraç</label>
                  <input
                    type="number"
                    value={riskSettings.maxLeverage}
                    onChange={(e) => setRiskSettings({...riskSettings, maxLeverage: parseFloat(e.target.value)})}
                    className="input-primary w-full"
                    min="1"
                    max="125"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Zarar Durdur (%)</label>
                  <input
                    type="number"
                    value={riskSettings.stopLossPercent}
                    onChange={(e) => setRiskSettings({...riskSettings, stopLossPercent: parseFloat(e.target.value)})}
                    className="input-primary w-full"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Kar Al (%)</label>
                  <input
                    type="number"
                    value={riskSettings.takeProfitPercent}
                    onChange={(e) => setRiskSettings({...riskSettings, takeProfitPercent: parseFloat(e.target.value)})}
                    className="input-primary w-full"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Maksimum Pozisyon Sayısı</label>
                  <input
                    type="number"
                    value={riskSettings.maxPositions}
                    onChange={(e) => setRiskSettings({...riskSettings, maxPositions: parseInt(e.target.value)})}
                    className="input-primary w-full"
                    min="1"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block text-binance-text font-semibold mb-2">Minimum AI Güven Seviyesi</label>
                  <input
                    type="range"
                    value={riskSettings.minAiConfidence}
                    onChange={(e) => setRiskSettings({...riskSettings, minAiConfidence: parseFloat(e.target.value)})}
                    className="w-full"
                    min="0.1"
                    max="1"
                    step="0.05"
                  />
                  <div className="text-binance-textSecondary text-sm mt-1">
                    %{(riskSettings.minAiConfidence * 100).toFixed(0)} güven seviyesi gerekli
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aiTrading"
                      checked={riskSettings.aiTradingEnabled}
                      onChange={(e) => setRiskSettings({...riskSettings, aiTradingEnabled: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="aiTrading" className="text-binance-text font-semibold">
                      AI İşlem Sistemini Etkinleştir
                    </label>
                  </div>
                  <p className="text-binance-textSecondary text-sm mt-1">
                    AI sisteminin sinyallere dayalı otomatik işlem yapmasına izin ver
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleUpdateRiskSettings}
                className="btn-primary"
              >
                💾 Risk Ayarlarını Güncelle
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-binance-text mb-4">Güvenlik Ayarları</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="panel p-4">
                  <h3 className="text-lg font-bold text-binance-text mb-3">İki Faktörlü Kimlik Doğrulama</h3>
                  <p className="text-binance-textSecondary mb-4">
                    Hesabınıza ekstra güvenlik katmanı ekleyin
                  </p>
                  <button className="btn-primary">
                    🔐 2FA Kurulumu
                  </button>
                </div>
                
                <div className="panel p-4">
                  <h3 className="text-lg font-bold text-binance-text mb-3">Şifre Değiştir</h3>
                  <p className="text-binance-textSecondary mb-4">
                    Hesap şifrenizi güncelleyin
                  </p>
                  <button className="btn-secondary">
                    🔑 Şifre Değiştir
                  </button>
                </div>
                
                <div className="panel p-4">
                  <h3 className="text-lg font-bold text-binance-text mb-3">Acil Durdurma</h3>
                  <p className="text-binance-textSecondary mb-4">
                    Tüm işlem aktivitelerini anında durdur
                  </p>
                  <button className="btn-sell">
                    🛑 Acil Stop
                  </button>
                </div>
                
                <div className="panel p-4">
                  <h3 className="text-lg font-bold text-binance-text mb-3">Oturum Yönetimi</h3>
                  <p className="text-binance-textSecondary mb-4">
                    Aktif oturumları görüntüleyin ve yönetin
                  </p>
                  <button className="btn-secondary">
                    👁️ Oturumları Görüntüle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      
      {/* AI Chat - Floating */}
      <AIChat compact={true} placeholder="Dashboard hakkında soru sorun..." />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <SessionProvider>
      <UserDashboardInner />
    </SessionProvider>
  );
}
