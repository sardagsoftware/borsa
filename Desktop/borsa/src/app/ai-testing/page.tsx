'use client';

import { useState, useEffect } from 'react';

interface PredictionResult {
  prediction: number;
  confidence: number;
  action: string;
  model_name: string;
  model_type: string;
}

interface ModelInfo {
  name: string;
  type: string;
  version: string;
  parameters: number;
}

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export default function AITestingPage() {
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [loading, setLoading] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [topCoins, setTopCoins] = useState<CoinData[]>([]);
  const [error, setError] = useState('');
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);

  // Top 100 coinleri yükle
  const loadTop100Coins = async () => {
    setLoadingCoins(true);
    try {
      const response = await fetch('/api/trading/top100');
      const data = await response.json();

      if (data.success && data.data) {
        const coins = data.data.map((item: any) => ({
          symbol: item.coin.symbol,
          name: item.coin.name,
          price: item.coin.price,
          change24h: item.coin.change24h,
          marketCap: item.coin.marketCap,
          volume24h: item.coin.volume24h,
        }));
        setTopCoins(coins);
        // İlk coini otomatik seç
        if (coins.length > 0 && !selectedCoin) {
          setSelectedCoin(coins[0]);
        }
      }
    } catch (err) {
      console.error('Top 100 yüklenemedi:', err);
    } finally {
      setLoadingCoins(false);
    }
  };

  // Modelleri yükle
  const loadModels = async () => {
    try {
      const response = await fetch('/api/ai/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (err) {
      console.error('Modeller yüklenemedi:', err);
    }
  };

  // Tahmin yap
  const testPrediction = async () => {
    if (!selectedCoin) {
      setError('Lütfen bir coin seçin');
      return;
    }

    setLoading(true);
    setError('');
    setPredictionResult(null);

    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedCoin.symbol,
          timeframe,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPredictionResult(data.prediction);

        // Geçmişe ekle
        setPredictionHistory(prev => [
          {
            coin: selectedCoin,
            timeframe,
            model: selectedModel,
            result: data.prediction,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9)
        ]);
      } else {
        setError(data.error || 'Tahmin başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'AI servisine bağlanılamadı');
    } finally {
      setLoading(false);
    }
  };

  // Toplu tahmin (Top 10)
  const predictTop10 = async () => {
    if (topCoins.length === 0) {
      setError('Önce Top 100 coinleri yükleyin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const top10Symbols = topCoins.slice(0, 10).map(c => c.symbol);

      const response = await fetch('/api/ai/predict-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: top10Symbols,
          timeframe,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.total} coin için tahmin tamamlandı!`);
      } else {
        setError(data.error || 'Toplu tahmin başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Toplu tahmin hatası');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklenince
  useEffect(() => {
    loadTop100Coins();
    loadModels();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-8">
      <div className="container mx-auto px-4">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 AI Model Test Merkezi</h1>
          <p className="text-slate-300">16 Derin Öğrenme Modeli • Gerçek Zamanlı CoinMarketCap Verileri • 200+ Teknik Gösterge</p>
        </div>

        {/* Ana Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Top 100 Liste */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top 100 CoinMarketCap */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">🏆 Top 100 CoinMarketCap</h2>
                <button
                  onClick={loadTop100Coins}
                  disabled={loadingCoins}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all text-sm font-semibold"
                >
                  {loadingCoins ? '⏳' : '🔄'}
                </button>
              </div>

              {loadingCoins ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-slate-400">Yükleniyor...</div>
                </div>
              ) : topCoins.length > 0 ? (
                <div className="space-y-2 max-h-[700px] overflow-y-auto">
                  {topCoins.map((coin, idx) => (
                    <div
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin)}
                      className={`rounded-lg p-3 border cursor-pointer transition-all ${
                        selectedCoin?.symbol === coin.symbol
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg'
                          : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                            <span className="font-bold text-white">{coin.symbol}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{coin.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-white text-sm">
                            ${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-slate-400">Top 100 coinleri yüklemek için butona tıklayın</div>
                </div>
              )}
            </div>
          </div>

          {/* Orta Kolon - Ayarlar ve Sonuçlar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seçili Coin Bilgisi */}
            {selectedCoin && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Seçili Kripto Para</h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-white">{selectedCoin.symbol}</div>
                    <div className="text-sm text-slate-300">{selectedCoin.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      ${selectedCoin.price >= 1 ? selectedCoin.price.toLocaleString() : selectedCoin.price.toFixed(6)}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        selectedCoin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {selectedCoin.change24h >= 0 ? '📈' : '📉'} {selectedCoin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-slate-400">Piyasa Değeri</div>
                    <div className="text-white font-mono">${(selectedCoin.marketCap / 1e9).toFixed(2)}B</div>
                  </div>
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-slate-400">24s Hacim</div>
                    <div className="text-white font-mono">${(selectedCoin.volume24h / 1e6).toFixed(2)}M</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tahmin Ayarları */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4">⚙️ Tahmin Ayarları</h2>

              {/* Timeframe */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Zaman Dilimi
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1m">📊 1 Dakika</option>
                  <option value="5m">📊 5 Dakika</option>
                  <option value="15m">📊 15 Dakika</option>
                  <option value="30m">📊 30 Dakika</option>
                  <option value="1h">📊 1 Saat (Önerilen)</option>
                  <option value="4h">📊 4 Saat</option>
                  <option value="1d">📊 1 Gün</option>
                  <option value="1w">📊 1 Hafta</option>
                </select>
              </div>

              {/* Model Seçimi */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  AI Modeli ({models.length} model hazır)
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ensemble">🎯 Ensemble (En Güçlü - Önerilen)</option>
                  <optgroup label="LSTM Modelleri">
                    <option value="lstm_standard">Standard LSTM</option>
                    <option value="lstm_bidirectional">Çift Yönlü LSTM</option>
                    <option value="lstm_stacked">Katmanlı LSTM</option>
                  </optgroup>
                  <optgroup label="GRU Modelleri">
                    <option value="gru_standard">Standard GRU</option>
                    <option value="gru_bidirectional">Çift Yönlü GRU</option>
                    <option value="gru_stacked">Katmanlı GRU</option>
                    <option value="gru_attention">🌟 Dikkat Mekanizmalı GRU</option>
                    <option value="gru_residual">🌟 Residual GRU</option>
                  </optgroup>
                  <optgroup label="Transformer Modelleri (En Gelişmiş)">
                    <option value="transformer_standard">🌟 Standard Transformer</option>
                    <option value="transformer_timeseries">Zaman Serisi Transformer</option>
                    <option value="transformer_informer">Informer</option>
                  </optgroup>
                  <optgroup label="CNN Modelleri">
                    <option value="cnn_standard">Standard CNN</option>
                    <option value="cnn_resnet">ResNet CNN</option>
                    <option value="cnn_multiscale">🌟 Çok Ölçekli CNN</option>
                    <option value="cnn_dilated">Dilated CNN</option>
                    <option value="cnn_tcn">🌟 Temporal CNN (TCN)</option>
                  </optgroup>
                </select>
              </div>

              {/* Aksiyon Butonları */}
              <div className="space-y-3">
                <button
                  onClick={testPrediction}
                  disabled={loading || !selectedCoin}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  {loading ? '⏳ Tahmin Yapılıyor...' : '🚀 AI Tahmin Yap'}
                </button>

                <button
                  onClick={predictTop10}
                  disabled={loading || topCoins.length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ İşlem Yapılıyor...' : '📊 Top 10 Toplu Tahmin'}
                </button>
              </div>
            </div>

            {/* Tahmin Sonucu */}
            {predictionResult && selectedCoin && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4">🎯 Tahmin Sonucu</h2>

                {/* Aksiyon Badge */}
                <div className="text-center mb-6">
                  <div
                    className={`inline-block px-8 py-4 rounded-xl text-3xl font-bold ${
                      predictionResult.action === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                        : predictionResult.action === 'SELL'
                        ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                    }`}
                  >
                    {predictionResult.action === 'BUY' && '📈 AL'}
                    {predictionResult.action === 'SELL' && '📉 SAT'}
                    {predictionResult.action === 'HOLD' && '⏸️ BEKLE'}
                  </div>
                  <div className="mt-3 text-xl text-white font-bold">{selectedCoin.symbol}</div>
                </div>

                {/* Metrikler */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Tahmin Değeri</div>
                    <div className="text-3xl font-bold text-white">
                      {(predictionResult.prediction * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Güven Skoru</div>
                    <div className="text-3xl font-bold text-emerald-400">
                      {(predictionResult.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Model Bilgisi */}
                <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-400 mb-2">Kullanılan Model</div>
                  <div className="font-bold text-white text-lg">{predictionResult.model_name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Tip: {predictionResult.model_type} • Zaman: {timeframe}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-red-400">SAT</span>
                    <span className="font-bold text-yellow-400">BEKLE</span>
                    <span className="font-bold text-emerald-400">AL</span>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${predictionResult.prediction * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">❌</span>
                  <div>
                    <div className="font-bold text-red-400 mb-1 text-lg">Hata</div>
                    <div className="text-sm text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tahmin Geçmişi */}
            {predictionHistory.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4">📜 Tahmin Geçmişi</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {predictionHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white">{item.coin.symbol}</span>
                          <span className="text-xs text-slate-400 ml-2">{item.timeframe}</span>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            item.result.action === 'BUY'
                              ? 'text-emerald-400'
                              : item.result.action === 'SELL'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {item.result.action === 'BUY' && 'AL'}
                          {item.result.action === 'SELL' && 'SAT'}
                          {item.result.action === 'HOLD' && 'BEKLE'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(item.timestamp).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon - Bilgilendirme */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sistem Bilgisi */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">💡 Sistem Nasıl Çalışır?</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 text-lg">1️⃣</span>
                  <div>
                    <div className="font-bold text-white">Veri Toplama</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Binance'den gerçek zamanlı OHLCV mum verileri çekilir (Open, High, Low, Close, Volume)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 text-lg">2️⃣</span>
                  <div>
                    <div className="font-bold text-white">Teknik Analiz</div>
                    <div className="text-xs text-slate-400 mt-1">
                      TA-Lib servisi 158 teknik gösterge hesaplar: RSI, MACD, Bollinger Bands, Moving Averages vb.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 text-lg">3️⃣</span>
                  <div>
                    <div className="font-bold text-white">Özellik Mühendisliği</div>
                    <div className="text-xs text-slate-400 mt-1">
                      200+ özellik oluşturulur: fiyat değişimleri, volatilite, momentum, trend göstergeleri
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 text-lg">4️⃣</span>
                  <div>
                    <div className="font-bold text-white">AI Tahmin</div>
                    <div className="text-xs text-slate-400 mt-1">
                      16 derin öğrenme modeli verileri analiz eder ve BUY/SELL/HOLD tahmini yapar
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 text-lg">5️⃣</span>
                  <div>
                    <div className="font-bold text-white">Sonuç Sunumu</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Tahmin + güven skoru ile size sunulur. Ensemble mode tüm modellerin ortalamasını alır.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Açıklamaları */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-3">🤖 AI Modelleri Hakkında</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="font-bold text-emerald-400 mb-1">LSTM (Long Short-Term Memory)</div>
                  <div className="text-xs text-slate-300">
                    Uzun vadeli bağımlılıkları öğrenen tekrarlayan sinir ağı. Zaman serisi tahminlerinde başarılı.
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="font-bold text-cyan-400 mb-1">GRU (Gated Recurrent Unit)</div>
                  <div className="text-xs text-slate-300">
                    LSTM'e benzer ama daha hızlı. Dikkat mekanizması önemli olayları vurgular.
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="font-bold text-purple-400 mb-1">Transformer (En Güçlü)</div>
                  <div className="text-xs text-slate-300">
                    Paralel işlem yapabilen, çok başlı dikkat mekanizmalı state-of-the-art model. En yüksek doğruluk.
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="font-bold text-orange-400 mb-1">CNN (Convolutional Neural Network)</div>
                  <div className="text-xs text-slate-300">
                    Grafik paternlerini tanır: Head & Shoulders, Double Top/Bottom, Triangles. Görsel analiz.
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="font-bold text-yellow-400 mb-1">Ensemble (Önerilen)</div>
                  <div className="text-xs text-slate-300">
                    Tüm 16 modelin tahminlerini birleştirir. En stabil ve güvenilir sonuçlar.
                  </div>
                </div>
              </div>
            </div>

            {/* Teknik Bilgi */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-3">📊 Teknik Detaylar</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Veri Kaynağı:</span>
                  <span className="text-white font-medium">Binance API</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Teknik Göstergeler:</span>
                  <span className="text-white font-medium">158 adet (TA-Lib)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toplam Özellik:</span>
                  <span className="text-white font-medium">200+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Modeli:</span>
                  <span className="text-white font-medium">16 adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toplam Parametre:</span>
                  <span className="text-white font-medium">~4.4M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tahmin Süresi:</span>
                  <span className="text-white font-medium">{'<'}50ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Güncelleme:</span>
                  <span className="text-white font-medium">Gerçek Zamanlı</span>
                </div>
              </div>
            </div>

            {/* Servis Durumu */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-lg font-bold text-white mb-4">🔌 Servis Durumu</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium text-sm">AI Tahmin Servisi</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">:5003 ✓</span>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium text-sm">TA-Lib Servisi</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">:5002 ✓</span>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium text-sm">Next.js API</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">:3000 ✓</span>
                </div>
              </div>
            </div>

            {/* Yüklü Modeller */}
            {models.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">
                  🧠 Yüklü AI Modelleri ({models.length})
                </h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {models.map((model, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-white text-xs">{model.name}</div>
                          <div className="text-xs text-slate-400">
                            {model.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-emerald-400 font-mono">
                            {(model.parameters / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
