'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ConnectionStatus from '@/components/ConnectionStatus';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import Logo from '@/components/Logo';

interface CoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

export default function TradingTerminal() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [botMode, setBotMode] = useState('semi');
  const [cryptoData, setCryptoData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Fetch crypto data from CoinMarketCap
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch('/api/crypto/coinmarketcap?limit=20');
        if (response.ok) {
          const data = await response.json();
          setCryptoData(data.data || []);
          
          // Set current price for selected symbol
          const selectedCoin = data.data?.find((coin: CoinData) => 
            coin.symbol === selectedSymbol
          );
          if (selectedCoin) {
            setCurrentPrice(selectedCoin.quote.USD.price);
          }
        }
      } catch (error) {
        console.error('Failed to fetch crypto data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Update price when symbol changes
  useEffect(() => {
    const selectedCoin = cryptoData.find(coin => coin.symbol === selectedSymbol);
    if (selectedCoin) {
      setCurrentPrice(selectedCoin.quote.USD.price);
    }
  }, [selectedSymbol, cryptoData]);

  const handlePlaceOrder = () => {
    // Simulate order placement
    alert(`${orderType.toUpperCase()} emir verildi: ${quantity} ${selectedSymbol} @ $${price}`);
  };

  const selectedCoin = cryptoData.find(coin => coin.symbol === selectedSymbol);

  if (!session) {
    router.push('/tr/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-soft to-panel text-text">
      {/* Top Status Bar */}
      <div className="w-full bg-panel/80 backdrop-blur-sm border-b border-glass/30 px-6 py-3">
        <div className="flex items-center justify-between">
          <ConnectionStatus className="flex-shrink-0" />
          <div className="flex-1 mx-6">
            <CryptoPriceTicker 
              showTop={20}
              autoScroll={true}
              updateInterval={30000}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Gerçek Zamanlı Veriler</span>
            </div>
            <span>•</span>
            <span>{session.user?.email}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-panel/80 backdrop-blur-sm border-b border-glass/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Logo size="md" />
            <div>
              <h1 className="text-2xl font-bold text-brand-1">⚡ AI Lens Trader</h1>
              <p className="text-muted">Yapay Zeka Destekli İşlem Terminali</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs text-muted mb-1">Bot Modu</label>
              <select 
                value={botMode}
                onChange={(e) => setBotMode(e.target.value)}
                className="bg-bg border border-glass rounded px-3 py-2 text-text focus:border-brand-1 focus:outline-none"
              >
                <option value="semi">Yarı Otomatik</option>
                <option value="auto">Tam Otomatik</option>
                <option value="off">Sadece Manuel</option>
              </select>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted mb-1">AI Sinyal</div>
              <span className="text-2xl font-bold text-brand-1">+85.2</span>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors">
              🛑 ACİL STOP
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Symbol Selection & Price Info */}
          <div className="lg:col-span-1">
            <div className="panel p-6">
              <h2 className="text-lg font-semibold text-text mb-4">📈 Kripto Seçimi</h2>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-1 mx-auto"></div>
                  <p className="text-muted mt-2">Veriler yükleniyor...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cryptoData.slice(0, 10).map((coin) => (
                    <button
                      key={coin.symbol}
                      onClick={() => setSelectedSymbol(coin.symbol)}
                      className={`w-full text-left p-3 rounded transition-colors ${
                        selectedSymbol === coin.symbol
                          ? 'bg-brand-1 text-white'
                          : 'bg-bg-soft hover:bg-brand-1/10 text-text hover:text-brand-1'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{coin.symbol}</div>
                          <div className="text-xs opacity-70">{coin.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">
                            ${coin.quote.USD.price.toFixed(2)}
                          </div>
                          <div className={`text-xs ${
                            coin.quote.USD.percent_change_24h >= 0 
                              ? 'text-green-500' 
                              : 'text-red-500'
                          }`}>
                            {coin.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                            {coin.quote.USD.percent_change_24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price Chart Area */}
          <div className="lg:col-span-2">
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text">
                  📊 {selectedCoin?.name || selectedSymbol} Grafiği
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-brand-1">
                      ${currentPrice.toFixed(2)}
                    </div>
                    {selectedCoin && (
                      <div className={`text-sm ${
                        selectedCoin.quote.USD.percent_change_24h >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {selectedCoin.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                        {selectedCoin.quote.USD.percent_change_24h.toFixed(2)}% (24s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Placeholder for TradingView Chart */}
              <div className="bg-bg rounded-lg p-8 h-96 flex items-center justify-center border-2 border-dashed border-glass">
                <div className="text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <div className="text-lg font-semibold text-text mb-2">
                    Gelişmiş Grafik Görünümü
                  </div>
                  <div className="text-muted">
                    TradingView entegrasyonu yakında eklenecek
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-panel/50 p-3 rounded">
                      <div className="text-muted">Market Cap</div>
                      <div className="font-semibold">
                        ${selectedCoin ? (selectedCoin.quote.USD.market_cap / 1e9).toFixed(2) + 'B' : '---'}
                      </div>
                    </div>
                    <div className="bg-panel/50 p-3 rounded">
                      <div className="text-muted">24s Hacim</div>
                      <div className="font-semibold">
                        ${selectedCoin ? (selectedCoin.quote.USD.volume_24h / 1e9).toFixed(2) + 'B' : '---'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="panel p-6">
              <h2 className="text-lg font-semibold text-text mb-4">💰 İşlem Paneli</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-2">Emir Tipi</label>
                  <select 
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="input-primary w-full"
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                    <option value="stop">Stop Loss</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-muted mb-2">Fiyat ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={currentPrice.toFixed(2)}
                    className="input-primary w-full"
                    disabled={orderType === 'market'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-muted mb-2">Miktar</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.001"
                    step="0.001"
                    className="input-primary w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handlePlaceOrder}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded transition-colors"
                  >
                    📈 AL
                  </button>
                  <button 
                    onClick={handlePlaceOrder}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded transition-colors"
                  >
                    📉 SAT
                  </button>
                </div>
                
                <div className="border-t border-glass pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-text mb-2">🤖 AI Önerileri</h3>
                  <div className="bg-brand-1/10 border border-brand-1/20 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted">Sinyal Gücü:</span>
                      <span className="text-sm font-semibold text-brand-1">Güçlü Al</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted">Hedef:</span>
                      <span className="text-sm font-semibold text-green-500">
                        ${(currentPrice * 1.05).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Stop Loss:</span>
                      <span className="text-sm font-semibold text-red-500">
                        ${(currentPrice * 0.95).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Integration */}
        <div className="mt-6">
          <div className="panel p-6">
            <h2 className="text-lg font-semibold text-text mb-4">🧠 AI Asistan</h2>
            <div className="bg-bg rounded-lg p-4 h-32 flex items-center justify-center border border-glass">
              <div className="text-center">
                <div className="text-muted">AI Sohbet sistemi yakında aktif edilecek</div>
                <div className="text-sm text-muted mt-2">
                  "Bitcoin analizi yap" gibi sorularınızı sorabileceksiniz
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
