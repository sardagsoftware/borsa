'use client';

export default function StocksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📈 Hisse Senetleri</h1>
          <p className="text-slate-400">Borsa İstanbul ve global piyasalar</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Hisse Senedi Modülü Yakında!
          </h2>
          <p className="text-slate-400 mb-6">
            Borsa İstanbul ve global hisse senetleri için canlı veriler ve AI tahminleri yakında eklenecek.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
            <span className="animate-pulse">⚡</span>
            Geliştirme aşamasında
          </div>
        </div>
      </div>
    </main>
  );
}