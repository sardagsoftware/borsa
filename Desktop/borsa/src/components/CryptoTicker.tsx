'use client';

import { useEffect, useState } from 'react';

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export default function CryptoTicker() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch('/api/market/crypto');
      const result = await response.json();

      if (result.success && result.data) {
        const formattedData = result.data.slice(0, 100).map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.currentPrice,
          change24h: item.priceChange24h || 0
        }));

        // Sort: winners first (positive change), then losers (negative change)
        const sortedData = formattedData.sort((a: Crypto, b: Crypto) => b.change24h - a.change24h);
        setCryptos(sortedData);
      }
    } catch (error) {
      console.error('Crypto ticker error:', error);
    }
  };

  if (cryptos.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 overflow-hidden z-[60]">
      <div className="ticker-wrapper py-2">
        <div className="ticker-content flex gap-6">
          {/* Duplicate array for seamless loop */}
          {[...cryptos, ...cryptos].map((crypto, index) => (
            <div
              key={`${crypto.symbol}-${index}`}
              className="flex items-center gap-2 whitespace-nowrap text-sm"
            >
              <span className="text-white font-bold">{crypto.symbol}</span>
              <span className="text-white font-mono">
                ${crypto.price >= 1
                  ? crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : crypto.price.toFixed(6)
                }
              </span>
              <span className={`text-xs font-medium ${
                crypto.change24h >= 0 ? 'text-primary' : 'text-secondary'
              }`}>
                {crypto.change24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.change24h).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          overflow: hidden;
        }

        .ticker-content {
          display: flex;
          animation: scroll 60s linear infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
