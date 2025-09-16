# 🚀 Z.AI Advanced Trading System - Setup Guide

Bu proje, Z.AI GLM-4.5 modelini kullanarak gelişmiş yapay zeka destekli kripto para trading sistemi sunar.

## 📋 Özellikler

### 🤖 Z.AI GLM-4.5 Entegrasyonu
- Gerçek zamanlı piyasa analizi
- Portfolio analizi ve önerileri  
- Yapay zeka destekli trading senaryoları
- Market hareket yorumlama
- Güvenli API key şifreleme

### 📊 Otomatik Trading Engine
- **Momentum Scalping**: Kısa vadeli momentum yakalama
- **Trend Following**: Trend takip stratejisi
- **AI Arbitrage**: Yapay zeka destekli arbitraj
- Risk yönetimi ve stop-loss
- Gerçek zamanlı analiz döngüsü

### 🎯 Dashboard AI Manager
- Doğal dil query işleme
- Trading senaryosu kontrolü
- Piyasa insights görüntüleme
- Execution tracking
- Geçmiş analiz kayıtları

### 📈 Market Analysis AI
- Teknik gösterge analizi
- Pattern tanıma (Head & Shoulders, Double Top/Bottom vb.)
- Sentiment analizi
- Support/Resistance seviyeleri
- Volume analizi

### 🔒 Privacy & Security
- AES-256-GCM ile API key şifreleme
- Rate limiting ve audit logging
- Güvenli iletişim protokolleri
- Environment security validation

## 🛠️ Kurulum

### 1. Proje Klonlama
```bash
git clone <repository-url>
cd borsa
npm install
```

### 2. Environment Konfigürasyonu
```bash
# Environment dosyasını kopyala
cp .env.example .env.local

# Gerekli değişkenleri düzenle
nano .env.local
```

### 3. Z.AI API Key Konfigürasyonu
```bash
# Z.AI API key'inizi şifreleyin (önerilen)
node scripts/encrypt-api-key.js your_zai_api_key

# Ya da direkt kullanın (development için)
ZAI_API_KEY=your_api_key_here
```

### 4. Database Setup (Opsiyonel)
```bash
# PostgreSQL kullanıyorsanız
createdb trading_db

# Prisma migration (eğer kullanıyorsanız)
npx prisma migrate dev
```

### 5. Geliştirme Sunucusu
```bash
npm run dev
```

## 🔧 API Endpoints

### Z.AI Integration
- `POST /api/ai/query` - AI sorgu işleme
- `GET /api/ai/engine-status` - Trading engine durumu
- `GET /api/ai/trading-scenarios` - Trading senaryoları
- `GET /api/ai/market-insights` - Piyasa insights
- `POST /api/ai/market-analysis` - Piyasa analizi

### Security
- `GET /api/security/status` - Güvenlik durumu kontrolü

## 🎮 Kullanım

### 1. Dashboard'a Erişim
- Tarayıcıda `http://localhost:3000` adresine gidin
- AI Trading Manager sekmesini açın

### 2. AI Query Kullanımı
```
Örnekler:
- "BTC/USDT çiftini analiz et"
- "Portfolio durumumu değerlendir"
- "En iyi trading senaryosunu öner"
- "Piyasa sentiment'i nasıl?"
```

### 3. Auto Trading Engine
- Engine'i dashboard üzerinden aktifleştirin
- İstediğiniz senaryoları etkinleştirin
- Real-time monitoring ile takip edin

### 4. Market Analysis
- Technical indicator'ları görüntüleyin
- Pattern analysis sonuçlarını inceleyin
- Support/Resistance seviyelerini takip edin

## 🔒 Güvenlik

### API Key Güvenliği
```bash
# Master key oluştur (32+ karakter)
openssl rand -hex 32

# API key'i şifrele
node scripts/encrypt-api-key.js

# .env.local dosyasına ekle
ENCRYPTION_KEY=your_master_key
ZAI_API_KEY_ENCRYPTED=encrypted_key_here
```

### Güvenlik Kontrolü
```bash
# Güvenlik durumunu kontrol et
curl http://localhost:3000/api/security/status
```

## 📊 Monitoring

### Real-time Logs
```bash
# Development logs
npm run dev

# Production logs
pm2 logs borsa
```

### Performance Metrics
- Z.AI API response times
- Trading signal accuracy
- Risk management effectiveness
- Rate limiting status

## ⚠️ Önemli Notlar

### Production Deployment
- `NODE_ENV=production` ayarlaın
- HTTPS kullanın (`NEXTAUTH_URL=https://...`)
- Database backup stratejisi oluşturun
- Rate limiting ayarlarını kontrol edin

### Risk Management
- Auto trading'i ilk önce test net'te çalıştırın
- Position size limitlerini ayarlaın
- Stop-loss seviyelerini belirleyin
- Risk toleransınıza göre ayar yapın

### API Limits
- Z.AI: 60 request/minute (default)
- Rate limiting parametreleri ayarlanabilir
- Concurrent request limiti: 5

## 🆘 Troubleshooting

### Z.AI API Errors
```bash
# API key kontrolü
node -e "console.log(process.env.ZAI_API_KEY ? 'Key found' : 'Key missing')"

# Encryption test
node scripts/encrypt-api-key.js test_key
```

### Database Issues
```bash
# Connection test
npx prisma db push

# Reset database
npx prisma migrate reset
```

### Performance Issues
```bash
# Memory usage
node --max-old-space-size=4096 server.js

# PM2 monitoring
pm2 monit
```

## 📞 Destek

### Log Files
- Application logs: `logs/application.log`
- Error logs: `logs/error.log`
- Audit logs: `logs/audit.log`

### Debug Mode
```bash
# Debug AI requests
DEBUG_AI_REQUESTS=true npm run dev

# Debug trading signals
DEBUG_TRADING_SIGNALS=true npm run dev
```

### Community
- GitHub Issues: Bug reports ve feature requests
- Documentation: API reference ve guides

---

**⚡ Güçlü AI Trading ile karlı yatırımlar!**

*Emrah Şardağ - AiLydian Software Solutions*
