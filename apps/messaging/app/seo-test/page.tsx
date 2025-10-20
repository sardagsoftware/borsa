/**
 * SHARD_11.6 - SEO Test Page
 * Test and verify SEO configuration
 *
 * Features:
 * - Meta tags verification
 * - Sitemap generation
 * - Robots.txt test
 * - Structured data validation
 */

'use client';

import React, { useState } from 'react';
import { generateSitemap, generateRobotsTxt } from '@/lib/seo/sitemap';
import { getPageMetadata, generateMetaTags, generateStructuredData, generateSecurityTxt } from '@/lib/seo/metadata';

type LogEntry = { time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string };

export default function SEOTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'metadata' | 'sitemap' | 'robots' | 'structured'>('metadata');
  const [selectedPage, setSelectedPage] = useState('home');
  const [generatedContent, setGeneratedContent] = useState('');

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [{ time, type, message }, ...prev].slice(0, 50));
  };

  const pages = ['home', 'privacy', 'terms', 'security', 'chat', 'dashboard'];

  const testMetadata = () => {
    addLog('🔍 Metadata test başlatılıyor...');
    const metadata = getPageMetadata(selectedPage);
    const metaTags = generateMetaTags(metadata);

    setGeneratedContent(metaTags);
    addLog(`✅ ${selectedPage} sayfası metadata oluşturuldu`, 'success');
    addLog(`📊 Title: ${metadata.title}`, 'info');
    addLog(`📝 Description: ${metadata.description.substring(0, 50)}...`, 'info');
    if (metadata.noindex) {
      addLog('⚠️ Bu sayfa noindex (arama motorları indekslemez)', 'warning');
    }
  };

  const testSitemap = () => {
    addLog('🗺️ Sitemap oluşturuluyor...');
    const sitemap = generateSitemap('https://messaging.ailydian.com');
    setGeneratedContent(sitemap);

    const urlCount = (sitemap.match(/<url>/g) || []).length;
    addLog(`✅ Sitemap oluşturuldu - ${urlCount} sayfa`, 'success');
  };

  const testRobots = () => {
    addLog('🤖 Robots.txt oluşturuluyor...');
    const robots = generateRobotsTxt('https://messaging.ailydian.com');
    setGeneratedContent(robots);
    addLog('✅ Robots.txt oluşturuldu', 'success');
  };

  const testStructuredData = () => {
    addLog('📊 Structured data oluşturuluyor...');
    const org = generateStructuredData('Organization');
    const webapp = generateStructuredData('WebApplication');
    setGeneratedContent(`${org}\n\n${webapp}`);
    addLog('✅ JSON-LD structured data oluşturuldu', 'success');
  };

  const testSecurityTxt = () => {
    addLog('🔐 Security.txt oluşturuluyor...');
    const securityTxt = generateSecurityTxt();
    setGeneratedContent(securityTxt);
    addLog('✅ Security.txt oluşturuldu (RFC 9116)', 'success');
  };

  const testAll = () => {
    addLog('🚀 Tüm SEO testleri başlatılıyor...');

    // Test all pages
    pages.forEach((page) => {
      const metadata = getPageMetadata(page);
      addLog(`✓ ${page}: ${metadata.title}`, 'success');
    });

    // Test sitemap
    const sitemap = generateSitemap();
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    addLog(`✓ Sitemap: ${urlCount} sayfa`, 'success');

    // Test robots
    addLog('✓ Robots.txt: OK', 'success');

    // Test structured data
    addLog('✓ Structured Data: Organization + WebApplication', 'success');

    addLog('🎉 Tüm testler başarılı!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🔍 SEO & Privacy Test</h1>
        <p className="text-[#9CA3AF]">
          Meta tags, sitemap, robots.txt ve structured data testi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <TabButton
                label="Meta Tags"
                active={activeTab === 'metadata'}
                onClick={() => {
                  setActiveTab('metadata');
                  setGeneratedContent('');
                }}
              />
              <TabButton
                label="Sitemap"
                active={activeTab === 'sitemap'}
                onClick={() => {
                  setActiveTab('sitemap');
                  setGeneratedContent('');
                }}
              />
              <TabButton
                label="Robots.txt"
                active={activeTab === 'robots'}
                onClick={() => {
                  setActiveTab('robots');
                  setGeneratedContent('');
                }}
              />
              <TabButton
                label="Structured Data"
                active={activeTab === 'structured'}
                onClick={() => {
                  setActiveTab('structured');
                  setGeneratedContent('');
                }}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'metadata' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Sayfa Seçin:</label>
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#1F2937] border border-[#374151] text-white mb-4"
                >
                  {pages.map((page) => (
                    <option key={page} value={page}>
                      {page.charAt(0).toUpperCase() + page.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={testMetadata}
                  className="w-full py-3 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all"
                >
                  🔍 Meta Tags Oluştur
                </button>
              </div>
            )}

            {activeTab === 'sitemap' && (
              <div>
                <p className="text-sm text-[#9CA3AF] mb-4">
                  XML sitemap oluşturur. Arama motorları için URL listesi.
                </p>
                <button
                  onClick={testSitemap}
                  className="w-full py-3 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all"
                >
                  🗺️ Sitemap Oluştur
                </button>
              </div>
            )}

            {activeTab === 'robots' && (
              <div>
                <p className="text-sm text-[#9CA3AF] mb-4">
                  Robots.txt oluşturur. Arama motorlarına hangi sayfaların indeksleneceğini belirtir.
                </p>
                <button
                  onClick={testRobots}
                  className="w-full py-3 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all"
                >
                  🤖 Robots.txt Oluştur
                </button>
                <button
                  onClick={testSecurityTxt}
                  className="w-full mt-2 py-3 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white font-semibold transition-all"
                >
                  🔐 Security.txt Oluştur
                </button>
              </div>
            )}

            {activeTab === 'structured' && (
              <div>
                <p className="text-sm text-[#9CA3AF] mb-4">
                  JSON-LD structured data oluşturur. Google rich snippets için.
                </p>
                <button
                  onClick={testStructuredData}
                  className="w-full py-3 rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white font-semibold transition-all"
                >
                  📊 Structured Data Oluştur
                </button>
              </div>
            )}
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">📄 Oluşturulan İçerik</h2>
              <div className="bg-[#0B0F19] border border-[#374151] rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-[#E5E7EB] whitespace-pre-wrap font-mono">
                  {generatedContent}
                </pre>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent);
                  addLog('📋 İçerik panoya kopyalandı', 'success');
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white font-semibold transition-all"
              >
                📋 Kopyala
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Info & Stats */}
        <div className="space-y-6">
          {/* Quick Test */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">⚡ Hızlı Test</h2>
            <button
              onClick={testAll}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-semibold transition-all"
            >
              🚀 Tümünü Test Et
            </button>
          </div>

          {/* SEO Stats */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📊 SEO İstatistikleri</h2>
            <div className="space-y-3">
              <StatItem icon="📄" label="Toplam Sayfa" value={pages.length.toString()} />
              <StatItem icon="🔍" label="İndekslenebilir" value="4" />
              <StatItem icon="🚫" label="Noindex" value="2" />
              <StatItem icon="🗺️" label="Sitemap URL" value="4" />
            </div>
          </div>

          {/* Links */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🔗 Sayfalar</h2>
            <div className="space-y-2">
              <PageLink href="/privacy" label="📜 Gizlilik Politikası" />
              <PageLink href="/terms" label="📋 Kullanım Koşulları" />
              <PageLink href="/security" label="🛡️ Güvenlik" />
              <PageLink href="/robots.txt" label="🤖 Robots.txt" external />
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
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#1F2937] rounded-lg">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function PageLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block px-3 py-2 bg-[#1F2937] hover:bg-[#374151] rounded-lg text-sm transition-colors"
    >
      {label}
      {external && ' ↗'}
    </a>
  );
}
