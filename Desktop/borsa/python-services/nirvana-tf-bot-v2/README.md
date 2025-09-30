# 🧠 Nirvana TF Bot v2 - Production-Ready AI Trading Signals

**Advanced TensorFlow deep learning system for cryptocurrency trading signals.**

⚠️ **DISCLAIMER**: This system generates **BUY signals only** for educational and research purposes. It does **NOT** execute trades automatically. Not financial advice.

---

## 🎯 Features

- **✅ BUY Signals Only** - White-hat compliant, no auto-trading
- **🔄 Real-Time Data** - Binance WebSocket + REST API (read-only)
- **🧠 Advanced AI** - TCN + BiLSTM + Multi-Head Attention
- **📊 Multi-Timeframe** - 15m, 1h, 4h, 1d analysis
- **📈 Rich TA Indicators** - RSI, MACD, Bollinger Bands, ATR, EMA, SMA, VWAP, OBV
- **🐳 Docker Ready** - Complete docker-compose setup
- **🔁 24/7 Scheduler** - Automated signal generation loop
- **⚡ FastAPI** - Production-grade REST API
- **📦 MongoDB + Redis** - Persistent storage & caching
- **✅ Test Coverage** - pytest suite included

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd python-services/nirvana-tf-bot-v2
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
# Start all services (API, Scheduler, MongoDB, Redis)
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Check health
curl http://localhost:8000/healthz
```

### 3. Get Trading Signals

```bash
# Get signal for BTC
curl "http://localhost:8000/signal?symbol=BTCUSDT&timeframe=15m"

# Response:
{
  "prob_buy": 0.78,
  "decision": "BUY",
  "explain": {
    "indicators": {
      "rsi": 35.2,
      "macd_histogram": 25.3,
      "bollinger_position": "lower_band"
    },
    "threshold": 0.60,
    "votes": 4,
    "regime": "oversold_bullish"
  }
}
```

---

## 📁 Project Structure

```
nirvana-tf-bot-v2/
├── src/
│   ├── data/              # Binance REST/WS clients
│   ├── features/          # TA indicators & feature engineering
│   ├── models/            # TCN + BiLSTM + Attention model
│   ├── training/          # Training pipeline & evaluation
│   ├── backtest/          # Backtesting engine
│   ├── serving/           # FastAPI application
│   ├── scheduler/         # 24/7 signal generation loop
│   └── utils/             # Settings, logging, data pipeline
├── tests/                 # pytest test suite
├── artifacts/
│   ├── model/             # Trained models
│   └── checkpoints/       # Training checkpoints
├── data/cache/            # Parquet data cache
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── Makefile
└── README.md
```

---

## 🛠️ Local Development (without Docker)

### Install Dependencies

```bash
make install
# or
pip install -r requirements.txt
```

### Train Model

```bash
make train
# or
python -m src.training.train --data data/cache --epochs 50 --model-out artifacts/model
```

### Start API Server

```bash
make serve
# or
uvicorn src.serving.app:app --host 0.0.0.0 --port 8000 --reload
```

### Start Scheduler

```bash
make scheduler
# or
python -m src.scheduler.loop
```

### Run Backtest

```bash
make backtest
# or
python -m src.backtest.run --data data/cache --model artifacts/model --output backtest/report.json
```

### Run Tests

```bash
make test
# or
pytest tests/ -v --cov=src
```

---

## 🧠 Model Architecture

```
Input: (batch, 128, n_features)
   ↓
Conv1D (TCN-like) + BatchNorm
   ↓
Bidirectional LSTM (return_sequences=True)
   ↓
Multi-Head Self-Attention (8 heads)
   ↓
Global Average Pooling
   ↓
Dense (32) → Dense (1, sigmoid)
   ↓
Output: BUY probability (0-1)
```

**Loss**: Binary Crossentropy
**Optimizer**: Adam (lr=0.001)
**Metrics**: AUC, Precision, Recall, PR-AUC

---

## 📊 API Endpoints

### `GET /healthz`
Health check

**Response:**
```json
{
  "status": "healthy",
  "model": "NirvanaModel",
  "version": "1.0.0",
  "tensorflow_version": "2.15+"
}
```

### `GET /signal`
Generate trading signal

**Query Parameters:**
- `symbol` (required): Trading pair (e.g., "BTCUSDT")
- `timeframe` (optional): Time interval (default: "15m")

**Response:**
```json
{
  "prob_buy": 0.78,
  "decision": "BUY",
  "explain": {
    "indicators": {...},
    "threshold": 0.60,
    "votes": 4,
    "regime": "oversold_bullish"
  }
}
```

### `GET /metrics`
System metrics

**Response:**
```json
{
  "cache_hits": 1250,
  "latency_p50": 45.2,
  "latency_p95": 89.7,
  "last_model_update": "2025-01-30T12:00:00Z"
}
```

---

## 🔧 Configuration (.env)

```bash
# Model
THRESH_BUY=0.60           # Buy probability threshold
MIN_INDICATOR_CONF=3      # Min indicators confirming signal
SEQ_LEN=128               # Input sequence length

# Data
TOP_N=100                 # Number of symbols to track
TIMEFRAMES=15m,1h,4h,1d   # Timeframes to analyze

# Training
EPOCHS=50
BATCH_SIZE=64
LEARNING_RATE=0.001
```

---

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific test file
pytest tests/test_indicators.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

---

## 🚨 Production Considerations

### ✅ Security
- **Read-only**: No API keys, no order execution
- **Rate limiting**: Exponential backoff on 429 errors
- **Input validation**: FastAPI Pydantic models
- **CORS**: Configurable allowed origins

### ⚡ Performance
- **MongoDB**: Indexed queries on symbol + timeframe
- **Redis**: Signal caching (60s TTL)
- **Async I/O**: httpx, motor, websockets
- **tf.data**: Optimized data pipeline with prefetch

### 📈 Monitoring
- **Structured logging**: JSON format for log aggregation
- **Metrics endpoint**: Latency, cache hit rate
- **Health checks**: `/healthz` for load balancers

---

## 📜 License

MIT License - See LICENSE file

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## ⚠️ Risk Disclosure

This software is for **educational and research purposes only**.

- **NOT financial advice**
- **NO guarantee of profits**
- **Crypto trading involves significant risk**
- **You may lose your entire investment**
- **Use at your own risk**

The authors and contributors are not responsible for any financial losses incurred using this software.

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This README + inline code comments

---

**Built with ❤️ using TensorFlow, FastAPI, and Python 3.11**