"use client";
import { useChartStore } from "@/store/useChartStore";
import { TrendingUp, TrendingDown, Search, Settings, Star } from "lucide-react";
import { useState, useMemo } from "react";

type Props = {
  symbol: string;
  interval: string;
  price: number;
  change: number;
  onScan: () => void;
};

// POPÜLER KOİNLER - Otomatik öneri için
const POPULAR_COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", category: "Major" },
  { symbol: "ETHUSDT", name: "Ethereum", category: "Major" },
  { symbol: "BNBUSDT", name: "BNB", category: "Major" },
  { symbol: "SOLUSDT", name: "Solana", category: "Major" },
  { symbol: "XRPUSDT", name: "Ripple", category: "Major" },
  { symbol: "ADAUSDT", name: "Cardano", category: "Major" },
  { symbol: "DOGEUSDT", name: "Dogecoin", category: "Meme" },
  { symbol: "MATICUSDT", name: "Polygon", category: "L2" },
  { symbol: "DOTUSDT", name: "Polkadot", category: "Major" },
  { symbol: "AVAXUSDT", name: "Avalanche", category: "Major" },
  { symbol: "LINKUSDT", name: "Chainlink", category: "Oracle" },
  { symbol: "UNIUSDT", name: "Uniswap", category: "DeFi" },
  { symbol: "ATOMUSDT", name: "Cosmos", category: "Major" },
  { symbol: "LTCUSDT", name: "Litecoin", category: "Major" },
  { symbol: "NEARUSDT", name: "NEAR Protocol", category: "L1" },
  { symbol: "APTUSDT", name: "Aptos", category: "L1" },
  { symbol: "ARBUSDT", name: "Arbitrum", category: "L2" },
  { symbol: "OPUSDT", name: "Optimism", category: "L2" },
  { symbol: "SUIUSDT", name: "Sui", category: "L1" },
  { symbol: "INJUSDT", name: "Injective", category: "DeFi" },
];

export default function MinimalTopbar({ symbol, interval, price, change, onScan }: Props) {
  const { setSymbol, setTF, preset, setPreset } = useChartStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isPositive = change >= 0;

  const intervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"] as const;
  const presets = ["scalping", "daytrading", "swing", "bollinger"] as const;

  // Otomatik filtreleme - Arama yaparken
  const filteredCoins = useMemo(() => {
    if (!searchQuery) return POPULAR_COINS;

    const query = searchQuery.toUpperCase();
    return POPULAR_COINS.filter(
      (coin) =>
        coin.symbol.includes(query) ||
        coin.name.toUpperCase().includes(query) ||
        coin.category.toUpperCase().includes(query)
    );
  }, [searchQuery]);

  const handleCoinSelect = (coinSymbol: string) => {
    setSymbol(coinSymbol);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative z-30 bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        {/* Left: Symbol & Price */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Symbol */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="group flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
          >
            <span className="font-mono font-bold text-lg md:text-2xl text-white">
              {symbol}
            </span>
            <Search className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Price & Change */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono font-bold text-xl text-white">
                ${price.toFixed(2)}
              </div>
              <div className={`text-xs font-medium flex items-center gap-1 ${isPositive ? "text-accent-green" : "text-accent-red"}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{change.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Interval Selector (Compact) */}
          <select
            value={interval}
            onChange={(e) => setTF(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-mono font-medium hover:bg-white/20 transition-all outline-none cursor-pointer"
          >
            {intervals.map((int) => (
              <option key={int} value={int} className="bg-bg text-white">
                {int.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Preset Selector (Hidden on mobile) */}
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as any)}
            className="hidden md:block bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm hover:bg-white/20 transition-all outline-none cursor-pointer"
          >
            {presets.map((p) => (
              <option key={p} value={p} className="bg-bg text-white capitalize">
                {p}
              </option>
            ))}
          </select>

          {/* Scan Button (Hidden on mobile) */}
          <button
            onClick={onScan}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-green text-white px-4 py-1.5 rounded-lg font-medium text-sm hover:scale-105 transition-transform"
          >
            🔍 Tara
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 animate-in slide-in-from-top max-h-[500px] overflow-hidden">
          {/* Arama Input */}
          <input
            type="text"
            placeholder="Koin ara... (isim, sembol veya kategori)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery) {
                if (filteredCoins.length > 0) {
                  handleCoinSelect(filteredCoins[0].symbol);
                } else {
                  // Manuel girilen sembol
                  setSymbol(searchQuery);
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }
              }
            }}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-accent-blue transition-all mb-3"
            autoFocus
          />

          {/* Koin Listesi */}
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {filteredCoins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredCoins.map((coin) => (
                  <button
                    key={coin.symbol}
                    onClick={() => handleCoinSelect(coin.symbol)}
                    className={`group flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-105 ${
                      symbol === coin.symbol
                        ? "bg-accent-blue/20 border-accent-blue"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    {/* Ikon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      coin.category === "Major" ? "bg-gradient-to-br from-yellow-500 to-orange-500" :
                      coin.category === "DeFi" ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                      coin.category === "L1" ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                      coin.category === "L2" ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                      coin.category === "Meme" ? "bg-gradient-to-br from-pink-500 to-rose-500" :
                      "bg-gradient-to-br from-gray-500 to-gray-600"
                    }`}>
                      {coin.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Bilgi */}
                    <div className="flex-1 text-left">
                      <div className="font-mono font-bold text-sm text-white">
                        {coin.symbol.replace("USDT", "")}
                      </div>
                      <div className="text-xs opacity-70">{coin.name}</div>
                    </div>

                    {/* Kategori Badge */}
                    <div className="text-[10px] px-2 py-1 rounded-full bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
                      {coin.category}
                    </div>

                    {/* Favori İkon (Eğer seçili ise) */}
                    {symbol === coin.symbol && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 opacity-50">
                <div className="text-sm mb-2">Koin bulunamadı</div>
                <div className="text-xs">
                  Manuel sembol girmek için ENTER tuşuna basın
                </div>
              </div>
            )}
          </div>

          {/* Bilgi */}
          <div className="text-xs opacity-50 mt-3 text-center">
            {filteredCoins.length > 0 ? (
              <>
                {filteredCoins.length} koin gösteriliyor • Tıkla veya ENTER ile seç
              </>
            ) : (
              <>
                "{searchQuery}" sembolünü eklemek için ENTER tuşuna basın
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
