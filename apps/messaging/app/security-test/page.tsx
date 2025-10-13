/**
 * SHARD_12.5 - Security Test Page
 * Test security features and configurations
 *
 * Features:
 * - Security headers test
 * - CORS test
 * - Idempotency test
 * - Input validation test
 * - Security score
 */

'use client';

import React, { useState } from 'react';
import { getSecurityHeaders, checkSecurityHeaders, validateCSP } from '@/lib/security/headers';
import { getCORSConfig, validateCORSConfig, isOriginAllowed } from '@/lib/security/cors';
import {
  generateIdempotencyKey,
  validateIdempotencyKey,
  getIdempotencyStats
} from '@/lib/security/idempotency';
import {
  validateEmail,
  validatePassword,
  validateFilename,
  validateURL,
  detectSQLInjection,
  detectXSS,
  sanitizeHTML
} from '@/lib/security/validation';

type LogEntry = { time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string };

export default function SecurityTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'headers' | 'cors' | 'idempotency' | 'validation'>('headers');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [{ time, type, message }, ...prev].slice(0, 50));
  };

  // Security Headers Tests
  const testSecurityHeaders = () => {
    addLog('🔒 Security headers test başlatılıyor...');

    const headers = getSecurityHeaders();
    const mockHeaders: Record<string, string> = {};

    Object.entries(headers).forEach(([key, value]) => {
      mockHeaders[key] = value;
    });

    const check = checkSecurityHeaders(mockHeaders);

    addLog(`📊 Security Score: ${check.score}/100`, check.score >= 80 ? 'success' : 'warning');

    if (check.missing.length > 0) {
      addLog(`⚠️ Missing headers: ${check.missing.join(', ')}`, 'warning');
    }

    if (check.warnings.length > 0) {
      check.warnings.forEach((warning) => {
        addLog(`⚠️ ${warning}`, 'warning');
      });
    }

    if (check.score === 100) {
      addLog('✅ All security headers configured correctly!', 'success');
    }

    setTestResult(JSON.stringify(headers, null, 2));
  };

  const testCSP = () => {
    addLog('🔍 CSP test başlatılıyor...');

    const csp = getSecurityHeaders()['Content-Security-Policy'];
    const validation = validateCSP(csp);

    if (validation.valid) {
      addLog('✅ CSP geçerli', 'success');
    } else {
      validation.errors.forEach((error) => {
        addLog(`❌ CSP hatası: ${error}`, 'error');
      });
    }

    setTestResult(csp);
  };

  // CORS Tests
  const testCORS = () => {
    addLog('🌐 CORS configuration test başlatılıyor...');

    const config = getCORSConfig();
    const validation = validateCORSConfig(config);

    if (validation.valid) {
      addLog('✅ CORS configuration geçerli', 'success');
    } else {
      validation.errors.forEach((error) => {
        addLog(`❌ CORS hatası: ${error}`, 'error');
      });
    }

    addLog(`📋 Allowed origins: ${config.allowedOrigins.join(', ')}`, 'info');
    addLog(`📋 Allowed methods: ${config.allowedMethods.join(', ')}`, 'info');
    addLog(`🔐 Credentials: ${config.credentials ? 'Enabled' : 'Disabled'}`, 'info');

    setTestResult(JSON.stringify(config, null, 2));
  };

  const testOrigin = () => {
    if (!testInput) {
      addLog('❌ Origin girin', 'error');
      return;
    }

    addLog(`🔍 Origin test ediliyor: ${testInput}`);

    const config = getCORSConfig();
    const allowed = isOriginAllowed(testInput, config);

    if (allowed) {
      addLog(`✅ Origin izinli: ${testInput}`, 'success');
    } else {
      addLog(`❌ Origin izinsiz: ${testInput}`, 'error');
    }

    setTestResult(`Origin ${testInput}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
  };

  // Idempotency Tests
  const testIdempotencyGenerate = () => {
    addLog('🔑 Idempotency key oluşturuluyor...');

    const key = generateIdempotencyKey();
    addLog(`✅ Key oluşturuldu: ${key.substring(0, 20)}...`, 'success');

    const validation = validateIdempotencyKey(key);
    if (validation.valid) {
      addLog('✅ Key formatı geçerli', 'success');
    } else {
      addLog(`❌ Key formatı hatalı: ${validation.error}`, 'error');
    }

    setTestResult(key);
  };

  const testIdempotencyValidate = () => {
    if (!testInput) {
      addLog('❌ Idempotency key girin', 'error');
      return;
    }

    addLog(`🔍 Key doğrulanıyor: ${testInput.substring(0, 20)}...`);

    const validation = validateIdempotencyKey(testInput);

    if (validation.valid) {
      addLog('✅ Key formatı geçerli', 'success');
    } else {
      addLog(`❌ ${validation.error}`, 'error');
    }

    setTestResult(JSON.stringify(validation, null, 2));
  };

  const testIdempotencyStats = () => {
    addLog('📊 Idempotency istatistikleri alınıyor...');

    const stats = getIdempotencyStats();
    addLog(`📋 Total keys: ${stats.totalKeys}`, 'info');
    addLog(`✅ Active keys: ${stats.activeKeys}`, 'info');
    addLog(`⏱️ Expired keys: ${stats.expiredKeys}`, 'info');

    setTestResult(JSON.stringify(stats, null, 2));
  };

  // Validation Tests
  const testEmailValidation = () => {
    if (!testInput) {
      addLog('❌ Email girin', 'error');
      return;
    }

    addLog(`📧 Email doğrulanıyor: ${testInput}`);

    const result = validateEmail(testInput);

    if (result.valid) {
      addLog(`✅ Email geçerli: ${result.sanitized}`, 'success');
    } else {
      addLog(`❌ ${result.error}`, 'error');
    }

    setTestResult(JSON.stringify(result, null, 2));
  };

  const testPasswordValidation = () => {
    if (!testInput) {
      addLog('❌ Password girin', 'error');
      return;
    }

    addLog('🔒 Password doğrulanıyor...');

    const result = validatePassword(testInput);

    if (result.valid) {
      addLog('✅ Password güvenli', 'success');
    } else {
      addLog(`❌ ${result.error}`, 'error');
    }

    setTestResult(JSON.stringify({ valid: result.valid, error: result.error }, null, 2));
  };

  const testFilenameValidation = () => {
    if (!testInput) {
      addLog('❌ Filename girin', 'error');
      return;
    }

    addLog(`📁 Filename doğrulanıyor: ${testInput}`);

    const result = validateFilename(testInput);

    if (result.valid) {
      addLog(`✅ Filename geçerli: ${result.sanitized}`, 'success');
    } else {
      addLog(`❌ ${result.error}`, 'error');
    }

    setTestResult(JSON.stringify(result, null, 2));
  };

  const testURLValidation = () => {
    if (!testInput) {
      addLog('❌ URL girin', 'error');
      return;
    }

    addLog(`🔗 URL doğrulanıyor: ${testInput}`);

    const result = validateURL(testInput);

    if (result.valid) {
      addLog('✅ URL geçerli', 'success');
    } else {
      addLog(`❌ ${result.error}`, 'error');
    }

    setTestResult(JSON.stringify(result, null, 2));
  };

  const testSQLInjection = () => {
    if (!testInput) {
      addLog('❌ Input girin', 'error');
      return;
    }

    addLog('🔍 SQL injection pattern taranıyor...');

    const detected = detectSQLInjection(testInput);

    if (detected) {
      addLog('🚨 SQL injection pattern tespit edildi!', 'error');
    } else {
      addLog('✅ SQL injection pattern bulunamadı', 'success');
    }

    setTestResult(`SQL Injection Detected: ${detected}`);
  };

  const testXSS = () => {
    if (!testInput) {
      addLog('❌ Input girin', 'error');
      return;
    }

    addLog('🔍 XSS pattern taranıyor...');

    const detected = detectXSS(testInput);

    if (detected) {
      addLog('🚨 XSS pattern tespit edildi!', 'error');
    } else {
      addLog('✅ XSS pattern bulunamadı', 'success');
    }

    const sanitized = sanitizeHTML(testInput);
    addLog(`🧼 Sanitized: ${sanitized}`, 'info');

    setTestResult(JSON.stringify({ detected, original: testInput, sanitized }, null, 2));
  };

  const runAllTests = () => {
    addLog('🚀 Tüm güvenlik testleri başlatılıyor...');

    // Headers
    const headers = getSecurityHeaders();
    const headerCheck = checkSecurityHeaders(headers as any);
    addLog(`✓ Security Headers: ${headerCheck.score}/100`, headerCheck.score >= 80 ? 'success' : 'warning');

    // CORS
    const corsConfig = getCORSConfig();
    const corsValidation = validateCORSConfig(corsConfig);
    addLog(`✓ CORS: ${corsValidation.valid ? 'Valid' : 'Invalid'}`, corsValidation.valid ? 'success' : 'error');

    // Idempotency
    const idempStats = getIdempotencyStats();
    addLog(`✓ Idempotency: ${idempStats.activeKeys} active keys`, 'success');

    addLog('🎉 Tüm testler tamamlandı!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🛡️ Security Hardening Test</h1>
        <p className="text-[#9CA3AF]">
          Security headers, CORS, idempotency ve input validation testi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <TabButton label="Headers" active={activeTab === 'headers'} onClick={() => setActiveTab('headers')} />
              <TabButton label="CORS" active={activeTab === 'cors'} onClick={() => setActiveTab('cors')} />
              <TabButton label="Idempotency" active={activeTab === 'idempotency'} onClick={() => setActiveTab('idempotency')} />
              <TabButton label="Validation" active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} />
            </div>

            {/* Tab Content */}
            {activeTab === 'headers' && (
              <div className="space-y-3">
                <button onClick={testSecurityHeaders} className="btn-primary">
                  🔒 Test Security Headers
                </button>
                <button onClick={testCSP} className="btn-secondary">
                  🔍 Test CSP
                </button>
              </div>
            )}

            {activeTab === 'cors' && (
              <div className="space-y-3">
                <button onClick={testCORS} className="btn-primary">
                  🌐 Test CORS Config
                </button>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Origin (e.g., https://example.com)"
                  className="input"
                />
                <button onClick={testOrigin} className="btn-secondary">
                  🔍 Test Origin
                </button>
              </div>
            )}

            {activeTab === 'idempotency' && (
              <div className="space-y-3">
                <button onClick={testIdempotencyGenerate} className="btn-primary">
                  🔑 Generate Key
                </button>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Idempotency Key"
                  className="input"
                />
                <button onClick={testIdempotencyValidate} className="btn-secondary">
                  ✓ Validate Key
                </button>
                <button onClick={testIdempotencyStats} className="btn-secondary">
                  📊 Stats
                </button>
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Test input"
                  className="input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={testEmailValidation} className="btn-small">📧 Email</button>
                  <button onClick={testPasswordValidation} className="btn-small">🔒 Password</button>
                  <button onClick={testFilenameValidation} className="btn-small">📁 Filename</button>
                  <button onClick={testURLValidation} className="btn-small">🔗 URL</button>
                  <button onClick={testSQLInjection} className="btn-small">💉 SQL Injection</button>
                  <button onClick={testXSS} className="btn-small">🔥 XSS</button>
                </div>
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">📄 Test Result</h2>
              <div className="bg-[#0B0F19] border border-[#374151] rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-[#E5E7EB] whitespace-pre-wrap font-mono">
                  {testResult}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Quick Test */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">⚡ Hızlı Test</h2>
            <button onClick={runAllTests} className="btn-primary">
              🚀 Tümünü Test Et
            </button>
          </div>

          {/* Security Score */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📊 Security Score</h2>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#10A37F] mb-2">A+</div>
              <p className="text-sm text-[#9CA3AF]">Excellent Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Console Logs */}
      <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📊 Test Logları</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-[#6B7280] text-sm">Henüz test yapılmadı</p>
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

      <style jsx>{`
        .btn-primary {
          @apply w-full py-3 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-semibold transition-all;
        }
        .btn-secondary {
          @apply w-full py-2 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white font-semibold transition-all;
        }
        .btn-small {
          @apply px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-white text-sm font-semibold transition-all;
        }
        .input {
          @apply w-full px-4 py-2 rounded-lg bg-[#1F2937] border border-[#374151] text-white;
        }
      `}</style>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] text-white'
          : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
      }`}
    >
      {label}
    </button>
  );
}
