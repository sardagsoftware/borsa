'use client';

/**
 * SHARD_8.6 - Location Sharing Demo
 * Live location tracking and encrypted streaming demonstration
 */

import { useState, useEffect, useRef } from 'react';
import LocationMap from '@/components/LocationMap';

export default function LocationTestPage() {
  const [status, setStatus] = useState<string>('Hazır');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSession, setShareSession] = useState<any>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [otherLocations, setOtherLocations] = useState<any[]>([]);
  const [permission, setPermission] = useState<PermissionState>('prompt');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { checkLocationPermission } = await import('@/lib/location/geolocation');
      const state = await checkLocationPermission();
      setPermission(state);
      addLog(`📍 Konum izni: ${state}`);
    } catch (error) {
      addLog('⚠️ İzin kontrolü başarısız');
    }
  };

  // Test 1: Get Current Location
  const getLocation = async () => {
    setStatus('Konum alınıyor...');
    addLog('📍 Mevcut konum isteniyor...');

    try {
      const { getCurrentPosition, formatCoordinates } = await import('@/lib/location/geolocation');
      const location = await getCurrentPosition();

      setCurrentLocation(location);
      addLog(`✅ Konum alındı: ${formatCoordinates(location.latitude, location.longitude)}`);
      addLog(`   Doğruluk: ±${Math.round(location.accuracy)}m`);

      if (location.altitude) {
        addLog(`   Yükseklik: ${Math.round(location.altitude)}m`);
      }

      setStatus('✅ Konum alındı');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 2: Start Live Tracking
  const startLiveTracking = async () => {
    if (isSharing) {
      addLog('⚠️ Zaten paylaşım aktif');
      return;
    }

    setStatus('Canlı izleme başlıyor...');
    addLog('🔴 Canlı konum paylaşımı başlatılıyor...');

    try {
      const { watchPosition, createLocationSession } = await import('@/lib/location/geolocation');
      const { generateLocationKey: genKey } = await import('@/lib/location/encryption');

      // Generate encryption key
      const key = genKey();
      setEncryptionKey(key);
      addLog('🔑 Şifreleme anahtarı oluşturuldu (256-bit)');

      // Create session
      const session = {
        id: crypto.randomUUID(),
        userId: 'user-demo',
        recipientId: 'user-remote',
        startedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 min
        isLive: true,
        duration: 15 * 60 * 1000
      };

      setShareSession(session);
      addLog(`✅ Paylaşım oturumu: ${session.id}`);
      addLog(`   Süre: 15 dakika`);

      // Start watching
      const id = watchPosition(
        async (location) => {
          setCurrentLocation(location);
          addLog(`📍 Konum güncellendi: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);

          // Encrypt and "send" location
          if (key) {
            try {
              const { encryptLocation } = await import('@/lib/location/encryption');
              const encrypted = await encryptLocation(location, key);
              addLog(`🔒 Konum şifrelendi (${encrypted.ciphertext.length} bytes)`);
            } catch (error) {
              addLog('⚠️ Şifreleme hatası');
            }
          }
        },
        (error) => {
          addLog(`❌ İzleme hatası: ${error.message}`);
        }
      );

      setWatchId(id);
      setIsSharing(true);
      setStatus('🔴 Canlı paylaşım aktif');

      addLog('✅ Canlı izleme başladı');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 3: Stop Sharing
  const stopSharing = () => {
    if (!isSharing || watchId === null) {
      return;
    }

    addLog('⏹️ Canlı paylaşım durduruluyor...');

    import('@/lib/location/geolocation').then(({ clearWatch }) => {
      clearWatch(watchId);
      setWatchId(null);
      setIsSharing(false);
      setShareSession(null);
      addLog('✅ Paylaşım durduruldu');
      setStatus('Durduruldu');
    });
  };

  // Test 4: Simulate Other User
  const simulateOtherUser = () => {
    if (!currentLocation) {
      addLog('⚠️ Önce kendi konumunuzu alın');
      return;
    }

    addLog('👤 Diğer kullanıcı simüle ediliyor...');

    // Add simulated location nearby
    const offset = 0.005; // ~500m
    const otherLoc = {
      id: 'user-2',
      name: 'Alice',
      location: {
        latitude: currentLocation.latitude + offset,
        longitude: currentLocation.longitude + offset,
        accuracy: 10,
        timestamp: Date.now()
      },
      color: '#EF4444'
    };

    setOtherLocations([otherLoc]);
    addLog(`✅ Alice'in konumu eklendi (${Math.round(offset * 111000)}m uzakta)`);
  };

  // Test 5: Encrypt/Decrypt Test
  const testEncryption = async () => {
    if (!currentLocation) {
      addLog('⚠️ Önce konum alın');
      return;
    }

    setStatus('Şifreleme testi...');
    addLog('🔒 Konum şifreleme testi başladı...');

    try {
      const { encryptLocation, decryptLocation, generateLocationKey } = await import('@/lib/location/encryption');

      // Generate key
      const key = generateLocationKey();
      addLog('🔑 Test anahtarı oluşturuldu');

      // Encrypt
      const encrypted = await encryptLocation(currentLocation, key);
      addLog(`✅ Şifrelendi:`);
      addLog(`   Ciphertext: ${encrypted.ciphertext.substring(0, 30)}...`);
      addLog(`   IV: ${encrypted.iv.substring(0, 20)}...`);
      addLog(`   Auth Tag: ${encrypted.authTag.substring(0, 20)}...`);

      // Decrypt
      const decrypted = await decryptLocation(encrypted, key);
      addLog(`✅ Çözüldü:`);
      addLog(`   Lat: ${decrypted.latitude.toFixed(6)}`);
      addLog(`   Lon: ${decrypted.longitude.toFixed(6)}`);

      // Verify
      if (
        Math.abs(decrypted.latitude - currentLocation.latitude) < 0.000001 &&
        Math.abs(decrypted.longitude - currentLocation.longitude) < 0.000001
      ) {
        addLog('✅ ✨ Doğrulama başarılı! Konum eşleşti.');
      }

      setStatus('✅ Test başarılı');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Session timer
  useEffect(() => {
    if (!shareSession || !isSharing) return;

    const interval = setInterval(() => {
      const remaining = shareSession.expiresAt - Date.now();

      if (remaining <= 0) {
        stopSharing();
        addLog('⏱️ Oturum süresi doldu');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shareSession, isSharing]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          📍 Live Location Demo
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          Gerçek zamanlı şifrelenmiş konum paylaşımı
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
            <span className="text-sm text-[#6B7280]">Durum: </span>
            <span className="font-semibold text-[#10A37F]">{status}</span>
          </div>

          {shareSession && isSharing && (
            <div className="inline-block px-4 py-2 rounded-lg bg-[#EF4444] border border-[#DC2626]">
              <span className="text-sm font-semibold">
                🔴 Canlı: {formatTime(shareSession.expiresAt - Date.now())}
              </span>
            </div>
          )}

          <div className="inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
            <span className="text-sm text-[#6B7280]">İzin: </span>
            <span className={`font-semibold ${
              permission === 'granted' ? 'text-[#10A37F]' :
              permission === 'denied' ? 'text-[#EF4444]' :
              'text-[#EAB308]'
            }`}>
              {permission === 'granted' ? '✅ Verildi' :
               permission === 'denied' ? '❌ Reddedildi' :
               '⏳ Bekleniyor'}
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8">
        <LocationMap
          userLocation={currentLocation}
          otherLocations={otherLocations}
          height="500px"
        />
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Location Controls */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Konum Kontrolleri
          </h3>
          <div className="space-y-3">
            <button
              onClick={getLocation}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold"
            >
              📍 Mevcut Konumu Al
            </button>

            {!isSharing ? (
              <button
                onClick={startLiveTracking}
                className="w-full px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] transition-colors"
              >
                🔴 Canlı Paylaşımı Başlat
              </button>
            ) : (
              <button
                onClick={stopSharing}
                className="w-full px-4 py-2 rounded-lg bg-[#6B7280] hover:bg-[#4B5563] transition-colors"
              >
                ⏹️ Paylaşımı Durdur
              </button>
            )}
          </div>
        </div>

        {/* Tests */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            Testler
          </h3>
          <div className="space-y-3">
            <button
              onClick={testEncryption}
              disabled={!currentLocation}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔒 Şifreleme Testi
            </button>

            <button
              onClick={simulateOtherUser}
              disabled={!currentLocation}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👤 Diğer Kullanıcı Simüle Et
            </button>

            <button
              onClick={checkPermission}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              🔍 İzinleri Kontrol Et
            </button>
          </div>
        </div>
      </div>

      {/* Current Location Info */}
      {currentLocation && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Konum Bilgisi
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-[#6B7280]">Enlem:</div>
              <div className="font-mono text-[#E5E7EB]">{currentLocation.latitude.toFixed(6)}°</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Boylam:</div>
              <div className="font-mono text-[#E5E7EB]">{currentLocation.longitude.toFixed(6)}°</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Doğruluk:</div>
              <div className="text-[#10A37F] font-semibold">±{Math.round(currentLocation.accuracy)}m</div>
            </div>
            {currentLocation.speed && (
              <div>
                <div className="text-[#6B7280]">Hız:</div>
                <div className="text-[#E5E7EB]">{(currentLocation.speed * 3.6).toFixed(1)} km/s</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Konsol Logları
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="ml-auto text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors"
            >
              Temizle
            </button>
          )}
        </h3>
        <div className="bg-[#0B0F19] rounded-lg border border-[#374151] p-4 font-mono text-xs max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-[#6B7280] text-center py-8">
              Test çalıştırın, loglar burada görünecek...
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`py-1 ${
                  log.includes('✅') ? 'text-[#10A37F]' :
                  log.includes('❌') ? 'text-[#EF4444]' :
                  log.includes('⚠️') ? 'text-[#EAB308]' :
                  log.includes('🔴') ? 'text-[#EF4444]' :
                  'text-[#9CA3AF]'
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 rounded-xl border border-[#374151] bg-[#1F2937] p-6">
        <h4 className="font-semibold mb-2 text-[#10A37F]">ℹ️ Neler Test Ediliyor?</h4>
        <ul className="text-sm text-[#9CA3AF] space-y-1">
          <li>✅ <strong>Geolocation API:</strong> HTML5 konum hizmetleri</li>
          <li>✅ <strong>Live Tracking:</strong> Gerçek zamanlı konum güncellemeleri</li>
          <li>✅ <strong>E2EE:</strong> AES-256-GCM ile konum şifreleme</li>
          <li>✅ <strong>Session Management:</strong> Zamanlı paylaşım oturumları (15 dk)</li>
          <li>✅ <strong>Permission Handling:</strong> İzin durumu kontrolü</li>
          <li>✅ <strong>Map Visualization:</strong> Interaktif harita görüntüleme</li>
        </ul>
      </div>
    </div>
  );
}
