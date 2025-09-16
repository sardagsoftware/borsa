'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BotStatusBar from '@/components/trader/auto/BotStatusBar';
import UniverseTable from '@/components/trader/auto/UniverseTable';
import SignalMeter from '@/components/trader/auto/SignalMeter';
import PreAlerts from '@/components/trader/auto/PreAlerts';
import RiskPanel from '@/components/trader/auto/RiskPanel';
import JournalView from '@/components/trader/auto/JournalView';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AutoTraderPageProps {}

export default function AutoTraderPage({}: AutoTraderPageProps) {
  const [botMode, setBotMode] = useState<'semi' | 'auto' | 'off'>('semi');
  const [killSwitch, setKillSwitch] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [universe, setUniverse] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    loadUniverse();
    startSignalStream();
  }, []);

  const loadUniverse = async () => {
    try {
      const response = await fetch('/api/auto/universe');
      const data = await response.json();
      
      if (data.success) {
        setUniverse(data.data.members || []);
      }
    } catch (error) {
      console.error('Failed to load universe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSignalStream = () => {
    const eventSource = new EventSource('/api/auto/signal');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'signals') {
          setSignals(data.data);
        }
      } catch (error) {
        console.error('Signal stream error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => eventSource.close();
  };

  const handleModeChange = (mode: 'semi' | 'auto' | 'off') => {
    setBotMode(mode);
    // Save to backend
  };

  const handleKillSwitch = (activated: boolean) => {
    setKillSwitch(activated);
    // Emergency stop all operations
  };

  const handleOptInToggle = (enabled: boolean) => {
    setOptIn(enabled);
    // Update live trading permission
  };

  const runScan = async () => {
    try {
      const topSymbols = universe.slice(0, 10).map(u => u.symbol);
      
      const response = await fetch('/api/auto/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbols: topSymbols,
          timeframe: '1h',
          includeLeadLag: true
        })
      });

      const data = await response.json();
      console.log('Scan results:', data);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1426] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] bg-clip-text text-transparent">
              AI-LENS TRADER — FUTURES AUTO-TRADER
            </h1>
            <p className="text-gray-400 mt-1">
              Top100 Futures • Pre-regime/Pre-breakout Alerts • BTC/ETH Lead-Lag • Autonomous Trading
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={runScan}
              className="px-4 py-2 bg-[#0ECB81] hover:bg-[#0CAD6F] rounded-lg font-medium transition-colors"
            >
              Run Scan
            </button>
          </div>
        </div>

        {/* Bot Status Bar */}
        <BotStatusBar
          mode={botMode}
          killSwitch={killSwitch}
          optIn={optIn}
          onModeChange={handleModeChange}
          onKillSwitch={handleKillSwitch}
          onOptInToggle={handleOptInToggle}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Universe & Signals */}
          <div className="col-span-8 space-y-6">
            
            {/* Universe Table */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">
                  Top100 Universe ({universe.length} Futures-Supported)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UniverseTable 
                  data={universe}
                  loading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Pre-Alerts */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">Pre-Regime / Pre-Breakout Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                                <PreAlerts alerts={[]} />
              </CardContent>
            </Card>

            {/* Journal */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">Decision Journal & XAI</CardTitle>
              </CardHeader>
              <CardContent>
                <JournalView entries={[]} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Signals & Risk */}
          <div className="col-span-4 space-y-6">
            
            {/* Signal Meter */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">Composite Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <SignalMeter 
                  symbol="BTC" 
                  signal={73} 
                  confidence={87} 
                  lastUpdate={new Date().toISOString()}
                />
              </CardContent>
            </Card>

            {/* Risk Panel */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskPanel metrics={{
                  dailyPnL: 127.45,
                  maxDailyLoss: 600,
                  totalPositions: 3,
                  maxPositions: 5,
                  portfolioRisk: 2.1,
                  maxPortfolioRisk: 5.0,
                  avgPositionSize: 0.8,
                  maxPositionSize: 2.0,
                  winRate: 73.4,
                  sharpeRatio: 1.87,
                  maxDrawdown: -3.2,
                  var95: -45.2
                }} />
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#F0B90B]">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <div className="w-3 h-3 bg-[#0ECB81] rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <span>Binance API</span>
                    <div className="w-3 h-3 bg-[#0ECB81] rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <span>WebSockets</span>
                    <div className="w-3 h-3 bg-[#F0B90B] rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Guards</span>
                    <div className="w-3 h-3 bg-[#0ECB81] rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
