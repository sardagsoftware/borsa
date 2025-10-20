'use client';

/**
 * SHARD_3.6 - Crypto Demo Page
 * Visual demonstration of E2EE crypto working in localhost
 * Shows: Key generation, device provisioning, encryption, safety numbers
 */

import { useState, useEffect } from 'react';

export default function CryptoTestPage() {
  const [status, setStatus] = useState<string>('Hazır');
  const [device, setDevice] = useState<any>(null);
  const [safetyNumber, setSafetyNumber] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>('Merhaba! Bu E2EE test mesajı 🔐');
  const [encryptedData, setEncryptedData] = useState<string>('');
  const [decryptedMessage, setDecryptedMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Test 1: Generate Identity Keys
  const testKeyGeneration = async () => {
    setStatus('Anahtar üretiliyor...');
    addLog('🔑 Identity key pair üretimi başladı');

    try {
      const { generateIdentityKeyPair } = await import('@/lib/crypto/keys');
      const keyPair = await generateIdentityKeyPair();

      addLog(`✅ Identity key oluşturuldu: ${keyPair.id}`);
      addLog(`   Public key: ${keyPair.publicKey.length} bytes`);
      addLog(`   Private key: ${keyPair.privateKey.length} bytes`);

      setStatus('✅ Anahtar üretildi');
      return keyPair;
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
      throw error;
    }
  };

  // Test 2: Provision Device
  const testDeviceProvisioning = async () => {
    setStatus('Cihaz hazırlanıyor...');
    addLog('📱 Device provisioning başladı');

    try {
      const { provisionDevice } = await import('@/lib/crypto/device');
      const newDevice = await provisionDevice('Test Browser', 'primary');

      setDevice(newDevice);
      addLog(`✅ Cihaz hazırlandı: ${newDevice.id}`);
      addLog(`   İsim: ${newDevice.name}`);
      addLog(`   Tip: ${newDevice.type}`);
      addLog(`   Pre-key sayısı: ${newDevice.oneTimePreKeys.length}`);

      setStatus('✅ Cihaz hazır');
      return newDevice;
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
      throw error;
    }
  };

  // Test 3: Generate Safety Number
  const testSafetyNumber = async (device: any) => {
    setStatus('Güvenlik numarası oluşturuluyor...');
    addLog('🔢 Safety number üretimi başladı');

    try {
      const { generateSafetyNumber, formatSafetyNumber, generateEmojiFingerprint } = await import('@/lib/crypto/safety');

      // Simulate remote device key
      const remoteKey = new Uint8Array(32);
      crypto.getRandomValues(remoteKey);

      const safety = await generateSafetyNumber(
        device.identityKey.publicKey,
        remoteKey,
        'local-user',
        'remote-user'
      );

      const formatted = formatSafetyNumber(safety);
      const emoji = generateEmojiFingerprint(device.identityKey.publicKey);

      setSafetyNumber(formatted);
      addLog(`✅ Safety number: ${formatted.substring(0, 30)}...`);
      addLog(`   Emoji fingerprint: ${emoji}`);

      setStatus('✅ Güvenlik numarası hazır');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 4: Encrypt & Decrypt Message
  const testEncryption = async () => {
    if (!testMessage.trim()) {
      addLog('⚠️ Mesaj giriniz');
      return;
    }

    setStatus('Mesaj şifreleniyor...');
    addLog(`🔒 Mesaj şifreleme başladı: "${testMessage}"`);

    try {
      const { initializeRatchet, encryptMessage } = await import('@/lib/crypto/ratchet');
      const { generateRandomBytes } = await import('@/lib/crypto/keys');

      // Initialize ratchet with random shared secret
      const sharedSecret = generateRandomBytes(64);
      const ratchetState = initializeRatchet(sharedSecret);

      // Generate ephemeral key
      const ephemeralKey = generateRandomBytes(32);

      // Encrypt message
      const plaintext = new TextEncoder().encode(testMessage);
      const encrypted = await encryptMessage(ratchetState, plaintext, ephemeralKey);

      const encryptedHex = Array.from(encrypted.ciphertext.slice(0, 32))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      setEncryptedData(encryptedHex + '...');
      addLog(`✅ Mesaj şifrelendi`);
      addLog(`   Ciphertext: ${encryptedHex}...`);
      addLog(`   Counter: ${encrypted.counter}`);

      // Decrypt message
      setStatus('Mesaj çözülüyor...');
      addLog('🔓 Mesaj çözme başladı');

      const { decryptMessage } = await import('@/lib/crypto/ratchet');
      const decrypted = await decryptMessage(ratchetState, encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);

      setDecryptedMessage(decryptedText);
      addLog(`✅ Mesaj çözüldü: "${decryptedText}"`);

      if (decryptedText === testMessage) {
        addLog('✅ ✨ E2EE doğrulama başarılı! Mesaj eşleşti.');
        setStatus('✅ E2EE çalışıyor!');
      } else {
        addLog('❌ Mesaj eşleşmedi!');
        setStatus('❌ Doğrulama hatası');
      }
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setLogs([]);
    addLog('🚀 Tüm testler başlatılıyor...');

    try {
      const keyPair = await testKeyGeneration();
      await new Promise(resolve => setTimeout(resolve, 500));

      const newDevice = await testDeviceProvisioning();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testSafetyNumber(newDevice);
      await new Promise(resolve => setTimeout(resolve, 500));

      await testEncryption();

      addLog('🎉 Tüm testler tamamlandı!');
    } catch (error) {
      addLog('❌ Test suite hatası');
    }
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          🔐 E2EE Crypto Core Demo
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          Signal Protocol implementasyonu test arayüzü
        </p>
        <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
          <span className="text-sm text-[#6B7280]">Durum: </span>
          <span className="font-semibold text-[#10A37F]">{status}</span>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Individual Tests */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            Manuel Testler
          </h3>
          <div className="space-y-3">
            <button
              onClick={testKeyGeneration}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              1️⃣ Anahtar Üret (ECDH)
            </button>
            <button
              onClick={testDeviceProvisioning}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              2️⃣ Cihaz Hazırla
            </button>
            <button
              onClick={() => device && testSafetyNumber(device)}
              disabled={!device}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              3️⃣ Güvenlik Numarası
            </button>
            <button
              onClick={testEncryption}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              4️⃣ Şifrele/Çöz
            </button>
          </div>
        </div>

        {/* Run All Tests */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Hızlı Test
          </h3>
          <button
            onClick={runAllTests}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚀 Tüm Testleri Çalıştır
          </button>

          {/* Test Message Input */}
          <div className="mt-6">
            <label className="block text-sm text-[#9CA3AF] mb-2">
              Test Mesajı:
            </label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0B0F19] border border-[#374151] focus:border-[#10A37F] focus:outline-none transition-colors"
              placeholder="E2EE test mesajı..."
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Safety Number */}
        {safetyNumber && (
          <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">🔢</span>
              Güvenlik Numarası
            </h3>
            <div className="font-mono text-sm text-[#10A37F] bg-[#0B0F19] p-4 rounded-lg border border-[#374151] leading-relaxed">
              {safetyNumber}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              Bu numarayı karşı tarafla karşılaştırarak MITM saldırılarını engelleyin
            </p>
          </div>
        )}

        {/* Encrypted Data */}
        {encryptedData && (
          <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Şifrelenmiş Veri
            </h3>
            <div className="font-mono text-xs text-[#EAB308] bg-[#0B0F19] p-4 rounded-lg border border-[#374151] break-all">
              {encryptedData}
            </div>
            {decryptedMessage && (
              <div className="mt-3">
                <div className="text-sm text-[#9CA3AF] mb-1">Çözülmüş:</div>
                <div className="text-[#10A37F] font-semibold">
                  "{decryptedMessage}"
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Info */}
      {device && (
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Cihaz Bilgisi
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[#6B7280]">ID:</div>
              <div className="font-mono text-xs text-[#E5E7EB] truncate">
                {device.id}
              </div>
            </div>
            <div>
              <div className="text-[#6B7280]">İsim:</div>
              <div className="text-[#E5E7EB]">{device.name}</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Pre-key Sayısı:</div>
              <div className="text-[#10A37F] font-semibold">
                {device.oneTimePreKeys.length}
              </div>
            </div>
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
                  'text-[#9CA3AF]'
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 rounded-xl border border-[#374151] bg-[#1F2937] p-6">
        <h4 className="font-semibold mb-2 text-[#10A37F]">ℹ️ Neler Test Ediliyor?</h4>
        <ul className="text-sm text-[#9CA3AF] space-y-1">
          <li>✅ <strong>Key Generation:</strong> ECDH P-256 anahtar çiftleri üretiliyor</li>
          <li>✅ <strong>Device Provisioning:</strong> Cihaz kimliği, signed pre-key, 100 one-time pre-key</li>
          <li>✅ <strong>Safety Numbers:</strong> İki kimlik anahtarından 60 haneli güvenlik numarası</li>
          <li>✅ <strong>Double Ratchet:</strong> AES-GCM ile mesaj şifreleme ve çözme</li>
          <li>✅ <strong>Perfect Forward Secrecy:</strong> Her mesaj için benzersiz anahtar</li>
        </ul>
      </div>
    </div>
  );
}
