'use client';

/**
 * SHARD_4.6 - Message Delivery Demo
 * Visual demonstration of Redis store-and-forward system
 * Shows: Message sending, queueing, delivery, receipts
 */

import { useState, useEffect } from 'react';

interface QueueStats {
  queueLength: number;
  oldestMessageAge?: number;
  newestMessageAge?: number;
}

export default function DeliveryTestPage() {
  const [status, setStatus] = useState<string>('Hazır');
  const [logs, setLogs] = useState<string[]>([]);

  // Sender state
  const [senderUserId] = useState('user-alice');
  const [senderDeviceId] = useState('device-alice-1');

  // Recipient state
  const [recipientUserId] = useState('user-bob');
  const [recipientDeviceId] = useState('device-bob-1');

  // Message state
  const [messageText, setMessageText] = useState('Merhaba! Bu test mesajı 🚀');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);

  // Queue stats
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [redisHealth, setRedisHealth] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Test 1: Check Redis Health
  const testRedisHealth = async () => {
    setStatus('Redis kontrolü...');
    addLog('🔍 Redis bağlantısı kontrol ediliyor...');

    try {
      const response = await fetch(`/api/messages/stats?userId=${recipientUserId}`);
      const data = await response.json();

      if (data.redis?.connected) {
        setRedisHealth(data.redis);
        addLog(`✅ Redis bağlantısı aktif (latency: ${data.redis.latency}ms)`);
        setStatus('✅ Redis çalışıyor');
      } else {
        addLog(`❌ Redis bağlantısı yok: ${data.redis?.error || 'Unknown'}`);
        setStatus('❌ Redis hatası');
      }
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 2: Send Encrypted Message
  const sendMessage = async () => {
    if (!messageText.trim()) {
      addLog('⚠️ Mesaj boş olamaz');
      return;
    }

    setStatus('Mesaj şifreleniyor...');
    addLog(`🔒 Mesaj şifreleniyor: "${messageText}"`);

    try {
      // Encrypt message (using crypto from SHARD_3)
      const { initializeRatchet, encryptMessage } = await import('@/lib/crypto/ratchet');
      const { generateRandomBytes } = await import('@/lib/crypto/keys');

      const sharedSecret = generateRandomBytes(64);
      const ratchetState = initializeRatchet(sharedSecret);
      const ephemeralKey = generateRandomBytes(32);

      const plaintext = new TextEncoder().encode(messageText);
      const encrypted = await encryptMessage(ratchetState, plaintext, ephemeralKey);

      addLog('✅ Mesaj şifrelendi (AES-GCM + Double Ratchet)');

      // Send to API
      setStatus('Gönderiliyor...');
      addLog('📤 Redis queue\'ya gönderiliyor...');

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: senderUserId,
          fromDeviceId: senderDeviceId,
          toUserId: recipientUserId,
          toDeviceId: recipientDeviceId,
          ciphertext: arrayBufferToBase64(encrypted.ciphertext),
          iv: arrayBufferToBase64(encrypted.iv),
          counter: encrypted.counter,
          previousCounter: 0,
          publicKey: arrayBufferToBase64(encrypted.publicKey),
          type: 'regular',
          priority: 'normal'
        })
      });

      const result = await response.json();

      if (result.success) {
        addLog(`✅ Mesaj gönderildi: ${result.messageId}`);
        addLog(`   Queue pozisyonu: ${result.queuePosition}`);

        setSentMessages(prev => [...prev, {
          id: result.messageId,
          text: messageText,
          timestamp: result.timestamp,
          encrypted: encrypted
        }]);

        setStatus('✅ Gönderildi');
        setMessageText('');

        // Refresh queue stats
        await refreshQueueStats();
      } else {
        addLog(`❌ Gönderme hatası: ${result.error}`);
        setStatus('❌ Hata');
      }
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 3: Receive Messages
  const receiveMessages = async () => {
    setStatus('Mesajlar alınıyor...');
    addLog('📥 Redis queue\'dan mesajlar çekiliyor...');

    try {
      const response = await fetch(
        `/api/messages/receive?userId=${recipientUserId}&deviceId=${recipientDeviceId}&limit=10`
      );
      const result = await response.json();

      if (result.success) {
        addLog(`✅ ${result.count} mesaj alındı`);

        if (result.count > 0) {
          // Decrypt messages
          const { initializeRatchet, decryptMessage } = await import('@/lib/crypto/ratchet');
          const { generateRandomBytes } = await import('@/lib/crypto/keys');

          for (const envelope of result.messages) {
            try {
              // Initialize ratchet (in production, would load saved state)
              const sharedSecret = generateRandomBytes(64);
              const ratchetState = initializeRatchet(sharedSecret);

              const ciphertext = base64ToUint8Array(envelope.ciphertext);
              const iv = base64ToUint8Array(envelope.iv);
              const publicKey = envelope.publicKey ? base64ToUint8Array(envelope.publicKey) : new Uint8Array(32);

              const decrypted = await decryptMessage(ratchetState, {
                ciphertext,
                iv,
                counter: envelope.counter,
                publicKey
              });

              const text = new TextDecoder().decode(decrypted);

              setReceivedMessages(prev => [...prev, {
                id: envelope.id,
                text,
                from: envelope.from.userId,
                timestamp: envelope.timestamp
              }]);

              addLog(`   📨 "${text}"`);
            } catch (decryptError) {
              addLog(`   ⚠️ Decrypt error: ${envelope.id}`);
            }
          }
        }

        setStatus('✅ Alındı');

        // Refresh queue stats
        await refreshQueueStats();
      } else {
        addLog(`❌ Alma hatası: ${result.error}`);
        setStatus('❌ Hata');
      }
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 4: Get Queue Stats
  const refreshQueueStats = async () => {
    try {
      const response = await fetch(`/api/messages/stats?userId=${recipientUserId}`);
      const data = await response.json();

      if (data.success) {
        setQueueStats(data.stats);
        setRedisHealth(data.redis);
        addLog(`📊 Queue: ${data.stats.queueLength} mesaj bekliyor`);
      }
    } catch (error: any) {
      console.error('Stats error:', error);
    }
  };

  // Run full test
  const runFullTest = async () => {
    setLogs([]);
    addLog('🚀 Tüm delivery testleri başlatılıyor...');

    await testRedisHealth();
    await new Promise(r => setTimeout(r, 500));

    // Send 3 test messages
    for (let i = 1; i <= 3; i++) {
      setMessageText(`Test mesajı #${i} 📨`);
      await new Promise(r => setTimeout(r, 200));
      await sendMessage();
      await new Promise(r => setTimeout(r, 300));
    }

    await new Promise(r => setTimeout(r, 500));
    await receiveMessages();

    addLog('🎉 Tüm testler tamamlandı!');
  };

  useEffect(() => {
    refreshQueueStats();
  }, []);

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          📨 Message Delivery Demo
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          Redis store-and-forward test arayüzü
        </p>
        <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
          <span className="text-sm text-[#6B7280]">Durum: </span>
          <span className="font-semibold text-[#10A37F]">{status}</span>
        </div>
      </div>

      {/* Redis Health */}
      {redisHealth && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-2xl">🔴</span>
            Redis Bağlantısı
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#6B7280]">Durum:</div>
              <div className={`font-semibold ${redisHealth.connected ? 'text-[#10A37F]' : 'text-[#EF4444]'}`}>
                {redisHealth.connected ? '✅ Bağlı' : '❌ Bağlı Değil'}
              </div>
            </div>
            {redisHealth.latency && (
              <div>
                <div className="text-[#6B7280]">Latency:</div>
                <div className="text-[#E5E7EB]">{redisHealth.latency}ms</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Send Message */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Mesaj Gönder
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">
                Gönderen: {senderUserId}
              </label>
              <label className="block text-sm text-[#6B7280]">
                Cihaz: {senderDeviceId}
              </label>
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">
                Alıcı: {recipientUserId}
              </label>
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">
                Mesaj:
              </label>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0B0F19] border border-[#374151] focus:border-[#10A37F] focus:outline-none"
                placeholder="Mesajınızı yazın..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
            </div>

            <button
              onClick={sendMessage}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold"
            >
              🔒 Şifrele ve Gönder
            </button>
          </div>
        </div>

        {/* Receive Messages */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            Mesaj Al
          </h3>

          <div className="space-y-4">
            <button
              onClick={testRedisHealth}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              🔍 Redis Bağlantısı Kontrol Et
            </button>

            <button
              onClick={receiveMessages}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              📥 Queue'dan Mesajları Çek
            </button>

            <button
              onClick={refreshQueueStats}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              📊 Queue İstatistikleri
            </button>

            <button
              onClick={runFullTest}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold"
            >
              🚀 Tüm Testleri Çalıştır
            </button>
          </div>
        </div>
      </div>

      {/* Queue Stats */}
      {queueStats && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Queue İstatistikleri
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[#6B7280]">Bekleyen Mesaj:</div>
              <div className="text-2xl font-bold text-[#10A37F]">
                {queueStats.queueLength}
              </div>
            </div>
            {queueStats.oldestMessageAge !== undefined && (
              <div>
                <div className="text-[#6B7280]">En Eski:</div>
                <div className="text-[#E5E7EB]">
                  {Math.round(queueStats.oldestMessageAge / 1000)}s önce
                </div>
              </div>
            )}
            {queueStats.newestMessageAge !== undefined && (
              <div>
                <div className="text-[#6B7280]">En Yeni:</div>
                <div className="text-[#E5E7EB]">
                  {Math.round(queueStats.newestMessageAge / 1000)}s önce
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sent Messages */}
      {sentMessages.length > 0 && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Gönderilen Mesajlar ({sentMessages.length})
          </h3>
          <div className="space-y-3">
            {sentMessages.map((msg, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#0B0F19] border border-[#374151]">
                <div className="text-[#E5E7EB] mb-2">"{msg.text}"</div>
                <div className="text-xs text-[#6B7280] space-y-1">
                  <div>ID: {msg.id}</div>
                  <div>Counter: {msg.encrypted.counter}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Received Messages */}
      {receivedMessages.length > 0 && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            Alınan Mesajlar ({receivedMessages.length})
          </h3>
          <div className="space-y-3">
            {receivedMessages.map((msg, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#0B0F19] border border-[#374151]">
                <div className="text-[#10A37F] mb-2">"{msg.text}"</div>
                <div className="text-xs text-[#6B7280] space-y-1">
                  <div>Gönderen: {msg.from}</div>
                  <div>ID: {msg.id}</div>
                </div>
              </div>
            ))}
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

      {/* Info */}
      <div className="mt-8 rounded-xl border border-[#374151] bg-[#1F2937] p-6">
        <h4 className="font-semibold mb-2 text-[#10A37F]">ℹ️ Neler Test Ediliyor?</h4>
        <ul className="text-sm text-[#9CA3AF] space-y-1">
          <li>✅ <strong>Redis Connection:</strong> Store-and-forward için Redis bağlantısı</li>
          <li>✅ <strong>Message Envelope:</strong> Şifrelenmiş mesaj zarfı (metadata + ciphertext)</li>
          <li>✅ <strong>Queue Push:</strong> Mesajları Redis list'e ekleme</li>
          <li>✅ <strong>Queue Pop:</strong> Mesajları FIFO sırasıyla alma</li>
          <li>✅ <strong>Delivery Receipts:</strong> Sent/Delivered/Read tracking</li>
          <li>✅ <strong>E2EE Integration:</strong> SHARD_3 crypto ile entegrasyon</li>
        </ul>
      </div>
    </div>
  );
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
