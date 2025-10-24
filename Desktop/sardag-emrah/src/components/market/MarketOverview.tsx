"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMarketData, type MarketData } from "@/hooks/useMarketData";
import { useCoinScanner } from "@/hooks/useCoinScanner";
import { useTraditionalMarkets } from "@/hooks/useTraditionalMarkets";
import { convertToMarketData, type TraditionalMarketData } from "@/types/traditional-markets";
import CoinCard from "./CoinCard";
import MultiStrategyModal from "./MultiStrategyModal";
import SignalNotification from "./SignalNotification";
import PreferencesModal from "@/components/settings/PreferencesModal";
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  startBackgroundScanner,
  startBackgroundScannerEnhanced,
  getScannerStatus,
} from "@/lib/notifications/signal-notifier";
import { getPreferences } from "@/lib/preferences";
import { calculateRiskScore, getRiskColorPalette, type RiskScore } from "@/lib/market/risk-calculator";
import { useBackgroundScanner, useSignalNotifications } from "@/hooks/useBackgroundScanner";

/**
 * MARKET OVERVIEW COMPONENT
 *
 * 200 coin grid display
 * - Top 10 performers (7d) at top
 * - Responsive grid
 * - Click to analyze
 */

type SortOption = "7d" | "24h" | "volume" | "rank";

