/**
 * AILYDIAN BORSA - Ana Sayfa
 *
 * Production-Grade Trading Platform with AI Signals
 * White-hat compliant, real money trading ready
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AILYDIAN BORSA</h1>
                <p className="text-xs text-blue-300">AI-Powered Trading Platform</p>
              </div>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-500/20 border border-blue-500/50">
            <span className="text-blue-300 text-sm font-semibold">✓ Railway AI Microservice Active</span>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6">
            AI-Powered Crypto Trading
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Real-Time Signals
            </span>
          </h2>

          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Advanced technical analysis with multi-indicator consensus algorithm.
            HMAC-authenticated AI signals from Railway microservices.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Technical Analysis</h3>
              <p className="text-sm text-blue-300">RSI, MACD, Bollinger Bands, EMA, Volume indicators</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Predictions</h3>
              <p className="text-sm text-blue-300">Multi-indicator consensus with confidence scoring</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Fast</h3>
              <p className="text-sm text-blue-300">HMAC-SHA256 auth, sub-second response times</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-500/50"
          >
            Get Started →
          </Link>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-blue-300">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">&lt;1s</div>
              <div className="text-sm text-blue-300">Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">5+</div>
              <div className="text-sm text-blue-300">AI Indicators</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-800/50 bg-slate-900/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-blue-300">
            <p>© 2025 AILYDIAN BORSA - AI Trading Platform</p>
            <p className="mt-1 text-xs text-blue-400">
              White-hat compliant • HMAC Secured • Real-time Binance Data
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
