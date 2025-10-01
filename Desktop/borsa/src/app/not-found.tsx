import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-2xl shadow-purple-500/10 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-slate-300 mb-8">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/30"
            >
              🏠 Ana Sayfa
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/30"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