export default function MarketOverview() {
  const { data, loading, error, refresh, marketType, setMarketType } = useMarketData();
  const traditionalMarkets = useTraditionalMarkets(); // NEW: Traditional markets hook
  const scanner = useCoinScanner(data);
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<MarketData | null>(null);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Scan count for color palette rotation
  const [scanCount, setScanCount] = useState(0);

  // 🔄 NEW: Background scanner hook - 7/24 otomatik çalışır
  const { results: backgroundResults, buySignals, isRunning, lastScan } = useBackgroundScanner();

  // 🔔 NEW: Smart notifications - sadece BUY/STRONG_BUY
  useSignalNotifications((result) => {
    if (areNotificationsEnabled()) {
      // Show browser notification
      new Notification(`${result.analysis.badge} Signal!`, {
        body: `${result.symbol}: ${result.analysis.strategies.join(', ')}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  });

  // Check notification permission on mount
  useEffect(() => {
    setNotificationsEnabled(areNotificationsEnabled());

    // Check if notifications enabled in preferences
    const prefs = getPreferences();
    if (prefs.notifications.enabled && areNotificationsEnabled()) {
      setScannerActive(true);
    }
  }, []);

  // Automatic hourly scan (ALWAYS active - user requirement)
  useEffect(() => {
    console.log('[Market] 🕐 Starting HOURLY automatic scanner...');

    // Initial scan immediately
    scanner.startScan();
    setScanCount(prev => prev + 1);

    // Scan every hour (60 minutes)
    const hourlyInterval = setInterval(() => {
      console.log('[Market] ⏰ Hourly auto-scan triggered');
      scanner.startScan();
      setScanCount(prev => prev + 1);
    }, 60 * 60 * 1000); // 60 minutes

    return () => {
      console.log('[Market] Stopping hourly scanner...');
      clearInterval(hourlyInterval);
    };
  }, []); // Empty deps - run once on mount

  // Start background scanner when enabled
  useEffect(() => {
    if (!scannerActive) return;

    console.log('[Market] Starting enhanced background scanner...');

    // Get scan interval from preferences
    const prefs = getPreferences();
    const scanInterval = prefs.scanner.interval;

    // Use enhanced scanner with Service Worker support
    let cleanup: (() => void) | undefined;
    startBackgroundScannerEnhanced(scanInterval).then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      console.log('[Market] Stopping background scanner...');
      if (cleanup) cleanup();
    };
  }, [scannerActive]);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        setScannerActive(true);
      }
    } else {
      setScannerActive(!scannerActive);
    }
  };

  // Filtered & sorted data
  const displayData = useMemo(() => {
    let filtered = data;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toUpperCase();
      filtered = filtered.filter(coin =>
        coin.symbol.includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "7d":
          return (b.changePercent7d || b.changePercent24h) - (a.changePercent7d || a.changePercent24h);
        case "24h":
          return b.changePercent24h - a.changePercent24h;
        case "volume":
          return b.volume24h - a.volume24h;
        case "rank":
          return (a.rank || 999) - (b.rank || 999);
        default:
          return 0;
      }
    });

    return sorted;
  }, [data, sortBy, searchQuery]);

  // Top 10 performers (7d)
  const top10 = useMemo(() => {
    return [...data]
      .sort((a, b) => (b.changePercent7d || 0) - (a.changePercent7d || 0))
      .slice(0, 10);
  }, [data]);

  // Handle coin click - Open comprehensive analysis modal
  const handleCoinClick = (coin: MarketData) => {
    setSelectedCoin(coin);
  };

  // Get signal strength for coin (based on background scanner data)
  const getSignalStrength = (symbol: string): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' => {
    // First check background scanner (NEW system)
    const scanResult = backgroundResults.find(r => r.symbol === symbol);
    if (scanResult?.analysis) {
      const { strength } = scanResult.analysis;
      if (strength === 'STRONG_BUY') return 'STRONG_BUY';
      if (strength === 'BUY') return 'BUY';
      return 'NEUTRAL';
    }

    // Fallback to old scanner
    const signal = scanner.getSignal(symbol);
    if (!signal) return 'NEUTRAL';

    if (signal.signalCount >= 5) return 'STRONG_BUY';
    if (signal.signalCount >= 3) return 'BUY';
    return 'NEUTRAL';
  };

  // Calculate confidence score (0-100%) - uses background scanner first
  const getConfidenceScore = (symbol: string): number | undefined => {
    // First check background scanner (NEW system - 7/24 auto-refresh)
    const scanResult = backgroundResults.find(r => r.symbol === symbol);
    if (scanResult?.analysis) {
      return scanResult.analysis.score; // Already 0-100
    }

    // Fallback to old scanner
    const signal = scanner.getSignal(symbol);
    if (!signal || signal.signalCount === 0) return undefined;

    let confidence = (signal.signalCount / 9) * 100;

    if (signal.signals.mtfAlignment) {
      confidence += 15;
    }

    if (signal.signals.maCrossover24h || signal.signals.maCrossover4h) {
      confidence += 10;
    }

    if (signal.signals.volumeSpike24h || signal.signals.volumeSpike4h) {
      confidence += 5;
    }

    confidence = Math.min(confidence, 100);
    return Math.round(confidence);
  };

  // Get risk score for coin
  const getRiskScore = (coin: MarketData): RiskScore => {
    return calculateRiskScore({
      changePercent24h: coin.changePercent24h,
      changePercent7d: coin.changePercent7d,
      volume24h: coin.volume24h,
      price: coin.price,
      rank: coin.rank,
    });
  };

  // Show loading ONLY if we have no data at all
  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium">Market verileri yükleniyor...</div>
          <div className="text-sm text-gray-500 mt-2">200 coin analiz ediliyor</div>
          <button
            onClick={refresh}
            className="mt-4 px-6 py-2 bg-accent-blue hover:bg-accent-blue/80 rounded-lg font-medium transition-colors"
          >
            Manuel Yenile
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">❌ {error}</div>
          <button
            onClick={refresh}
            className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/80 rounded-lg font-medium transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[2000px] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold">
                📊 Sardag
                <span className="ml-3 text-sm px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                  {marketType === 'futures' ? '⚡ Futures' : 'Spot'}
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {data.length} coinler • Real-time data • Her 10 saniyede güncellenir
                {scanner.signalCount > 0 && (
                  <span className="ml-2 text-red-400 font-medium">
                    • 🚨 {scanner.signalCount} aktif sinyal
                  </span>
                )}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Market Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMarketType('futures')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    marketType === 'futures'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  ⚡ Futures
                </button>
                <button
                  onClick={() => setMarketType('spot')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    marketType === 'spot'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Spot
                </button>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setPreferencesOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all flex items-center gap-2"
                title="Ayarlar"
              >
                ⚙️
                <span className="hidden sm:inline">Ayarlar</span>
              </button>

              {/* Notification Toggle */}
              <button
                onClick={handleNotificationToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  scannerActive
                    ? 'bg-green-500 text-white animate-pulse'
                    : notificationsEnabled
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                title={
                  scannerActive
                    ? 'Background scanner aktif - Her 5 dakikada sinyal taraması'
                    : notificationsEnabled
                    ? 'Scanner\'ı başlat'
                    : 'Bildirimleri etkinleştir'
                }
              >
                {scannerActive ? '🔔' : '🔕'}
                <span className="hidden sm:inline">
                  {scannerActive ? 'Scanner Aktif' : notificationsEnabled ? 'Scanner Başlat' : 'Bildirimleri Aç'}
                </span>
              </button>

              {/* Enhanced Search */}
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Coin ara... (BTC, ETH, SOL, vb.)"
                  className="w-full pl-10 pr-10 py-3 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-accent-blue/70 focus:ring-2 focus:ring-accent-blue/30 text-base font-medium placeholder-gray-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent-blue/50 text-sm cursor-pointer"
              >
                <option value="7d">🏆 7 Günlük</option>
                <option value="24h">📈 24 Saatlik</option>
                <option value="volume">💰 Hacim</option>
                <option value="rank">🔢 Sıralama</option>
              </select>

              {/* Scan Button */}
              <button
                onClick={() => {
                  scanner.startScan();
                  setScanCount(prev => prev + 1); // Increment scan count for color rotation
                }}
                disabled={scanner.isScanning}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${scanner.isScanning ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {scanner.isScanning ? `Taranıyor ${scanner.progress}%` : 'Tara'}
              </button>

              {/* Refresh */}
              <button
                onClick={refresh}
                disabled={loading}
                className="px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[2000px] mx-auto px-4 py-6">
        {/* Traditional Markets Section (NEW!) */}
        {traditionalMarkets.data.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">🌍 Geleneksel Piyasalar</h2>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                {traditionalMarkets.data.length} ürün
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent"></div>
              {traditionalMarkets.loading && (
                <svg className="w-4 h-4 animate-spin text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                {traditionalMarkets.data.map((market) => {
                  const marketAsset = convertToMarketData(market);
                  const riskScore = getRiskScore(marketAsset);

                  return (
                    <div
                      key={market.symbol}
                      onClick={() => handleCoinClick(marketAsset)}
                      className="flex-shrink-0 w-[200px] bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] rounded-lg p-4 cursor-pointer transition-all hover:scale-105 border border-white/10 hover:border-accent-blue/50"
                    >
                      {/* Header: Icon + Symbol */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{market.icon}</span>
                          <div>
                            <div className="font-bold text-sm text-white">{market.symbol}</div>
                            <div className="text-[10px] text-gray-500">{market.type}</div>
                          </div>
                        </div>
                        {riskScore && (
                          <div className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                            {riskScore.level === 'VERY_LOW' && '🛡️'}
                            {riskScore.level === 'LOW' && '✅'}
                            {riskScore.level === 'MEDIUM' && '⚠️'}
                            {riskScore.level === 'HIGH' && '🔥'}
                            {riskScore.level === 'VERY_HIGH' && '☠️'}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-2">
                        <div className="text-lg font-bold text-white">
                          ${market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* 24h Change */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">24h:</span>
                        <span className={`font-bold ${
                          market.changePercent24h >= 5 ? 'text-green-400' :
                          market.changePercent24h > 0 ? 'text-green-500' :
                          market.changePercent24h > -2 ? 'text-gray-400' :
                          'text-red-500'
                        }`}>
                          {market.changePercent24h >= 0 ? '+' : ''}{market.changePercent24h.toFixed(2)}%
                        </span>
                      </div>

                      {/* Volume */}
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-500">Vol:</span>
                        <span className="text-gray-400 font-mono">
                          {market.volume24h >= 1e9 ? `${(market.volume24h / 1e9).toFixed(2)}B` :
                           market.volume24h >= 1e6 ? `${(market.volume24h / 1e6).toFixed(2)}M` :
                           market.volume24h >= 1e3 ? `${(market.volume24h / 1e3).toFixed(2)}K` :
                           market.volume24h.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scroll Hint */}
              <div className="absolute top-1/2 -translate-y-1/2 right-0 bg-gradient-to-l from-[#0a0e1a] via-[#0a0e1a] to-transparent w-12 h-full pointer-events-none flex items-center justify-end pr-2">
                <svg className="w-5 h-5 text-gray-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4"></div>
          </div>
        )}

        {/* Top 10 Performers Section */}
        {sortBy === "7d" && top10.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">🏆 Top 10 Performans (7 Gün)</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/20 to-transparent"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-6">
              {top10.map((coin, index) => (
                <CoinCard
                  key={coin.symbol}
                  coin={coin}
                  onClick={() => handleCoinClick(coin)}
                  isTopPerformer={true}
                  hasSignal={scanner.hasSignal(coin.symbol)}
                  signalStrength={getSignalStrength(coin.symbol)}
                  confidenceScore={getConfidenceScore(coin.symbol)}
                  riskScore={getRiskScore(coin)}
                  scanCount={scanCount}
                />
              ))}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
        )}

        {/* All Coins Grid */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">
              {searchQuery ? (
                <span className="flex items-center gap-2">
                  🔍 Arama: "<span className="text-accent-blue">{searchQuery}</span>"
                  <span className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-sm">
                    {displayData.length} sonuç
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  📋 Tüm Coinler
                  <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                    {displayData.length} coin
                  </span>
                </span>
              )}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
        </div>

        {/* Grid */}
        {displayData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {displayData.map((coin) => (
              <CoinCard
                key={coin.symbol}
                coin={coin}
                onClick={() => handleCoinClick(coin)}
                isTopPerformer={false}
                hasSignal={scanner.hasSignal(coin.symbol)}
                signalStrength={getSignalStrength(coin.symbol)}
                confidenceScore={getConfidenceScore(coin.symbol)}
                riskScore={getRiskScore(coin)}
                scanCount={scanCount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-lg">Sonuç bulunamadı</div>
            <div className="text-sm mt-2">Farklı bir arama terimi deneyin</div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && data.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-accent-blue/20 backdrop-blur-sm border border-accent-blue/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Güncelleniyor...</span>
          </div>
        )}
      </div>

      {/* Multi-Strategy Analysis Modal */}
      {selectedCoin && (
        <MultiStrategyModal
          symbol={selectedCoin.symbol}
          currentPrice={selectedCoin.price}
          isOpen={selectedCoin !== null}
          onClose={() => setSelectedCoin(null)}
        />
      )}

      {/* Signal Notifications */}
      {scanner.newSignals.length > 0 && (
        <SignalNotification
          signals={scanner.newSignals}
          onClose={scanner.clearNewSignals}
          onCoinClick={(symbol) => {
            // Find the coin data by symbol and open modal
            const coin = data.find(c => c.symbol === symbol);
            if (coin) {
              setSelectedCoin(coin);
            }
          }}
        />
      )}

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => {
          setPreferencesOpen(false);
          // Reload preferences after modal closes
          const prefs = getPreferences();
          if (prefs.notifications.enabled && areNotificationsEnabled()) {
            setScannerActive(true);
          }
        }}
      />
    </div>
  );
}
