"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMarketData, type MarketData } from "@/hooks/useMarketData";
import { useCoinScanner } from "@/hooks/useCoinScanner";
import CoinCard from "./CoinCard";
import QuickInfoModal from "./QuickInfoModal";
import SignalNotification from "./SignalNotification";

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
  const { data, loading, error, refresh } = useMarketData();
  const scanner = useCoinScanner(data);
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<MarketData | null>(null);

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

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium">Market verileri yükleniyor...</div>
          <div className="text-sm text-gray-500 mt-2">200 coin analiz ediliyor</div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[2000px] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold">📊 Market Overview</h1>
              <p className="text-sm text-gray-400 mt-1">
                {data.length} coinler • Real-time data
                {scanner.signalCount > 0 && (
                  <span className="ml-2 text-red-400 font-medium">
                    • 🚨 {scanner.signalCount} aktif sinyal
                  </span>
                )}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Coin ara... (BTC, ETH)"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent-blue/50 text-sm w-full sm:w-64"
              />

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
                onClick={scanner.startScan}
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
              {searchQuery ? `🔍 Arama Sonuçları (${displayData.length})` : '📋 Tüm Coinler'}
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

      {/* Quick Info Modal - Comprehensive Analysis */}
      {selectedCoin && (
        <QuickInfoModal
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
        />
      )}
    </div>
  );
}
