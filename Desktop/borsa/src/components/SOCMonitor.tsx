'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock, Eye, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

interface SecurityMetrics {
  encryptionStatus: 'active' | 'inactive';
  codeObfuscation: 'enabled' | 'disabled';
  threatLevel: 'low' | 'medium' | 'high';
  activeScans: number;
  blockedAttempts: number;
  lastScan: string;
}

export default function SOCMonitor() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    encryptionStatus: 'active',
    codeObfuscation: 'enabled',
    threatLevel: 'low',
    activeScans: 0,
    blockedAttempts: 0,
    lastScan: new Date().toISOString()
  });

  useEffect(() => {
    // Real-time SOC monitoring simulation
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeScans: prev.activeScans + 1,
        blockedAttempts: prev.blockedAttempts + Math.floor(Math.random() * 3),
        lastScan: new Date().toISOString()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-[#10A37F]/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* SOC Header */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-6 h-6 text-[#10A37F]" />
              <div className="absolute -top-1 -right-1 w-3 h-3">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10A37F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10A37F]"></span>
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SOC Active</h3>
              <p className="text-xs text-gray-400">Security Operations Center</p>
            </div>
          </div>

          {/* Security Metrics */}
          <div className="flex items-center gap-6 flex-1 justify-center">
            {/* Encryption Status */}
            <div className="flex items-center gap-2 bg-[#10A37F]/10 px-3 py-1.5 rounded-lg border border-[#10A37F]/20">
              <Lock className="w-4 h-4 text-[#10A37F]" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Şifreleme</span>
                <span className="text-xs font-semibold text-white">
                  {metrics.encryptionStatus === 'active' ? '✓ Aktif' : '✗ İnaktif'}
                </span>
              </div>
            </div>

            {/* Code Obfuscation */}
            <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
              <Eye className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Kod Gizleme</span>
                <span className="text-xs font-semibold text-white">
                  {metrics.codeObfuscation === 'enabled' ? '✓ Etkin' : '✗ Kapalı'}
                </span>
              </div>
            </div>

            {/* Threat Level */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              metrics.threatLevel === 'low'
                ? 'bg-green-500/10 border-green-500/20'
                : metrics.threatLevel === 'medium'
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              {metrics.threatLevel === 'low' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Tehdit Seviyesi</span>
                <span className="text-xs font-semibold text-white">
                  {metrics.threatLevel === 'low' ? 'Düşük' : metrics.threatLevel === 'medium' ? 'Orta' : 'Yüksek'}
                </span>
              </div>
            </div>

            {/* Active Scans */}
            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
              <Activity className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Tarama</span>
                <span className="text-xs font-semibold text-white">{metrics.activeScans} Tamamlandı</span>
              </div>
            </div>

            {/* Blocked Attempts */}
            <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
              <Shield className="w-4 h-4 text-orange-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Engellenen</span>
                <span className="text-xs font-semibold text-white">{metrics.blockedAttempts} Girişim</span>
              </div>
            </div>
          </div>

          {/* Last Scan Time */}
          <div className="text-right">
            <p className="text-xs text-gray-400">Son Tarama</p>
            <p className="text-xs font-mono text-[#10A37F]">{formatTime(metrics.lastScan)}</p>
          </div>
        </div>

        {/* Security Status Bar */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10A37F] to-purple-500 transition-all duration-1000"
                style={{ width: `${Math.min((metrics.activeScans / 100) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {Math.min(metrics.activeScans, 100)}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
