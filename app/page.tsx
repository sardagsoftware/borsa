import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-binance-dark">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-binance-text">
            🚀 AiLydian Trader - Professional Trading Platform
          </h1>
          <div className="flex gap-3">
            <Link href="/dashboard" className="btn-primary px-4 py-2">
              👤 User Dashboard
            </Link>
            <Link href="/auth/signin" className="btn-secondary px-4 py-2">
              🔑 Sign In
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Terminal Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-yellow mb-4">📊 Trading Terminal</h2>
            <p className="text-binance-text mb-4">Binance Futures benzeri profesyonel terminal</p>
            <Link href="/ai-lens/trader" className="btn-primary px-4 py-2 rounded">
              Terminal Aç
            </Link>
          </div>

          {/* Risk Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-red mb-4">⚠️ Risk Management</h2>
            <p className="text-binance-text mb-4">VaR, CVaR, Stress Test, Compliance</p>
            <Link href="/risk" className="btn-primary px-4 py-2 rounded">
              Risk Aç
            </Link>
          </div>

          {/* Portfolio Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-green mb-4">💼 Portfolio</h2>
            <p className="text-binance-text mb-4">Markowitz, Kelly, Black-Litterman</p>
            <Link href="/portfolio" className="btn-primary px-4 py-2 rounded">
              Portfolio Aç
            </Link>
          </div>

          {/* Bot Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-yellow mb-4">🤖 AI Bot</h2>
            <p className="text-binance-text mb-4">Composite Signal + Policy Engine</p>
            <Link href="/bot" className="btn-primary px-4 py-2 rounded">
              Bot Aç
            </Link>
          </div>

          {/* Security Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-red mb-4">🔒 Security</h2>
            <p className="text-binance-text mb-4">2FA, Kill Switch, Compliance</p>
            <Link href="/security" className="btn-primary px-4 py-2 rounded">
              Security Aç
            </Link>
          </div>

          {/* Options Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-green mb-4">📈 Options</h2>
            <p className="text-binance-text mb-4">Greeks, Hedge, Surface Analysis</p>
            <Link href="/options" className="btn-primary px-4 py-2 rounded">
              Options Aç
            </Link>
          </div>

          {/* Journal Kartı */}
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-binance-text mb-4">📝 Journal</h2>
            <p className="text-binance-text mb-4">XAI Analysis & Trade History</p>
            <Link href="/journal" className="btn-primary px-4 py-2 rounded">
              Journal Aç
            </Link>
          </div>
        </div>
        
        {/* Bot Status Bar */}
        <div className="mt-8 bg-binance-panel p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-binance-text">Bot Status:</span>
              <span className="text-binance-green">● Active</span>
              <span className="text-binance-text">Mode: Semi</span>
              <span className="text-binance-text">Last Signal: +72.5</span>
            </div>
            <button className="bg-binance-red text-white px-4 py-2 rounded font-bold">
              🛑 KILL SWITCH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
