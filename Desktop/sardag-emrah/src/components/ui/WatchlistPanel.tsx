"use client";
import { useState, useEffect } from "react";
import { Star, TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { useChartStore } from "@/store/useChartStore";
import numeral from "numeral";

type WatchlistItem = {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
};

export default function WatchlistPanel() {
  const { setSymbol, market } = useChartStore();
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("watchlist");
      return saved ? JSON.parse(saved) : ["BTCUSDT", "ETHUSDT", "BNBUSDT"];
    }
    return ["BTCUSDT", "ETHUSDT", "BNBUSDT"];
  });

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch 24h ticker data for watchlist items
  useEffect(() => {
    if (watchlist.length === 0) return;

    const fetchTickers = async () => {
      try {
        // Use correct API based on current market
        const baseUrl = market === "futures"
          ? "https://fapi.binance.com/fapi/v1"
          : "https://api.binance.com/api/v3";

        const response = await fetch(
          `${baseUrl}/ticker/24hr?symbols=[${watchlist.map(s => `"${s}"`).join(",")}]`
        );

        if (!response.ok) {
          console.error("Failed to fetch tickers:", response.statusText);
          return;
        }

        const data = await response.json();

        const tickerItems: WatchlistItem[] = data.map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(ticker.volume),
        }));

        setItems(tickerItems);
      } catch (err) {
        console.error("Failed to fetch tickers:", err);
      }
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 5000); // Update every 5s

    return () => clearInterval(interval);
  }, [watchlist, market]);

  const removeFromWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.filter((s) => s !== symbol);
    setWatchlist(newWatchlist);
    localStorage.setItem("watchlist", JSON.stringify(newWatchlist));
  };

  const handleSymbolClick = (symbol: string) => {
    setSymbol(symbol);
  };

  if (isMinimized) {
    return (
      <div className="fixed right-4 top-24 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="btn bg-bg-card border border-border p-2 shadow-lg"
          title="İzleme Listesini Göster"
        >
          <Star className="w-5 h-5 text-accent-yellow fill-accent-yellow" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-24 w-72 bg-bg-card border border-border rounded-xl shadow-2xl z-40 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent-yellow fill-accent-yellow" />
          <h3 className="font-bold text-sm">İzleme Listesi</h3>
          <span className="text-xs opacity-50">({watchlist.length})</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="btn p-1 hover:bg-white/10"
          title="Küçült"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <div className="p-8 text-center text-sm opacity-50">
            İzleme listesinde sembol yok
          </div>
        )}

        {items.map((item) => {
          const isPositive = item.change24h >= 0;
          return (
            <div
              key={item.symbol}
              className="p-3 border-b border-border hover:bg-white/5 cursor-pointer transition-colors group"
              onClick={() => handleSymbolClick(item.symbol)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">
                    {item.symbol.replace("USDT", "/USDT")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item.symbol);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-accent-red" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">
                  ${numeral(item.price).format("0,0.00")}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isPositive ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {item.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="text-xs opacity-50 mt-1">
                Hacim: {numeral(item.volume24h).format("0.0a").toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <div className="p-3 border-t border-border">
        <button className="btn btn-success w-full text-xs">
          <Plus className="w-3 h-3" />
          <span className="ml-1">Sembol Ekle</span>
        </button>
      </div>
    </div>
  );
}
