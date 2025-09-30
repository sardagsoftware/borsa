import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Logo size="lg" animated={true} className="mx-auto mb-8" />
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            LyDian Trader
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">
            Kuantum Seviyesi Doğrulukla Yapay Zeka Destekli Ticaret Platformu
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
            >
              Başla
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-slate-700/50 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all border border-slate-600"
            >
              Kontrol Panelini Görüntüle
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-emerald-400 text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Ultra Hızlı</h3>
            <p className="text-slate-400">Nirvana seviyesi performans ile 0.20ms TPS</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-emerald-400 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">%93 Doğruluk</h3>
            <p className="text-slate-400">Detaylı analiz ile gerçek zamanlı sinyaller</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-emerald-400 text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-2">Beyaz Şapka Uyumlu</h3>
            <p className="text-slate-400">%100 yasal ve güvenli ticaret</p>
          </div>
        </div>
      </div>
    </main>
  );
}