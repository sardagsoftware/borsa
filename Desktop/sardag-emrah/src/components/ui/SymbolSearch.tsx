"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Star, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type SymbolItem = {
  symbol: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (symbol: string) => void;
};

// SADECE FUTURES - Spot kaldırıldı
const POPULAR_FUTURES_SYMBOLS = ["BTCUSDT", "ETHUSDT", "MOODENGUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "PEPEUSDT"];

export default function SymbolSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // SADECE FUTURES API
  const { data: futuresData } = useQuery({
    queryKey: ["symbols", "futures"],
    queryFn: async () => {
      const res = await fetch("/api/symbols-futures");
      if (!res.ok) throw new Error("Failed to fetch futures symbols");
      return res.json();
    },
    staleTime: 3600000,
  });

  const symbols: SymbolItem[] = futuresData?.symbols || [];

  const filteredSymbols = query
    ? symbols.filter((s) => s.symbol.toLowerCase().includes(query.toLowerCase()) || s.label.toLowerCase().includes(query.toLowerCase()))
    : symbols;

  const popularSymbols = symbols.filter((s) => POPULAR_FUTURES_SYMBOLS.includes(s.symbol));
  const favoriteSymbols = symbols.filter((s) => favorites.includes(s.symbol));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter((f) => f !== symbol)
      : [...favorites, symbol];
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const selectSymbol = (symbol: string) => {
    onChange(symbol);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Futures Badge - Artık değiştirilemez */}
      <div className="flex items-center gap-1 bg-accent-yellow/20 border border-accent-yellow/30 rounded-lg px-3 py-1.5">
        <Zap className="w-3 h-3 text-accent-yellow" />
        <span className="text-xs font-medium text-accent-yellow">Futures</span>
      </div>

      {/* Symbol Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          className="input w-64 pl-10 pr-4"
          placeholder="Futures sembol ara..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-w-md bg-bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="text-xs opacity-50">Futures işlem çifti seç</div>
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {/* Favorites */}
            {!query && favoriteSymbols.length > 0 && (
              <div className="p-2">
                <div className="text-xs opacity-50 px-2 py-1 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Favoriler
                </div>
                {favoriteSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => selectSymbol(item.symbol)}
                    className="w-full px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{item.label}</span>
                      <span className="text-xs opacity-50">{item.symbol}</span>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(item.symbol, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Popular */}
            {!query && (
              <div className="p-2">
                <div className="text-xs opacity-50 px-2 py-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Popüler
                </div>
                {popularSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => selectSymbol(item.symbol)}
                    className="w-full px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{item.label}</span>
                      <span className="text-xs opacity-50">{item.symbol}</span>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(item.symbol, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(item.symbol) ? "fill-accent-yellow text-accent-yellow" : "text-white/30"}`} />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {query && (
              <div className="p-2">
                <div className="text-xs opacity-50 px-2 py-1">
                  {filteredSymbols.length} sonuç
                </div>
                {filteredSymbols.slice(0, 50).map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => selectSymbol(item.symbol)}
                    className="w-full px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{item.label}</span>
                      <span className="text-xs opacity-50">{item.symbol}</span>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(item.symbol, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(item.symbol) ? "fill-accent-yellow text-accent-yellow" : "text-white/30"}`} />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && filteredSymbols.length === 0 && (
              <div className="p-8 text-center text-sm opacity-50">
                "{query}" için sembol bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
