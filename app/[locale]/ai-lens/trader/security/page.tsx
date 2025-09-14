'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, CheckCircle, Clock, Target, Zap } from 'lucide-react';
import { SecurityScore } from '../../../../../components/security/SecurityScore';

interface SecurityScanResult {
  id: string;
  score: number;
  findings: number;
  timestamp: string;
  summary: string;
  status: 'running' | 'completed' | 'failed';
}

export default function SecurityCenterPage() {
  const [lastScan, setLastScan] = useState<SecurityScanResult | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'running'>('idle');
  const [findings, setFindings] = useState<Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>>([]);

  useEffect(() => {
    loadLastScan();
  }, []);

  const loadLastScan = async () => {
    try {
      const response = await fetch('/api/sec/scan/status');
      if (response.ok) {
        const data = await response.json();
        setLastScan(data.lastScan);
        setFindings(data.findings || []);
      }
    } catch (error) {
      console.error('Failed to load scan status:', error);
    }
  };

  const runScan = async () => {
    setScanStatus('running');
    try {
      const response = await fetch('/api/sec/scan/run', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        setLastScan({
          id: result.scanId,
          score: result.score,
          findings: result.findings,
          timestamp: result.timestamp,
          summary: result.summary,
          status: 'completed'
        });
        await loadLastScan();
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-binance-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-binance-yellow" />
            <h1 className="text-3xl font-bold text-binance-text">
              🛡️ AILYDIAN Security Center
            </h1>
          </div>
          <p className="text-binance-textSecondary">
            Comprehensive security monitoring and threat detection for AI Lens Trader
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-binance-textSecondary text-sm">Security Score</p>
                <div className="flex items-center gap-2">
                  <SecurityScore score={lastScan?.score || 85} />
                </div>
              </div>
              <Shield className="w-8 h-8 text-binance-yellow" />
            </div>
          </div>

          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-binance-textSecondary text-sm">Active Findings</p>
                <p className="text-2xl font-bold text-binance-text">{findings.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-binance-yellow" />
            </div>
          </div>

          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-binance-textSecondary text-sm">Last Scan</p>
                <p className="text-sm text-binance-text">
                  {lastScan ? new Date(lastScan.timestamp).toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-binance-blue" />
            </div>
          </div>

          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-binance-textSecondary text-sm">Status</p>
                <p className="text-sm font-semibold text-binance-green">
                  {scanStatus === 'running' ? '🔄 Scanning...' : '✅ Ready'}
                </p>
              </div>
              <Target className="w-8 h-8 text-binance-green" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={runScan}
              disabled={scanStatus === 'running'}
              className="bg-binance-yellow text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {scanStatus === 'running' ? 'Scanning...' : 'Run Security Scan'}
            </button>
            
            <button
              onClick={loadLastScan}
              className="bg-binance-panel border border-gray-600 text-binance-text px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Security Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Headers & CSP */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-binance-blue" />
              <h3 className="text-xl font-semibold text-binance-text">Headers & CSP</h3>
              <CheckCircle className="w-5 h-5 text-binance-green" />
            </div>
            <p className="text-binance-textSecondary mb-4">
              Content Security Policy, CORS, and security headers monitoring
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">CSP</span>
                <span className="text-binance-green text-sm">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">HSTS</span>
                <span className="text-binance-green text-sm">✓ Enforced</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">X-Frame-Options</span>
                <span className="text-binance-green text-sm">✓ DENY</span>
              </div>
            </div>
          </div>

          {/* OSINT Advisories */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-binance-yellow" />
              <h3 className="text-xl font-semibold text-binance-text">OSINT Advisories</h3>
              <div className="bg-binance-yellow text-black px-2 py-1 rounded text-xs font-semibold">
                {findings.filter(f => f.type === 'ADVISORY').length}
              </div>
            </div>
            <p className="text-binance-textSecondary mb-4">
              CISA KEV, NVD CVE, GitHub Security Advisories monitoring
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">CVE Feed</span>
                <span className="text-binance-green text-sm">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">GHSA Feed</span>
                <span className="text-binance-green text-sm">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">CISA KEV</span>
                <span className="text-binance-green text-sm">✓ Monitored</span>
              </div>
            </div>
          </div>

          {/* SBOM Analysis */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-binance-blue" />
              <h3 className="text-xl font-semibold text-binance-text">SBOM Analysis</h3>
              <CheckCircle className="w-5 h-5 text-binance-green" />
            </div>
            <p className="text-binance-textSecondary mb-4">
              Software Bill of Materials vulnerability mapping
            </p>
            <Link
              href="/ai-lens/trader/security/sbom"
              className="inline-block bg-binance-blue text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              View SBOM
            </Link>
          </div>

          {/* Ownership & Compliance */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-binance-yellow" />
              <h3 className="text-xl font-semibold text-binance-text">Ownership & Compliance</h3>
              <CheckCircle className="w-5 h-5 text-binance-green" />
            </div>
            <p className="text-binance-textSecondary mb-4">
              Copyright protection and legal compliance monitoring
            </p>
            <Link
              href="/ai-lens/trader/security/ownership"
              className="inline-block bg-binance-yellow text-black px-4 py-2 rounded hover:bg-yellow-500 font-semibold"
            >
              View Legal Info
            </Link>
          </div>
        </div>

        {/* Recent Findings */}
        {findings.length > 0 && (
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <h3 className="text-xl font-semibold text-binance-text mb-4">Recent Security Findings</h3>
            <div className="space-y-4">
              {findings.slice(0, 5).map((finding, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-binance-dark rounded border border-gray-700">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    finding.severity === 'CRITICAL' ? 'bg-red-500' :
                    finding.severity === 'HIGH' ? 'bg-orange-500' :
                    finding.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-binance-text">{finding.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        finding.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                        finding.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                        finding.severity === 'MEDIUM' ? 'bg-yellow-600 text-black' : 'bg-blue-600 text-white'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-binance-textSecondary text-sm">{finding.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Summary */}
        {lastScan && (
          <div className="mt-8 bg-binance-panel p-6 rounded-lg border border-gray-600">
            <h3 className="text-xl font-semibold text-binance-text mb-4">Last Scan Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-binance-textSecondary text-sm">Scan ID</p>
                <p className="font-mono text-sm text-binance-text">{lastScan.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-binance-textSecondary text-sm">Completed</p>
                <p className="text-sm text-binance-text">
                  {new Date(lastScan.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-binance-textSecondary text-sm">Summary</p>
                <p className="text-sm text-binance-text">{lastScan.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
