import React from 'react';
import Link from 'next/link';

export default function BriefPage({ params }: { params: { locale: string } }) {
  const currentLocale = params.locale;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      <div className="container mx-auto px-6 py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            🚀 AiLydian Trader
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Profesyonel Kripto Para Trading Platformu
          </p>
          <Link 
            href={`/${currentLocale}/auth/signin`}
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Trading&apos;e Başla
          </Link>
        </header>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-4">AI Destekli Trading</h3>
            <p className="text-slate-300">
              Gelişmiş makine öğrenmesi algoritmaları ile piyasa analizi ve trading sinyalleri.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-4">Kurumsal Güvenlik</h3>
            <p className="text-slate-300">
              Banka seviyesinde güvenlik ile çok katmanlı koruma ve şifrelenmiş veri depolama.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-4">Otomatik Trading</h3>
            <p className="text-slate-300">
              7/24 çalışan akıllı trading botları ile özelleştirilebilir strateji yönetimi.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
          <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">99.9%</div>
            <div className="text-sm text-slate-400">Çalışır Durumda</div>
          </div>
          
          <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">�</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">&lt; 1ms</div>
            <div className="text-sm text-slate-400">Gecikme</div>
          </div>
          
          <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">�</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">256-bit</div>
            <div className="text-sm text-slate-400">Şifreleme</div>
          </div>
          
          <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">24/7</div>
            <div className="text-sm text-slate-400">Destek</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Trading&apos;e Başlamaya Hazır mısınız?</h2>
          <Link 
            href={`/${currentLocale}/auth/signin`}
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
          >
            Hemen Başla
          </Link>
        </div>
      </div>
    </div>
  );
}
