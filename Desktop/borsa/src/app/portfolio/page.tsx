'use client';

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💼 Portföyüm</h1>
          <p className="text-slate-400">Yatırımlarınızı takip edin ve yönetin</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Toplam Değer</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-emerald-400 text-sm mt-2">Henüz işlem yok</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Kar/Zarar</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-slate-400 text-sm mt-2">%0.00</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Aktif Varlıklar</div>
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-slate-400 text-sm mt-2">Diversifikasyon: -</div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Portföyünüz Boş
          </h2>
          <p className="text-slate-400 mb-6">
            İlk yatırımınızı yaparak portföyünüzü oluşturmaya başlayın.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
            İşlem Yap
          </button>
        </div>
      </div>
    </main>
  );
}