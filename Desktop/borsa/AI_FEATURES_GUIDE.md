# 🤖 AI & TensorFlow Özellikleri Kullanım Rehberi

## 📍 Dashboard'da Özellikler Nerede?

### 1. 🎯 **AI Trading** (`/ai-trading`)
**Ana Menüden**: AI Trading menüsüne tıklayın

**Özellikler**:
- ✅ **4-Model Ensemble Predictions**
  - LSTM Neural Network
  - Attention Transformer
  - Random Forest
  - Reinforcement Learning (DQN)
- ✅ **Real-time Signal Generation**
- ✅ **Confidence Scores**
- ✅ **Model Agreement Analysis**

**Nasıl Kullanılır**:
```
1. AI Trading menüsüne gidin
2. Sembol seçin (örn: BTCUSDT)
3. Timeframe seçin (1m, 5m, 15m, 1h, 4h, 1d)
4. "Sinyal Üret" butonuna tıklayın
5. 4 modelin tahminlerini ve final kararı görün
```

---

### 2. 🚀 **Quantum Pro AI** (`/quantum-pro`)
**Ana Menüden**: Quantum Pro menüsüne tıklayın

**Özellikler**:
- ✅ **Advanced AI Signals**
- ✅ **Risk Management Integration**
- ✅ **Backtesting Engine**
- ✅ **Portfolio Optimization**

**Nasıl Kullanılır**:
```
1. Quantum Pro menüsüne gidin
2. "Generate Signal" butonuna tıklayın
3. Risk check sonuçlarını inceleyin
4. Approved signals için trade açın
5. Backtest sonuçlarını görüntüleyin
```

---

### 3. 📊 **Market Analysis** (`/market-analysis`)
**Ana Menüden**: Piyasa Analizi menüsüne tıklayın

**Teknik İndikatörler**:
- ✅ RSI (Relative Strength Index)
- ✅ MACD (Moving Average Convergence Divergence)
- ✅ Bollinger Bands
- ✅ EMA (Exponential Moving Averages)
- ✅ ATR (Average True Range)
- ✅ VWAP (Volume Weighted Average Price)
- ✅ OBV (On-Balance Volume)

**Nasıl Kullanılır**:
```
1. Piyasa Analizi menüsüne gidin
2. Kripto para seçin
3. Tüm technical indicators otomatik yüklenir
4. Signal strength ve direction görün
5. Market sentiment analizi ile karşılaştırın
```

---

### 4. 🤖 **Bot Management** (`/bot-management`)
**Ana Menüden**: Bot Yönetimi menüsüne tıklayın

**Özellikler**:
- ✅ **Bot Oluşturma**
- ✅ **Strateji Seçimi**: Scalping, Swing Trading, Grid Trading, DCA, Arbitrage, Market Making
- ✅ **Real-time Performance Tracking**
- ✅ **Bot Control**: Start / Stop / Pause

**Nasıl Kullanılır**:
```
1. Bot Management menüsüne gidin
2. "Bot Ekle" butonuna tıklayın
3. Bot bilgilerini doldurun:
   - Bot Adı
   - Strateji (örn: Scalping)
   - Sembol (örn: BTCUSDT)
   - Zaman Aralığı (örn: 5m)
4. "Bot Oluştur" butonuna tıklayın
5. Bot listesinde yeni botunuzu görün
6. Start/Stop butonları ile kontrol edin
```

---

### 5. 🛡️ **Risk Management** (`/risk-management`)
**Ana Menüden**: Risk Yönetimi menüsüne tıklayın

**Özellikler**:
- ✅ **Portfolio Value Tracking**
- ✅ **Risk Exposure Analysis**
- ✅ **Diversification Score**
- ✅ **Value at Risk (VaR)**
- ✅ **Sharpe Ratio**
- ✅ **Position Risk Scoring**

**Nasıl Kullanılır**:
```
1. Risk Management menüsüne gidin
2. Portfolyo metrikleri otomatik yüklenir
3. Her pozisyonun risk skorunu görün
4. Risk limitlerini ayarlayın
5. Alerts için bildirim alın
```

---

## 🔌 API Endpoints

