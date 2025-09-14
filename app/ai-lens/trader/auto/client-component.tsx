'use client';

export default function ClientAutoTraderPage() {
  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand1 to-brand2 bg-clip-text text-transparent">
          AI-LENS TRADER — AUTO-TRADER
        </h1>
        <p className="text-dim mt-2">
          Auto trading module will be available soon. This page is being dynamically loaded to prevent SSR issues.
        </p>
        
        <div className="mt-8 p-8 bg-panel rounded-lg border border-white/10">
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-bold mb-2">Auto Trading System</h2>
            <p className="text-dim">
              Advanced AI-powered trading bot with risk management and real-time signal processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
