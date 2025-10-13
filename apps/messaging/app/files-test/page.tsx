'use client';

/**
 * SHARD_5.6 - File Encryption Demo
 * Visual demonstration of client-side file encryption
 * Shows: File selection, AES-GCM encryption, upload, sealed URLs, download
 */

import { useState, useRef } from 'react';

export default function FilesTestPage() {
  const [status, setStatus] = useState<string>('Hazır');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptedFile, setEncryptedFile] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [storageQuota, setStorageQuota] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Test 1: Select File
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addLog(`📎 Dosya seçildi: ${file.name} (${formatFileSize(file.size)})`);
      addLog(`   MIME: ${file.type || 'unknown'}`);
      setStatus('Dosya seçildi');
    }
  };

  // Test 2: Encrypt File
  const encryptFile = async () => {
    if (!selectedFile) {
      addLog('⚠️ Önce dosya seçin');
      return;
    }

    setStatus('Şifreleniyor...');
    addLog(`🔒 Dosya şifreleniyor: ${selectedFile.name}`);

    try {
      const { encryptFile: doEncrypt, hashFile } = await import('@/lib/files/encryption');
      const encrypted = await doEncrypt(selectedFile);

      // Calculate hash of original file
      const fileData = await selectedFile.arrayBuffer();
      const originalHash = await hashFile(new Uint8Array(fileData));

      addLog(`✅ Şifreleme tamamlandı`);
      addLog(`   Orijinal: ${formatFileSize(encrypted.originalSize)}`);
      addLog(`   Şifreli: ${formatFileSize(encrypted.size)}`);
      addLog(`   Key: ${encrypted.key.length} bytes`);
      addLog(`   IV: ${encrypted.iv.length} bytes`);
      addLog(`   Auth Tag: ${encrypted.authTag.length} bytes`);
      addLog(`   Hash: ${originalHash.substring(0, 16)}...`);

      setEncryptedFile(encrypted);
      setStatus('✅ Şifrelendi');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 3: Upload Encrypted File
  const uploadFile = async () => {
    if (!encryptedFile) {
      addLog('⚠️ Önce dosyayı şifreleyin');
      return;
    }

    setStatus('Yükleniyor...');
    addLog('📤 Şifreli dosya sunucuya gönderiliyor...');

    try {
      const formData = new FormData();

      // Create blob from encrypted data
      const blob = new Blob(
        [encryptedFile.ciphertext, encryptedFile.authTag],
        { type: 'application/octet-stream' }
      );

      formData.append('file', blob, 'encrypted');
      formData.append('iv', arrayToBase64(encryptedFile.iv));
      formData.append('authTag', arrayToBase64(encryptedFile.authTag));
      formData.append('filename', encryptedFile.filename);
      formData.append('mimeType', encryptedFile.mimeType);
      formData.append('originalSize', encryptedFile.originalSize.toString());
      formData.append('uploaderId', 'user-demo');

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        addLog(`✅ Yükleme başarılı!`);
        addLog(`   File ID: ${result.fileId}`);
        addLog(`   Download Token: ${result.downloadToken.substring(0, 20)}...`);
        addLog(`   Download URL: ${result.downloadUrl}`);

        setUploadedFile({
          ...result,
          key: encryptedFile.key // Save decryption key
        });

        setStatus('✅ Yüklendi');
      } else {
        addLog(`❌ Yükleme hatası: ${result.error}`);
        setStatus('❌ Hata');
      }
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 4: Download & Decrypt
  const downloadAndDecrypt = async () => {
    if (!uploadedFile) {
      addLog('⚠️ Önce dosya yükleyin');
      return;
    }

    setStatus('İndiriliyor...');
    addLog('📥 Şifreli dosya indiriliyor...');

    try {
      const response = await fetch(uploadedFile.downloadUrl);

      if (!response.ok) {
        const error = await response.json();
        addLog(`❌ İndirme hatası: ${error.error}`);
        setStatus('❌ Hata');
        return;
      }

      const encryptedData = await response.arrayBuffer();
      addLog(`✅ İndirildi: ${encryptedData.byteLength} bytes`);

      // Decrypt
      setStatus('Çözülüyor...');
      addLog('🔓 Dosya çözülüyor...');

      const { decryptFile } = await import('@/lib/files/encryption');

      // Parse encrypted data (ciphertext + authTag)
      const totalSize = encryptedData.byteLength;
      const authTagSize = 16;
      const ciphertext = new Uint8Array(encryptedData, 0, totalSize - authTagSize);
      const authTag = new Uint8Array(encryptedData, totalSize - authTagSize, authTagSize);

      const decrypted = await decryptFile({
        ciphertext,
        iv: base64ToArray(uploadedFile.metadata.iv || arrayToBase64(encryptedFile.iv)),
        key: uploadedFile.key,
        authTag,
        filename: uploadedFile.metadata.filename,
        mimeType: uploadedFile.metadata.mimeType,
        size: totalSize,
        originalSize: encryptedFile.originalSize
      });

      addLog(`✅ Çözüldü: ${decrypted.length} bytes`);

      // Create blob
      const blob = new Blob([new Uint8Array(decrypted)], { type: uploadedFile.metadata.mimeType });
      setDecryptedBlob(blob);

      // Verify size
      if (decrypted.length === encryptedFile.originalSize) {
        addLog(`✅ ✨ Boyut doğrulandı! ${formatFileSize(decrypted.length)}`);
      }

      setStatus('✅ Çözüldü');
    } catch (error: any) {
      addLog(`❌ Hata: ${error.message}`);
      setStatus('❌ Hata');
    }
  };

  // Test 5: Trigger Download
  const triggerDownload = () => {
    if (!decryptedBlob) {
      addLog('⚠️ Önce dosyayı çözün');
      return;
    }

    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = encryptedFile.filename;
    a.click();
    URL.revokeObjectURL(url);

    addLog(`💾 İndirme başlatıldı: ${encryptedFile.filename}`);
  };

  // Check Storage Quota
  const checkQuota = async () => {
    try {
      const { checkStorageQuota } = await import('@/lib/files/storage');
      const quota = await checkStorageQuota();

      setStorageQuota(quota);
      addLog(`📊 Storage Quota:`);
      addLog(`   Used: ${formatFileSize(quota.used)}`);
      addLog(`   Total: ${formatFileSize(quota.quota)}`);
      addLog(`   Available: ${formatFileSize(quota.available)}`);
      addLog(`   % Used: ${quota.percentUsed.toFixed(2)}%`);
    } catch (error: any) {
      addLog(`❌ Quota error: ${error.message}`);
    }
  };

  // Run Full Test
  const runFullTest = async () => {
    if (!selectedFile) {
      addLog('⚠️ Önce dosya seçin');
      return;
    }

    setLogs([]);
    addLog('🚀 Tüm file encryption testleri başlatılıyor...');

    await checkQuota();
    await new Promise(r => setTimeout(r, 500));

    await encryptFile();
    await new Promise(r => setTimeout(r, 500));

    await uploadFile();
    await new Promise(r => setTimeout(r, 500));

    await downloadAndDecrypt();

    addLog('🎉 Tüm testler tamamlandı!');
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          📎 File Encryption Demo
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          Client-side AES-256-GCM dosya şifreleme test arayüzü
        </p>
        <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-[#111827] border border-[#374151]">
          <span className="text-sm text-[#6B7280]">Durum: </span>
          <span className="font-semibold text-[#10A37F]">{status}</span>
        </div>
      </div>

      {/* File Selection */}
      <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📁</span>
          Dosya Seç
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-6 py-8 rounded-xl border-2 border-dashed border-[#374151] hover:border-[#10A37F] transition-colors text-center"
          >
            {selectedFile ? (
              <div>
                <div className="text-4xl mb-2">{getFileIcon(selectedFile.type)}</div>
                <div className="font-semibold text-[#E5E7EB]">{selectedFile.name}</div>
                <div className="text-sm text-[#6B7280]">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'unknown'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📂</div>
                <div className="text-[#9CA3AF]">Dosya seçmek için tıklayın</div>
              </div>
            )}
          </button>

          {selectedFile && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={encryptFile}
                className="px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors"
              >
                🔒 Şifrele
              </button>
              <button
                onClick={checkQuota}
                className="px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors"
              >
                📊 Quota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Upload */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Yükleme
          </h3>
          <div className="space-y-3">
            <button
              onClick={uploadFile}
              disabled={!encryptedFile}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Şifreli Dosyayı Yükle
            </button>

            {uploadedFile && (
              <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#374151] text-sm">
                <div className="text-[#10A37F] font-semibold mb-2">✅ Yüklendi</div>
                <div className="text-[#6B7280] space-y-1 text-xs">
                  <div>File ID: {uploadedFile.fileId}</div>
                  <div>Token: {uploadedFile.downloadToken.substring(0, 30)}...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download */}
        <div className="rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📥</span>
            İndirme
          </h3>
          <div className="space-y-3">
            <button
              onClick={downloadAndDecrypt}
              disabled={!uploadedFile}
              className="w-full px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 İndir ve Çöz
            </button>

            <button
              onClick={triggerDownload}
              disabled={!decryptedBlob}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 Dosyayı Kaydet
            </button>

            <button
              onClick={runFullTest}
              disabled={!selectedFile}
              className="w-full px-4 py-2 rounded-lg bg-[#374151] hover:bg-[#4B5563] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Tüm Testleri Çalıştır
            </button>
          </div>
        </div>
      </div>

      {/* Encrypted File Info */}
      {encryptedFile && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            Şifreli Dosya Bilgisi
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-[#6B7280]">Orijinal:</div>
              <div className="text-[#E5E7EB]">{formatFileSize(encryptedFile.originalSize)}</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Şifreli:</div>
              <div className="text-[#E5E7EB]">{formatFileSize(encryptedFile.size)}</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Key Length:</div>
              <div className="text-[#10A37F] font-semibold">{encryptedFile.key.length * 8} bit</div>
            </div>
            <div>
              <div className="text-[#6B7280]">Algorithm:</div>
              <div className="text-[#E5E7EB]">AES-256-GCM</div>
            </div>
          </div>
        </div>
      )}

      {/* Storage Quota */}
      {storageQuota && (
        <div className="mb-8 rounded-xl border border-[#374151] bg-[#111827] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💾</span>
            Storage Quota
          </h3>
          <div className="space-y-3">
            <div className="w-full bg-[#0B0F19] rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] transition-all"
                style={{ width: `${storageQuota.percentUsed}%` }}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[#6B7280]">Kullanılan:</div>
                <div className="text-[#E5E7EB]">{formatFileSize(storageQuota.used)}</div>
              </div>
              <div>
                <div className="text-[#6B7280]">Toplam:</div>
                <div className="text-[#E5E7EB]">{formatFileSize(storageQuota.quota)}</div>
              </div>
              <div>
                <div className="text-[#6B7280]">Kullanım:</div>
                <div className="text-[#10A37F] font-semibold">{storageQuota.percentUsed.toFixed(2)}%</div>
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
              Dosya seçip test edin, loglar burada görünecek...
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
          <li>✅ <strong>Client-Side Encryption:</strong> AES-256-GCM ile tarayıcıda şifreleme</li>
          <li>✅ <strong>Zero-Knowledge:</strong> Sunucu asla plaintext görmez</li>
          <li>✅ <strong>Authenticated Encryption:</strong> AEAD ile bütünlük koruması</li>
          <li>✅ <strong>Sealed URLs:</strong> Tek kullanımlık, süreli indirme linkleri</li>
          <li>✅ <strong>Storage Quota:</strong> IndexedDB kotası izleme</li>
          <li>✅ <strong>End-to-End:</strong> Şifreleme → Yükleme → İndirme → Çözme</li>
        </ul>
      </div>
    </div>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip')) return '📦';
  if (mimeType.includes('text/')) return '📝';
  return '📎';
}

function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
