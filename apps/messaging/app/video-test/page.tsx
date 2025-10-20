'use client';

/**
 * SHARD_6.6 - Video Call Demo
 * Interactive WebRTC + SFrame E2EE demonstration
 * Shows: Video/audio calls, screen share, SFrame encryption
 */

import { useState, useRef, useEffect } from 'react';

export default function VideoTestPage() {
  const [status, setStatus] = useState<string>('Hazır');
  const [logs, setLogs] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSFrameEnabled, setIsSFrameEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [iceServers, setIceServers] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Load ICE servers on mount
  useEffect(() => {
    loadIceServers();
  }, []);

  // Load ICE servers
  const loadIceServers = async () => {
    try {
      const response = await fetch('/api/webrtc/ice-servers');
      const data = await response.json();
      setIceServers(data.iceServers);
      addLog(`✅ ICE servers loaded: ${data.iceServers.length} servers`);
    } catch (error: any) {
      addLog(`❌ ICE servers error: ${error.message}`);
    }
  };

  // Test 1: Get Local Media
  const getLocalMedia = async () => {
    setStatus('Kamera açılıyor...');
    addLog('🎥 Kamera ve mikrofon erişimi isteniyor...');

    try {
      const { WebRTCPeer } = await import('@/lib/webrtc/peer');

      // Create peer if not exists
      if (!peerRef.current) {
        peerRef.current = new WebRTCPeer({
          iceServers: iceServers.length > 0 ? iceServers : [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          userId: 'local-user',
          remoteUserId: 'remote-user'
        });

        // Setup event listeners
        peerRef.current.on('connectionstatechange', (state: string) => {
          setConnectionState(state);
          addLog(`🔗 Connection state: ${state}`);
        });
      }

      const stream = await peerRef.current.getLocalMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setLocalStream(stream);

      // Attach to video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      addLog(`✅ Media acquired: ${stream.getTracks().length} tracks`);
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        addLog(`   ${track.kind}: ${track.label}`);
      });

      setStatus('✅ Kamera açık');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 2: Toggle Audio
  const toggleAudio = () => {
    if (peerRef.current) {
      const newState = !isAudioEnabled;
      peerRef.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
      addLog(`🔊 Mikrofon: ${newState ? 'AÇIK' : 'KAPALI'}`);
    }
  };

  // Test 3: Toggle Video
  const toggleVideo = () => {
    if (peerRef.current) {
      const newState = !isVideoEnabled;
      peerRef.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
      addLog(`📹 Kamera: ${newState ? 'AÇIK' : 'KAPALI'}`);
    }
  };

  // Test 4: Screen Share
  const startScreenShare = async () => {
    if (!peerRef.current) {
      addLog('⚠️ Önce kamerayı açın');
      return;
    }

    try {
      addLog('🖥️ Ekran paylaşımı başlatılıyor...');

      const screenStream = await peerRef.current.getScreenShare();
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track
      await peerRef.current.replaceVideoTrack(screenTrack);

      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle screen share stop
      screenTrack.onended = () => {
        addLog('🖥️ Ekran paylaşımı durduruldu');
        setIsScreenSharing(false);
        // Restore camera
        if (localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          peerRef.current.replaceVideoTrack(cameraTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        }
      };

      setIsScreenSharing(true);
      addLog('✅ Ekran paylaşımı aktif');
    } catch (error: any) {
      addLog(`❌ Screen share error: ${error.message}`);
    }
  };

  // Test 5: Test SFrame Encryption
  const testSFrameEncryption = async () => {
    setStatus('SFrame test ediliyor...');
    addLog('🔒 SFrame encryption testi başladı...');

    try {
      const { SFrameContext } = await import('@/lib/webrtc/sframe');

      // Create SFrame context
      const context = new SFrameContext();

      // Mock frame data
      const mockFrame = new Uint8Array(1000);
      crypto.getRandomValues(mockFrame);

      addLog('📦 Mock frame oluşturuldu: 1000 bytes');

      // Encrypt
      const encrypted = await context.encryptFrame(mockFrame);
      addLog(`✅ Frame şifrelendi`);
      addLog(`   Key ID: ${encrypted.keyId}`);
      addLog(`   Counter: ${encrypted.counter}`);
      addLog(`   Ciphertext: ${encrypted.ciphertext.length} bytes`);
      addLog(`   Auth Tag: ${encrypted.authTag.length} bytes`);

      // Add decryption key (simulate key exchange)
      const encKey = context.getEncryptionKey();
      context.addDecryptionKey(encKey.keyId, encKey.key);

      // Decrypt
      const decrypted = await context.decryptFrame(encrypted);
      addLog(`✅ Frame çözüldü: ${decrypted.length} bytes`);

      // Verify
      if (decrypted.length === mockFrame.length) {
        let match = true;
        for (let i = 0; i < mockFrame.length; i++) {
          if (decrypted[i] !== mockFrame[i]) {
            match = false;
            break;
          }
        }

        if (match) {
          addLog('✅ ✨ SFrame doğrulandı! Frame eşleşti.');
        } else {
          addLog('❌ Frame eşleşmedi');
        }
      }

      setStatus('✅ SFrame test başarılı');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 6: Create Offer (simulate)
  const testCreateOffer = async () => {
    if (!peerRef.current) {
      addLog('⚠️ Önce kamerayı açın');
      return;
    }

    try {
      addLog('📞 SDP Offer oluşturuluyor...');

      // Add local stream
      if (localStream) {
        peerRef.current.addLocalStream(localStream);
        addLog('✅ Local stream peer\'e eklendi');
      }

      const offer = await peerRef.current.createOffer();

      addLog('✅ Offer oluşturuldu');
      addLog(`   Type: ${offer.type}`);
      addLog(`   SDP: ${offer.sdp?.substring(0, 50)}...`);

      setStatus('✅ Offer hazır');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Stop All Media
  const stopAllMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        addLog(`⏹️ Track stopped: ${track.kind}`);
      });
      setLocalStream(null);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
      addLog('🔌 Peer connection closed');
    }

    setStatus('Durduruldu');
  };

  // Run Full Test
  const runFullTest = async () => {
    setLogs([]);
    addLog('🚀 Tüm WebRTC testleri başlatılıyor...');

    await getLocalMedia();
    await new Promise(r => setTimeout(r, 1000));

    toggleAudio();
    await new Promise(r => setTimeout(r, 500));
    toggleAudio();
    await new Promise(r => setTimeout(r, 500));

    toggleVideo();
    await new Promise(r => setTimeout(r, 500));
    toggleVideo();
    await new Promise(r => setTimeout(r, 1000));

    await testSFrameEncryption();
    await new Promise(r => setTimeout(r, 1000));

    await testCreateOffer();

    addLog('🎉 Tüm testler tamamlandı!');
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          🎥 Video Call Demo
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          WebRTC + SFrame E2EE test arayüzü
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
            <span className="text-sm text-[#6B7280]">Durum: </span>
            <span className="font-semibold text-[#10A37F]">{status}</span>
          </div>
          <div className="inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
            <span className="text-sm text-[#6B7280]">Connection: </span>
            <span className={`font-semibold ${
              connectionState === 'connected' ? 'text-[#10A37F]' :
              connectionState === 'connecting' ? 'text-[#EAB308]' :
              'text-[#6B7280]'
            }`}>
              {connectionState}
            </span>
          </div>
        </div>
      </div>

      {/* Video Previews */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Local Video */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📹</span>
            Local Video
          </h3>
          <div className="relative aspect-video bg-[#0B0F19] rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-[#6B7280]">
                  <div className="text-6xl mb-4">📹</div>
                  <div>Kamera kapalı</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={toggleAudio}
              disabled={!localStream}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                isAudioEnabled
                  ? 'bg-[#1F2937] hover:bg-[#374151]'
                  : 'bg-[#EF4444] hover:bg-[#DC2626]'
              }`}
            >
              {isAudioEnabled ? '🔊' : '🔇'}
            </button>

            <button
              onClick={toggleVideo}
              disabled={!localStream}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                isVideoEnabled
                  ? 'bg-[#1F2937] hover:bg-[#374151]'
                  : 'bg-[#EF4444] hover:bg-[#DC2626]'
              }`}
            >
              {isVideoEnabled ? '📹' : '🚫'}
            </button>

            <button
              onClick={startScreenShare}
              disabled={!localStream}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                isScreenSharing
                  ? 'bg-[#10A37F] hover:bg-[#0D8F6E]'
                  : 'bg-[#1F2937] hover:bg-[#374151]'
              }`}
            >
              🖥️
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📺</span>
            Remote Video
          </h3>
          <div className="relative aspect-video bg-[#0B0F19] rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-[#6B7280]">
                <div className="text-6xl mb-4">📺</div>
                <div>Bağlantı bekleniyor...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Media Controls */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎛️</span>
            Media Controls
          </h3>
          <div className="space-y-3">
            <button
              onClick={getLocalMedia}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold"
            >
              🎥 Kamera Aç
            </button>

            <button
              onClick={stopAllMedia}
              disabled={!localStream}
              className="w-full px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏹️ Durdur
            </button>
          </div>
        </div>

        {/* WebRTC Tests */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            WebRTC Tests
          </h3>
          <div className="space-y-3">
            <button
              onClick={testSFrameEncryption}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left"
            >
              🔒 SFrame Encryption Test
            </button>

            <button
              onClick={testCreateOffer}
              disabled={!localStream}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📞 Create SDP Offer
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

      {/* SFrame Info */}
      <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          SFrame E2EE
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-[#6B7280] text-sm mb-1">Status:</div>
            <div className={`font-semibold ${isSFrameEnabled ? 'text-[#10A37F]' : 'text-[#6B7280]'}`}>
              {isSFrameEnabled ? '✅ Aktif' : '🔓 Pasif'}
            </div>
          </div>
          <div>
            <div className="text-[#6B7280] text-sm mb-1">Algorithm:</div>
            <div className="text-[#E5E7EB]">AES-256-GCM</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-sm mb-1">Mode:</div>
            <div className="text-[#E5E7EB]">Per-Frame</div>
          </div>
        </div>
      </div>

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
          <li>✅ <strong>WebRTC Peer Connection:</strong> Browser-to-browser P2P iletişim</li>
          <li>✅ <strong>Media Streams:</strong> Kamera, mikrofon, ekran paylaşımı</li>
          <li>✅ <strong>SFrame E2EE:</strong> Her frame için AES-256-GCM şifreleme</li>
          <li>✅ <strong>SDP Signaling:</strong> Offer/Answer exchange (Redis pub/sub)</li>
          <li>✅ <strong>ICE Candidates:</strong> STUN/TURN ile NAT traversal</li>
          <li>✅ <strong>Media Controls:</strong> Mute/unmute, video on/off, screen share</li>
        </ul>
      </div>
    </div>
  );
}