### 1. **Master AI Signals** (4-Model Ensemble)
```typescript
GET /api/ai/master-signals?symbol=BTCUSDT&timeframe=1h

Response:
{
  "success": true,
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "predictions": {
    "lstm": { "action": "BUY", "confidence": 0.85 },
    "transformer": { "action": "BUY", "confidence": 0.82 },
    "randomForest": { "action": "BUY", "confidence": 0.78 },
    "rl": { "action": "BUY", "confidence": 0.80 }
  },
  "finalDecision": {
    "action": "BUY",
    "confidence": 0.81,
    "modelAgreement": 4
  }
}
```

### 2. **Advanced Signals** (TensorFlow + TA)
```typescript
GET /api/ai/advanced-signals?symbol=BTCUSDT

Response:
{
  "success": true,
  "signal": "BUY",
  "confidence": 0.87,
  "indicators": {
    "rsi": 45.2,
    "macd": 234.5,
    "bb_position": 0.35,
    "ema_crossover": true
  },
  "reasoning": [
    "RSI oversold condition",
    "MACD bullish crossover",
    "Price near lower Bollinger Band"
  ]
}
```

### 3. **Market Analysis** (Full TA Indicators)
```typescript
GET /api/market/analysis?symbol=BTC/USDT

Response:
{
  "success": true,
  "cryptos": [...],
  "indicators": [
    { "name": "RSI (14)", "value": 52.3, "signal": "NEUTRAL" },
    { "name": "MACD", "value": 456.7, "signal": "BUY" },
    { "name": "Bollinger Bands", "value": 67840, "signal": "NEUTRAL" }
  ],
  "sentiment": {
    "overall": "BULLISH",
    "fear_greed_index": 65
  }
}
```

### 4. **Risk Check**
```typescript
POST /api/quantum-pro/risk-check
Body: { "symbol": "BTCUSDT", "action": "BUY", "confidence": 0.85, "riskScore": 35, "price": 67840 }

Response:
{
  "success": true,
  "approved": true,
  "suggestedPositionSize": 1.5,
  "warnings": []
}
```

### 5. **Bot Management**
```typescript
// List bots
GET /api/quantum-pro/bots

// Create bot
POST /api/quantum-pro/bots
Body: { "name": "My Bot", "strategy": "Scalping", "symbol": "BTCUSDT" }

// Control bot
POST /api/quantum-pro/bots/control
Body: { "botId": "bot-001", "action": "start" }
```

---

## 🎨 Dashboard Quick Links

| Özellik | URL | Açıklama |
|---------|-----|----------|
| 🎯 AI Trading | `/ai-trading` | 4-model ensemble predictions |
| 🚀 Quantum Pro | `/quantum-pro` | Advanced AI signals & backtest |
| 📊 Market Analysis | `/market-analysis` | Full TA indicators |
| 🤖 Bot Management | `/bot-management` | Create & manage trading bots |
| 🛡️ Risk Management | `/risk-management` | Portfolio & position risk |
| 📈 Backtesting | `/backtesting` | Strategy testing |
| 📡 Signals | `/signals` | Real-time signal monitoring |

---

## 💡 Kullanım Önerileri

### Başlangıç İçin:
1. **Market Analysis** ile piyasayı tanıyın
2. **AI Trading** ile sinyal üretmeyi test edin
3. **Bot Management** ile ilk botunuzu oluşturun
4. **Risk Management** ile limitlerinizi belirleyin
5. **Quantum Pro** ile gelişmiş stratejileri keşfedin

### İleri Seviye:
1. 4-model ensemble'dan consensus sinyalleri arayın
2. Technical indicators ile AI sinyallerini doğrulayın
3. Backtest ile stratejinizi optimize edin
4. Risk limitlerini dinamik olarak ayarlayın
5. Birden fazla bot ile çeşitlendirme yapın

---

## 🔔 İpuçları

✅ **Model Agreement**: 4 modelden 3-4'ü aynı yönde ise güçlü sinyal
✅ **Confidence Threshold**: %75+ confidence skorlarını tercih edin
✅ **Risk Score**: 50'nin altında risk skorları daha güvenli
✅ **Indicator Confirmation**: En az 3 indicator aynı yönde olmalı
✅ **Backtest First**: Yeni stratejiyi önce backtest yapın
✅ **Diversify**: Tek sembole bağımlı kalmayın
✅ **Monitor Risk**: Günlük risk limitlerini aşmayın

---

## 📞 Destek

Sorularınız için: [GitHub Issues](https://github.com/sardagsoftware/borsa/issues)

**Son Güncelleme**: 2025-09-30
**Versiyon**: 1.0.0