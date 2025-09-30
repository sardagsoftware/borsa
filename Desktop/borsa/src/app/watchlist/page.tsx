'use client';

export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👁️ İzleme Listesi</h1>
          <p className="text-slate-400">Favori varlıklarınızı takip edin</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
          <div className="text-6xl mb-6">⭐</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            İzleme Listeniz Boş
          </h2>
          <p className="text-slate-400 mb-6">
            Takip etmek istediğiniz hisse senetlerini ve kripto paraları ekleyin.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold rounded-lg hover:bg-blue-500/30 transition-all">
              Hisse Ekle
            </button>
            <button className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-lg hover:bg-emerald-500/30 transition-all">
              Kripto Ekle
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}